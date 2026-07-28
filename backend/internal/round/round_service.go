package round

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/queue"
	"github.com/AkifhanIlgaz/jukebox/internal/track"
	"github.com/AkifhanIlgaz/jukebox/internal/venue"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

const roundsCollectionName = "rounds"

// minCandidates, bir round'un anlamlı sayılması için gereken en az aday
// sayısı (oylama için en az iki seçenek gerekir).
const minCandidates = 2

type RoundService struct {
	roundsCollection *mongo.Collection
	redisClient      *redis.Client
	trackService     *track.TrackService
	venueService     *venue.VenueService
	queueService     *queue.QueueService
}

func NewRoundService(db *mongo.Database, redisClient *redis.Client, trackService *track.TrackService, venueService *venue.VenueService, queueService *queue.QueueService) *RoundService {
	roundsCollection := db.Collection(roundsCollectionName)

	// { venue_id: 1, status: 1 } — "bu venue'de açık tur var mı" kontrolü
	// (OpenRound'un ilk adımı); venue_id + status birlikte 0/1 sonuca düşen
	// seçici bir seek sağlıyor, tur geçmişi hiç silinmediği için önemli.
	_, err := roundsCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "venue_id", Value: 1},
			{Key: "status", Value: 1},
		},
	})
	if err != nil {
		panic(err)
	}

	// { venue_id: 1, started_at: -1 } — tur geçmişi/istatistik sorguları
	// (ör. "bu venue'nin son turları").
	_, err = roundsCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "venue_id", Value: 1},
			{Key: "started_at", Value: -1},
		},
	})
	if err != nil {
		panic(err)
	}

	return &RoundService{
		roundsCollection: roundsCollection,
		redisClient:      redisClient,
		trackService:     trackService,
		venueService:     venueService,
		queueService:     queueService,
	}
}

// scheduleFinish, bir round'un bitiş anında (endsAt) otomatik olarak
// FinishRound'u tetikleyecek bir zamanlayıcı kurar. Zamanlayıcılar yalnızca
// bellekte tutulur — sunucu yeniden başlarsa kaybolur (bilinen kısıt,
// şimdilik kapsam dışı; kalıcı bir job scheduler'a geçiş ileride
// değerlendirilebilir).
func (s *RoundService) scheduleFinish(roundId bson.ObjectID, endsAt time.Time) {
	time.AfterFunc(time.Until(endsAt), func() {
		if err := s.FinishRound(context.Background(), roundId); err != nil {
			log.Printf("round %s bitirilemedi: %v", roundId.Hex(), err)
		}
	})
}

// selectCandidates, venue'nin playlist'inden bir sonraki round için aday
// şarkıları seçer (OpenRound ve FinishRound arasında paylaşılan mantık).
func (s *RoundService) selectCandidates(ctx context.Context, venueId bson.ObjectID, venue *venue.Venue) ([]Candidate, []string, error) {
	candidateCooldownCutoff := time.Now().Add(-time.Duration(venue.Settings.CandidateCooldownMin) * time.Minute)

	playlistTracks, err := s.trackService.RandomCandidates(ctx, venueId, candidateCooldownCutoff, venue.Settings.CandidateCount)
	if err != nil {
		return nil, nil, err
	}

	candidates := make([]Candidate, 0, len(playlistTracks))
	youtubeIds := make([]string, 0, len(playlistTracks))
	for _, playlistTrack := range playlistTracks {
		candidates = append(candidates, CandidateFromPlaylistTrack(playlistTrack))
		youtubeIds = append(youtubeIds, playlistTrack.YoutubeID)
	}

	return candidates, youtubeIds, nil
}

