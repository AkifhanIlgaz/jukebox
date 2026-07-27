package track

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/youtube"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const tracksCollectionName = "tracks"
const playlistsCollectionName = "playlists"

type TrackService struct {
	tracksCollection    *mongo.Collection
	playlistsCollection *mongo.Collection
	youtubeClient       *youtube.Client
}

func NewTrackService(db *mongo.Database, youtubeClient *youtube.Client) *TrackService {
	tracksCollection := db.Collection(tracksCollectionName)
	playlistsCollection := db.Collection(playlistsCollectionName)

	_, err := tracksCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "youtube_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		panic(err)
	}

	_, err = playlistsCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "youtube_id", Value: 1},
			{Key: "venue_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		panic(err)
	}

	return &TrackService{
		tracksCollection:    tracksCollection,
		playlistsCollection: playlistsCollection,
		youtubeClient:       youtubeClient,
	}
}

func (s *TrackService) InsertTrack(ctx context.Context, req AddTrackRequest) error {
	playlistTrack := req.ToPlaylistTrack()
	trackInfo, err := s.youtubeClient.ExtractTrackInfo(playlistTrack.YoutubeID)
	if err != nil {
		return fmt.Errorf("failed to extract track info: %w", err)
	}

	playlistTrack.Title = trackInfo.Title
	playlistTrack.Channel = trackInfo.Channel

	_, err = s.playlistsCollection.InsertOne(ctx, playlistTrack)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrTrackAlreadyExists
		}
		return err
	}

	filter := bson.M{
		"youtube_id": playlistTrack.YoutubeID,
	}

	update := bson.M{
		"$inc": bson.M{
			"number_of_venues": 1,
		},
	}

	updateResult, err := s.tracksCollection.UpdateOne(
		ctx,
		filter,
		update,
	)
	if err != nil {
		return fmt.Errorf("failed to increment track venue count: %w", err)
	}
	if updateResult.MatchedCount > 0 {
		return nil
	}

	_, err = s.tracksCollection.InsertOne(ctx, Track{
		YoutubeID:      playlistTrack.YoutubeID,
		NumberOfVenues: 1,
	})
	if err != nil {
		return fmt.Errorf("failed to insert track: %w", err)
	}

	return nil
}

func (s *TrackService) GetVenueTracks(ctx context.Context, venueId bson.ObjectID, req GetVenueTracksRequest) (*PaginatedTracksResponse, error) {
	filter := bson.M{
		"venue_id": venueId,
	}

	total, err := s.playlistsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to count venue tracks: %w", err)
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(req.Skip()).
		SetLimit(int64(req.Limit))

	cursor, err := s.playlistsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch venue tracks: %w", err)
	}
	defer cursor.Close(ctx)

	tracks := []PlaylistTrack{}
	if err := cursor.All(ctx, &tracks); err != nil {
		return nil, fmt.Errorf("failed to decode venue tracks: %w", err)
	}

	totalPages := int(total) / req.Limit
	if int(total)%req.Limit != 0 {
		totalPages++
	}

	return &PaginatedTracksResponse{
		Tracks:     tracks,
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func (s *TrackService) DeleteTrack(ctx context.Context, venueId, trackId bson.ObjectID) error {
	filter := bson.M{
		"_id":      trackId,
		"venue_id": venueId,
	}

	var playlistTrack PlaylistTrack
	if err := s.playlistsCollection.FindOneAndDelete(ctx, filter).Decode(&playlistTrack); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrTrackNotFound
		}
		return fmt.Errorf("failed to delete venue track: %w", err)
	}

	update := bson.M{
		"$inc": bson.M{
			"number_of_venues": -1,
		},
	}

	if _, err := s.tracksCollection.UpdateOne(ctx, bson.M{"youtube_id": playlistTrack.YoutubeID}, update); err != nil {
		return fmt.Errorf("failed to decrement track venue count: %w", err)
	}

	return nil
}

