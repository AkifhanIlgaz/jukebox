package track

import (
	"context"
	"errors"
	"fmt"

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

func (s *TrackService) RandomTrack(ctx context.Context, venueId bson.ObjectID, excludeYoutubeIds []string) (*PlaylistTrack, error) {
	filter := bson.M{
		"venue_id": venueId,
		"youtube_id": bson.M{
			"$nin": excludeYoutubeIds,
		},
	}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: filter}},
		bson.D{{Key: "$sample", Value: bson.D{{Key: "size", Value: 1}}}},
	}

	cursor, err := s.playlistsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch random track: %w", err)
	}
	defer cursor.Close(ctx)

	if !cursor.Next(ctx) {
		return nil, ErrNoAvailableTrack
	}

	var playlistTrack PlaylistTrack
	if err := cursor.Decode(&playlistTrack); err != nil {
		return nil, fmt.Errorf("failed to decode random track: %w", err)
	}

	return &playlistTrack, nil
}
