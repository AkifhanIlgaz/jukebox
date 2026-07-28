package venue

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const venuesCollectionName = "venues"

type VenueService struct {
	venuesCollection *mongo.Collection
	redisClient      *redis.Client
}

func NewVenueService(db *mongo.Database, redisClient *redis.Client) *VenueService {
	venuesCollection := db.Collection(venuesCollectionName)

	_, err := venuesCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "slug", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		panic(err)
	}

	return &VenueService{
		venuesCollection: venuesCollection,
		redisClient:      redisClient,
	}
}

// CreateVenue mekanı ekler. Slug çakışırsa ("kahve-duragi" doluysa) sonek eklenerek
// ("kahve-duragi-2") tekrar denenir (karar: decisions.md 2026-07-12, kayıt modeli).
func (s *VenueService) CreateVenue(ctx context.Context, req CreateVenueRequest) (*Venue, error) {
	venue := req.ToVenue()
	baseSlug := venue.Slug

	for attempt := 1; ; attempt++ {
		if attempt > 1 {
			venue.Slug = fmt.Sprintf("%s-%d", baseSlug, attempt)
		}

		_, err := s.venuesCollection.InsertOne(ctx, venue)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				continue
			}
			return nil, fmt.Errorf("failed to insert venue: %w", err)
		}

		return venue, nil
	}
}

// GetByID, queue/round servislerinin cooldown/tur ayarları gibi
// venue.settings alanlarına erişmesi için kullanılır.
func (s *VenueService) GetByID(ctx context.Context, venueId bson.ObjectID) (*Venue, error) {
	filter := bson.M{"_id": venueId}

	var venue Venue
	err := s.venuesCollection.FindOne(ctx, filter).Decode(&venue)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrVenueNotFound
		}

		return nil, fmt.Errorf("failed to get venue: %w", err)
	}

	return &venue, nil
}

// GetBySlug, müşterinin QR ile açtığı /v/{slug} public sayfası ve queue/round
// public endpoint'lerinin venue çözümlemesi için kullanılır (auth gerektirmez).
func (s *VenueService) GetBySlug(ctx context.Context, slug string) (*Venue, error) {
	filter := bson.M{"slug": slug}

	var venue Venue
	err := s.venuesCollection.FindOne(ctx, filter).Decode(&venue)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrVenueNotFound
		}

		return nil, fmt.Errorf("failed to get venue by slug: %w", err)
	}

	return &venue, nil
}

// GetNowPlaying, admin panelin player'ının en son raporladığı şu an çalan
// şarkının YouTube ID'sini döner; hiç raporlanmamışsa boş string döner.
func (s *VenueService) GetNowPlaying(ctx context.Context, venueId bson.ObjectID) (string, error) {
	youtubeId, err := s.redisClient.Get(ctx, nowPlayingKey(venueId)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", nil
		}

		return "", fmt.Errorf("failed to get now playing: %w", err)
	}

	return youtubeId, nil
}

// UpdateVenue, admin panelden mekan adı/logosu ve tur ayarlarını günceller.
// Slug değişmez.
func (s *VenueService) UpdateVenue(ctx context.Context, venueId bson.ObjectID, req UpdateVenueRequest) (*Venue, error) {
	filter := bson.M{"_id": venueId}
	update := bson.M{
		"$set": bson.M{
			"name":       req.Name,
			"logo_url":   req.LogoURL,
			"settings":   req.Settings,
			"updated_at": time.Now(),
		},
	}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)

	var venue Venue
	err := s.venuesCollection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&venue)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrVenueNotFound
		}

		return nil, fmt.Errorf("failed to update venue: %w", err)
	}

	return &venue, nil
}

// SetNowPlaying, admin panelin player'ında bir şarkı çalmaya başladığında
// Redis'e yazılır; müşteri tarafının "şu an çalıyor" bilgisini okuyacağı yer
// burasıdır.
func (s *VenueService) SetNowPlaying(ctx context.Context, venueId bson.ObjectID, youtubeId string) error {
	if err := s.redisClient.Set(ctx, nowPlayingKey(venueId), youtubeId, 0).Err(); err != nil {
		return fmt.Errorf("failed to set now playing: %w", err)
	}

	return nil
}

// ClearNowPlaying, çalan şarkı bitince (ended) veya oynatılamayınca (error)
// çağrılır.
func (s *VenueService) ClearNowPlaying(ctx context.Context, venueId bson.ObjectID) error {
	if err := s.redisClient.Del(ctx, nowPlayingKey(venueId)).Err(); err != nil {
		return fmt.Errorf("failed to clear now playing: %w", err)
	}

	return nil
}