// TrackExistsInPlaylist, YouTube'a hiç istek atmadan (sadece Mongo'ya
// bakarak) bir track'in venue'nin playlist'inde olup olmadığını döner.
func (s *TrackService) TrackExistsInPlaylist(ctx context.Context, venueId bson.ObjectID, youtubeId string) (bool, error) {
	count, err := s.playlistsCollection.CountDocuments(ctx, bson.M{
		"venue_id":   venueId,
		"youtube_id": youtubeId,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check track existence: %w", err)
	}

	return count > 0, nil
}

func (s *TrackService) GetTrackByYoutubeId(ctx context.Context, venueId bson.ObjectID, youtubeId string) (*PlaylistTrack, error) {
	filter := bson.M{
		"venue_id":   venueId,
		"youtube_id": youtubeId,
	}

	var playlistTrack PlaylistTrack
	if err := s.playlistsCollection.FindOne(ctx, filter).Decode(&playlistTrack); err != nil {
		if !errors.Is(err, mongo.ErrNoDocuments) {
			return nil, fmt.Errorf("failed to fetch track: %w", err)
		}

		// Playlist'te bulunamadı (ör. Redis'teki sıra/geçmiş kaydı playlist'ten
		// silinmiş bir şarkıya işaret ediyor olabilir) — YouTube'dan taze bilgi
		// çekip stale referansı yine de kullanılabilir kılıyoruz.
		trackInfo, err := s.youtubeClient.ExtractTrackInfo(youtubeId)
		if err != nil {
			return nil, ErrTrackNotFound
		}

		return &PlaylistTrack{
			YoutubeID: youtubeId,
			Title:     trackInfo.Title,
			Channel:   trackInfo.Channel,
			VenueID:   venueId,
		}, nil
	}

	return &playlistTrack, nil
}

// RandomTrack, venue playlist'inden rastgele bir şarkı döner. cooldownCutoff
// verilirse (`time.Time`'ın zero olmayan hali) `last_played_at` bu zamandan
// önce olan (veya hiç çalınmamış, last_played_at == nil) şarkılarla sınırlanır
// — yani "son cooldownMin dakikada çalınmadı" filtresi.
//
// Cooldown filtresi sonucu boş dönerse (ör. playlist küçük ve tüm şarkılar
// yakın zamanda çalındıysa) filtre yok sayılır, en eski çalınan/hiç
// çalınmamış şarkı fallback olarak döndürülür (decisions.md 2026-07-12'deki
// gevşetme kuralının genellemesi). Playlist gerçekten boşsa ErrNoAvailableTrack
// döner.
func (s *TrackService) RandomTrack(ctx context.Context, venueId bson.ObjectID, cooldownCutoff time.Time) (*PlaylistTrack, error) {
	filter := bson.M{
		"venue_id": venueId,
	}
	if !cooldownCutoff.IsZero() {
		filter["$or"] = bson.A{
			bson.M{"last_played_at": nil},
			bson.M{"last_played_at": bson.M{"$lt": cooldownCutoff}},
		}
	}

	pipeline := bson.A{
		bson.M{"$match": filter},
		bson.M{"$sample": bson.M{"size": 1}},
	}

	cursor, err := s.playlistsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to find playlist: %w", err)
	}
	defer cursor.Close(ctx)

	if cursor.Next(ctx) {
		var track PlaylistTrack
		if err := cursor.Decode(&track); err != nil {
			return nil, fmt.Errorf("failed to decode track: %w", err)
		}
		return &track, nil
	}

	if !cooldownCutoff.IsZero() {
		return s.oldestPlayedTrack(ctx, venueId)
	}

	return nil, ErrNoAvailableTrack
}

// oldestPlayedTrack, cooldown filtresi playlist'i boşalttığında kullanılan
// fallback: last_played_at'a göre ascending sıralanır — nil (hiç çalınmamış)
// değerler Mongo'da en küçük sayıldığından otomatik olarak öne düşer.
func (s *TrackService) oldestPlayedTrack(ctx context.Context, venueId bson.ObjectID) (*PlaylistTrack, error) {
	opts := options.FindOne().SetSort(bson.D{{Key: "last_played_at", Value: 1}})

	var track PlaylistTrack
	err := s.playlistsCollection.FindOne(ctx, bson.M{"venue_id": venueId}, opts).Decode(&track)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNoAvailableTrack
		}
		return nil, fmt.Errorf("failed to find oldest played track: %w", err)
	}

	return &track, nil
}

// MarkPlayed, bir şarkı çalmaya başladığında last_played_at'ı günceller
// (cooldown filtresi bu alana bakıyor — bkz. RandomTrack). Önceden Redis
// recent-list'e LPUSH olarak yapılıyordu (bkz. decisions.md 2026-07-26).
func (s *TrackService) MarkPlayed(ctx context.Context, venueId bson.ObjectID, youtubeId string) error {
	filter := bson.M{
		"venue_id":   venueId,
		"youtube_id": youtubeId,
	}

	update := bson.M{
		"$set": bson.M{
			"last_played_at": time.Now(),
		},
	}

	res, err := s.playlistsCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to mark played: %w", err)
	}

	if res.MatchedCount == 0 {
		return ErrTrackNotFound
	}

	return nil
}