// OpenRound, venue için yeni bir oylama turu başlatır. Şimdilik admin
// panelden manuel REST çağrısıyla tetikleniyor (ileride kapanan turdan
// sonraki ilk şarkı çalmaya başlayınca otomatik açılacak — bkz.
// decisions.md). Venue'de zaten status:"open" bir tur varsa
// ErrRoundAlreadyOpen, playlist'te yeterli (minCandidates'tan az) aday
// yoksa ErrNotEnoughTracks döner.
func (s *RoundService) OpenRound(ctx context.Context, venueId bson.ObjectID) (*Round, error) {
	filter := bson.M{
		"venue_id": venueId,
		"status":   StatusOpen,
	}

	activeRound, err := s.roundsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	if activeRound > 0 {
		return nil, ErrRoundAlreadyOpen
	}

	venue, err := s.venueService.GetByID(ctx, venueId)
	if err != nil {
		return nil, err
	}

	candidates, youtubeIds, err := s.selectCandidates(ctx, venueId, venue)
	if err != nil {
		return nil, err
	}

	if len(candidates) < minCandidates {
		return nil, ErrNotEnoughTracks
	}

	now := time.Now()
	round := &Round{
		ID:         bson.NewObjectID(),
		VenueID:    venueId,
		Status:     StatusOpen,
		StartedAt:  now,
		EndsAt:     now.Add(time.Duration(venue.Settings.RoundIntervalMin) * time.Minute),
		Candidates: candidates,
	}

	if _, err := s.roundsCollection.InsertOne(ctx, round); err != nil {
		return nil, err
	}

	if err := s.trackService.MarkCandidates(ctx, venueId, youtubeIds); err != nil {
		return nil, err
	}

	if err := s.redisClient.Del(ctx, votesKey(round.ID)).Err(); err != nil {
		return nil, err
	}

	s.scheduleFinish(round.ID, round.EndsAt)

	return round, nil
}

// CloseRound, açık bir round'u süresi dolmadan manuel olarak kapatır:
// kazanan seçmeden status'u closed yapar ve round'un redis oylarını siler.
// Bir sonraki round'u AÇMAZ (FinishRound'un aksine) — admin tekrar hazır
// olduğunda OpenRound'u kendisi çağırır. scheduleFinish ile kurulmuş
// zamanlayıcı burada iptal edilmiyor (referansı tutulmuyor); onun yerine
// güncelleme `status: open` koşuluyla yapılıyor ve FinishRound artık
// zaten kapalı bir round'da no-op oluyor (bkz. FinishRound'daki status
// guard) — zamanlayıcı ileride ateşlense de zararsız.
func (s *RoundService) CloseRound(ctx context.Context, venueId bson.ObjectID) (*Round, error) {
	round, err := s.FindActiveRound(ctx, venueId)
	if err != nil {
		return nil, err
	}

	result, err := s.roundsCollection.UpdateOne(ctx, bson.M{
		"_id":    round.ID,
		"status": StatusOpen,
	}, bson.M{
		"$set": bson.M{"status": StatusClosed},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to close round: %w", err)
	}
	if result.ModifiedCount == 0 {
		// FinishRound ile eş zamanlı kapanmış olabilir (race) — artık açık değil.
		return nil, ErrNoOpenRound
	}

	if err := s.redisClient.Del(ctx, votesKey(round.ID)).Err(); err != nil {
		return nil, fmt.Errorf("failed to clear round votes: %w", err)
	}

	round.Status = StatusClosed

	return round, nil
}

func (s *RoundService) FindActiveRound(ctx context.Context, venueId bson.ObjectID) (*Round, error) {
	filter := bson.M{
		"venue_id": venueId,
		"status":   StatusOpen,
	}

	var round Round
	err := s.roundsCollection.FindOne(ctx, filter).Decode(&round)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNoOpenRound
		}
		return nil, err
	}

	return &round, nil
}

