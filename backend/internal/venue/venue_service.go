package venue

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const venuesCollectionName = "venues"

type VenueService struct {
	venuesCollection *mongo.Collection
}

func NewVenueService(db *mongo.Database) *VenueService {
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
//
// TODO: venuesCollection.FindOne({_id: venueId}) ile çek, bulunamazsa uygun
// bir hata dön (bkz. ErrVenueNotFound benzeri bir tanım gerekebilir,
// venue_errors.go).
func (s *VenueService) GetByID(ctx context.Context, venueId bson.ObjectID) (*Venue, error) {
	panic("TODO: GetByID mantığı yazılacak")
}
