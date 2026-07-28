package queue

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/track"
	"github.com/AkifhanIlgaz/jukebox/internal/venue"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// queuePreviewLimit, GET /queue'nun döndürdüğü maksimum şarkı sayısı
// (toplam sayı ayrıca dönülür, liste bu kadarla sınırlıdır).
const queuePreviewLimit = 5

type QueueService struct {
	redisClient  *redis.Client
	trackService *track.TrackService
	venueService *venue.VenueService
}

func NewQueueService(redisClient *redis.Client, trackService *track.TrackService, venueService *venue.VenueService) *QueueService {
	return &QueueService{
		redisClient:  redisClient,
		trackService: trackService,
		venueService: venueService,
	}
}

// Enqueue, tur kazananını venue'nin çalma sırasına ekler. Şarkı zaten
// sıradaysa ErrTrackAlreadyQueued döner (sıradaki şarkılar benzersizdir).
func (s *QueueService) Enqueue(ctx context.Context, venueId bson.ObjectID, youtubeId string) error {
	_, err := s.redisClient.LPos(ctx, queueKey(venueId), youtubeId, redis.LPosArgs{}).Result()
	if err == nil {
		return ErrTrackAlreadyQueued
	}
	if !errors.Is(err, redis.Nil) {
		return fmt.Errorf("failed to check queued track: %w", err)
	}

	if err := s.redisClient.RPush(ctx, queueKey(venueId), youtubeId).Err(); err != nil {
		return fmt.Errorf("failed to enqueue track: %w", err)
	}

	return nil
}

// Remove, sıradan bir şarkıyı çıkarır. Şarkı sırada değilse
// ErrTrackNotQueued döner.
func (s *QueueService) Remove(ctx context.Context, venueId bson.ObjectID, youtubeId string) error {
	removed, err := s.redisClient.LRem(ctx, queueKey(venueId), 0, youtubeId).Result()
	if err != nil {
		return fmt.Errorf("failed to remove track from queue: %w", err)
	}
	if removed == 0 {
		return ErrTrackNotQueued
	}

	return nil
}

// ClearQueue, venue'nin tüm sırasını sıfırlar (redis'teki queueKey listesini
// tamamen boşaltır).
func (s *QueueService) ClearQueue(ctx context.Context, venueId bson.ObjectID) error {
	if err := s.redisClient.Del(ctx, queueKey(venueId)).Err(); err != nil {
		return fmt.Errorf("failed to clear queue: %w", err)
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

// Next, sıradaki şarkıyı döner: sıra doluysa LPOP, boşsa playlistten
// rastgele fallback seçer (son çalınanlar hariç). Sıradaki bir kayıt
// çözülemezse (ör. hem playlist'ten hem YouTube'dan silinmiş) o kayıt
// atlanıp bir sonrakiyle devam edilir. Hiçbiri çözülemez ve sıra
// tükenirse fallback'e düşülür, o da başarısızsa ErrNoPlayableTrack
// döner.
func (s *QueueService) Next(ctx context.Context, venueId bson.ObjectID) (*track.PlaylistTrack, error) {
	for {
		youtubeId, err := s.redisClient.LPop(ctx, queueKey(venueId)).Result()
		if err != nil {
			if errors.Is(err, redis.Nil) {
				break
			}
			return nil, fmt.Errorf("failed to pop next track from queue: %w", err)
		}

		playlistTrack, err := s.trackService.GetTrackByYoutubeId(ctx, venueId, youtubeId)
		if err != nil {
			continue
		}

		if err := s.trackService.MarkPlayed(ctx, venueId, youtubeId); err != nil {
			return nil, err
		}

		return playlistTrack, nil
	}

	venue, err := s.venueService.GetByID(ctx, venueId)
	if err != nil {
		return nil, fmt.Errorf("failed to get venue: %w", err)
	}

	cooldownCutoff := time.Now().Add(-time.Duration(venue.Settings.RecentlyPlayedCooldownMin) * time.Minute)

	playlistTrack, err := s.trackService.RandomTrack(ctx, venueId, cooldownCutoff)
	if err != nil {
		if errors.Is(err, track.ErrNoAvailableTrack) {
			return nil, ErrNoPlayableTrack
		}
		return nil, fmt.Errorf("failed to fetch fallback track: %w", err)
	}

	if err := s.trackService.MarkPlayed(ctx, venueId, playlistTrack.YoutubeID); err != nil {
		return nil, err
	}

	return playlistTrack, nil
}

// List, sıradaki şarkıları (henüz çalınmamış, sırayla) döner.
func (s *QueueService) List(ctx context.Context, venueId bson.ObjectID) ([]track.PlaylistTrack, int64, error) {
	youtubeIds, err := s.redisClient.LRange(ctx, queueKey(venueId), 0, queuePreviewLimit-1).Result()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list queue: %w", err)
	}

	total, err := s.Len(ctx, venueId)
	if err != nil {
		return nil, 0, err
	}

	tracks := make([]track.PlaylistTrack, 0, len(youtubeIds))
	for _, youtubeId := range youtubeIds {
		playlistTrack, err := s.trackService.GetTrackByYoutubeId(ctx, venueId, youtubeId)
		if err != nil {
			continue
		}
		tracks = append(tracks, *playlistTrack)
	}

	return tracks, total, nil
}

// ListBySlug, müşterinin /v/{slug} sayfasının public queue endpoint'i için
// slug'tan venue'yu çözüp List'i çağırır.
func (s *QueueService) ListBySlug(ctx context.Context, slug string) ([]track.PlaylistTrack, int64, error) {
	v, err := s.venueService.GetBySlug(ctx, slug)
	if err != nil {
		return nil, 0, err
	}

	return s.List(ctx, v.ID)
}

// EnqueueManual, admin panelden elle eklenen bir şarkıyı venue playlist'ine
// (henüz yoksa) ekler ve sıraya alır.
func (s *QueueService) EnqueueManual(ctx context.Context, req track.AddTrackRequest) error {
	exists, err := s.trackService.TrackExistsInPlaylist(ctx, req.VenueId, req.YoutubeVideoID)
	if err != nil {
		return err
	}

	if !exists {
		if err := s.trackService.InsertTrack(ctx, req); err != nil && !errors.Is(err, track.ErrTrackAlreadyExists) {
			return fmt.Errorf("failed to add track to playlist: %w", err)
		}
	}

	return s.Enqueue(ctx, req.VenueId, req.YoutubeVideoID)
}
