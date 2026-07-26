package queue

import (
	"context"

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
func (s *QueueService) Enqueue(ctx context.Context, venueId, trackId bson.ObjectID) error {
	panic("not implemented")
}

// Len, sıradaki bekleyen şarkı sayısını döner.
func (s *QueueService) Len(ctx context.Context, venueId bson.ObjectID) (int64, error) {
	panic("not implemented")
}

// MarkPlayed, bir şarkı çalmaya başladığında son-çalınanlar listesine ekler
// (recentWindow'u aşınca en eski kayıt düşer).
func (s *QueueService) MarkPlayed(ctx context.Context, venueId, trackId bson.ObjectID) error {
	panic("not implemented")
}

// IsRecentlyPlayed, track'in son-çalınanlar penceresinde olup olmadığını döner.
func (s *QueueService) IsRecentlyPlayed(ctx context.Context, venueId, trackId bson.ObjectID) (bool, error) {
	panic("not implemented")
}

// Next, sıradaki şarkıyı döner: sıra doluysa LPOP, boşsa playlistten
// rastgele fallback seçer (son çalınanlar hariç). İkisi de boşsa
// ErrNoPlayableTrack döner.
func (s *QueueService) Next(ctx context.Context, venueId bson.ObjectID) (*track.PlaylistTrack, error) {
	panic("not implemented")
}
