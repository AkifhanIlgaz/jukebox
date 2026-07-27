package round

import (
	"context"
	"time"

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
}

func NewRoundService(db *mongo.Database, redisClient *redis.Client, trackService *track.TrackService, venueService *venue.VenueService) *RoundService {
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
	}
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

	candidateCooldownCutoff := time.Now().Add(-time.Duration(venue.Settings.CandidateCooldownMin) * time.Minute)

	playlistTracks, err := s.trackService.RandomCandidates(ctx, venueId, candidateCooldownCutoff, venue.Settings.CandidateCount)
	if err != nil {
		return nil, err
	}

	if len(playlistTracks) < minCandidates {
		return nil, ErrNotEnoughTracks
	}

	candidates := make([]Candidate, 0, len(playlistTracks))
	youtubeIds := make([]string, 0, len(playlistTracks))
	for _, playlistTrack := range playlistTracks {
		candidates = append(candidates, CandidateFromPlaylistTrack(playlistTrack))
		youtubeIds = append(youtubeIds, playlistTrack.YoutubeID)
	}

	now := time.Now()
	round := &Round{
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
