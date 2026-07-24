package track

import (
	"context"
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

	_, err := s.playlistsCollection.InsertOne(ctx, playlistTrack)
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

	trackInfo, err := s.youtubeClient.ExtractTrackInfo(playlistTrack.YoutubeID)
	if err != nil {
		return fmt.Errorf("failed to extract track info: %w", err)
	}

	_, err = s.tracksCollection.InsertOne(ctx, Track{
		YoutubeID:      playlistTrack.YoutubeID,
		Title:          trackInfo.Title,
		Channel:        trackInfo.Channel,
		NumberOfVenues: 1,
	})
	if err != nil {
		return fmt.Errorf("failed to insert track: %w", err)
	}

	return nil
}