// FinishRound, bir round'un süresi dolduğunda (OpenRound/FinishRound'un
// kurduğu scheduleFinish zamanlayıcısı üzerinden) tetiklenir. Round'u
// kapatır, kazananı hiç beklemeden kuyruğa ekler (böylece hemen çalmaya
// başlar) ve arada boşluk bırakmadan bir sonraki round'u hemen açıp kendi
// bitişini tetikleyecek zamanlayıcıya bağlar — döngü böyle kendi kendini
// besleyerek sürer.
//
// NOT: WebSocket ile sonuç/round bilgisini client'lara gönderme kısmı bu
// implementasyonda YOK (WS zaten decisions.md'de ertelenmiş durumda).
func (s *RoundService) FinishRound(ctx context.Context, roundId bson.ObjectID) error {
	var round Round
	if err := s.roundsCollection.FindOne(ctx, bson.M{"_id": roundId}).Decode(&round); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrRoundNotFound
		}
		return fmt.Errorf("failed to fetch round: %w", err)
	}

	// Zamanlayıcı yanlışlıkla erken tetiklenirse (ör. yeniden başlatma
	// sonrası çakışan bir zamanlayıcı) round'u bozmamak için guard.
	if time.Now().Before(round.EndsAt) {
		return nil
	}

	// Round CloseRound ile manuel kapatılmış olabilir — o durumda scheduleFinish
	// zamanlayıcısı (referansı tutulmadığı için iptal edilemiyor) yine de
	// ateşlenir, burada no-op olması gerekir.
	if round.Status != StatusOpen {
		return nil
	}

	results, err := s.redisClient.ZRevRangeWithScores(ctx, votesKey(roundId), 0, -1).Result()
	if err != nil {
		return fmt.Errorf("failed to fetch round votes: %w", err)
	}

	voteCounts := make(map[string]int, len(results))
	for _, result := range results {
		if youtubeId, ok := result.Member.(string); ok {
			voteCounts[youtubeId] = int(result.Score)
		}
	}

	maxVotes := -1
	var winners []string
	for i := range round.Candidates {
		votes := voteCounts[round.Candidates[i].YoutubeID]
		round.Candidates[i].Votes = votes

		switch {
		case votes > maxVotes:
			maxVotes = votes
			winners = []string{round.Candidates[i].YoutubeID}
		case votes == maxVotes:
			winners = append(winners, round.Candidates[i].YoutubeID)
		}
	}

	// Beraberlik: rastgele (bkz. decisions.md 2026-07-12). Round'da hiç
	// oy yoksa (hepsi 0) tüm adaylar "berabere" sayılır, yine rastgele
	// seçilir.
	winnerYoutubeId := winners[rand.Intn(len(winners))]

	if _, err := s.roundsCollection.UpdateOne(ctx, bson.M{"_id": roundId}, bson.M{
		"$set": bson.M{
			"status":            StatusClosed,
			"candidates":        round.Candidates,
			"winner_youtube_id": winnerYoutubeId,
		},
	}); err != nil {
		return fmt.Errorf("failed to close round: %w", err)
	}

	if err := s.queueService.Enqueue(ctx, round.VenueID, winnerYoutubeId); err != nil && !errors.Is(err, queue.ErrTrackAlreadyQueued) {
		return fmt.Errorf("failed to enqueue round winner: %w", err)
	}

	if err := s.redisClient.Del(ctx, votesKey(roundId)).Err(); err != nil {
		return fmt.Errorf("failed to clear round votes: %w", err)
	}

	// Bir sonraki round'u açmak için OpenRound'u tekrar kullanıyoruz — bu
	// round az önce closed yapıldığı için OpenRound'un "zaten açık round
	// var mı" kontrolü buraya engel olmuyor, ve aday seçimi/insert/
	// scheduleFinish mantığını tekrarlamamış oluyoruz.
	if _, err := s.OpenRound(ctx, round.VenueID); err != nil {
		if errors.Is(err, ErrNotEnoughTracks) {
			// Playlist yeterli aday vermiyor (ör. tüm şarkılar cooldown'da)
			// — round döngüsü burada duruyor; admin manuel olarak tekrar
			// başlatana kadar yeni round açılmaz.
			log.Printf("round %s: yeni round açılamadı, yeterli aday yok", round.VenueID.Hex())
			return nil
		}
		return fmt.Errorf("failed to open next round: %w", err)
	}

	return nil
}
