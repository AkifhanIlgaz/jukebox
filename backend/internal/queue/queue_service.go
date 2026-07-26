package queue

import (
	"context"
	"errors"
	"fmt"

	"github.com/AkifhanIlgaz/jukebox/internal/track"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// recentWindow, "son N çalınan" penceresinin boyutu (round'un aday
// seçiminde hariç tutulacak track sayısı).
const recentWindow = 20

type QueueService struct {
	redisClient  *redis.Client
	trackService *track.TrackService
}

func NewQueueService(redisClient *redis.Client, trackService *track.TrackService) *QueueService {
	return &QueueService{
		redisClient:  redisClient,
		trackService: trackService,
	}
}

// Enqueue, tur kazananını venue'nin çalma sırasına ekler.
func (s *QueueService) Enqueue(ctx context.Context, venueId bson.ObjectID, youtubeId string) error {
	if err := s.redisClient.RPush(ctx, queueKey(venueId), youtubeId).Err(); err != nil {
		return fmt.Errorf("failed to enqueue track: %w", err)
	}

	return nil
}

// Len, sıradaki bekleyen şarkı sayısını döner.
func (s *QueueService) Len(ctx context.Context, venueId bson.ObjectID) (int64, error) {
	length, err := s.redisClient.LLen(ctx, queueKey(venueId)).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get queue length: %w", err)
	}

	return length, nil
}

// MarkPlayed, bir şarkı çalmaya başladığında son-çalınanlar listesine ekler
// (recentWindow'u aşınca en eski kayıt düşer).
func (s *QueueService) MarkPlayed(ctx context.Context, venueId bson.ObjectID, youtubeId string) error {
	key := recentKey(venueId)

	_, err := s.redisClient.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.LPush(ctx, key, youtubeId)
		pipe.LTrim(ctx, key, 0, recentWindow-1)
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to mark track as played: %w", err)
	}

	return nil
}

// IsRecentlyPlayed, track'in son-çalınanlar penceresinde olup olmadığını döner.
func (s *QueueService) IsRecentlyPlayed(ctx context.Context, venueId bson.ObjectID, youtubeId string) (bool, error) {
	_, err := s.redisClient.LPos(ctx, recentKey(venueId), youtubeId, redis.LPosArgs{}).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check recently played track: %w", err)
	}

	return true, nil
}

// Next, sıradaki şarkıyı döner: sıra doluysa LPOP, boşsa playlistten
// rastgele fallback seçer (son çalınanlar hariç). İkisi de boşsa
// ErrNoPlayableTrack döner.
func (s *QueueService) Next(ctx context.Context, venueId bson.ObjectID) (*track.PlaylistTrack, error) {
	youtubeId, err := s.redisClient.LPop(ctx, queueKey(venueId)).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return nil, fmt.Errorf("failed to pop next track from queue: %w", err)
	}

	if err == nil {
		playlistTrack, err := s.trackService.GetTrackByYoutubeId(ctx, venueId, youtubeId)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch queued track: %w", err)
		}

		if err := s.MarkPlayed(ctx, venueId, youtubeId); err != nil {
			return nil, err
		}

		return playlistTrack, nil
	}

	excludeYoutubeIds, err := s.redisClient.LRange(ctx, recentKey(venueId), 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch recently played tracks: %w", err)
	}

	playlistTrack, err := s.trackService.RandomTrack(ctx, venueId, excludeYoutubeIds)
	if err != nil {
		if errors.Is(err, track.ErrNoAvailableTrack) {
			return nil, ErrNoPlayableTrack
		}
		return nil, fmt.Errorf("failed to fetch fallback track: %w", err)
	}

	if err := s.MarkPlayed(ctx, venueId, playlistTrack.YoutubeID); err != nil {
		return nil, err
	}

	return playlistTrack, nil
}

// List, sıradaki şarkıları (henüz çalınmamış, sırayla) döner.
func (s *QueueService) List(ctx context.Context, venueId bson.ObjectID) ([]track.PlaylistTrack, error) {
	youtubeIds, err := s.redisClient.LRange(ctx, queueKey(venueId), 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to list queue: %w", err)
	}

	tracks := make([]track.PlaylistTrack, 0, len(youtubeIds))
	for _, youtubeId := range youtubeIds {
		playlistTrack, err := s.trackService.GetTrackByYoutubeId(ctx, venueId, youtubeId)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch queued track: %w", err)
		}
		tracks = append(tracks, *playlistTrack)
	}

	return tracks, nil
}

// EnqueueManual, admin panelden elle eklenen bir şarkıyı venue playlist'ine
// (henüz yoksa) ekler ve sıraya alır.
func (s *QueueService) EnqueueManual(ctx context.Context, req track.AddTrackRequest) error {
	if err := s.trackService.InsertTrack(ctx, req); err != nil && !errors.Is(err, track.ErrTrackAlreadyExists) {
		return fmt.Errorf("failed to add track to playlist: %w", err)
	}

	return s.Enqueue(ctx, req.VenueId, req.YoutubeVideoID)
}
