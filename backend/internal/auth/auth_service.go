package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/token"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

const usersCollectionName = "users"

type AuthService struct {
	usersCollection *mongo.Collection
	jwtSecret       string
}

func NewAuthService(db *mongo.Database, jwtSecret string) *AuthService {
	usersCollection := db.Collection(usersCollectionName)

	_, err := usersCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "username", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		panic(err)
	}

	// Mekan başına tek boss garantisi — sadece role: "boss" olan dokümanlar arasında
	// venue_id benzersiz olmalı (partial index, admin dokümanlarını etkilemez).
	_, err = usersCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "venue_id", Value: 1},
			{Key: "role", Value: 1},
		},
		Options: options.Index().
			SetUnique(true).
			SetPartialFilterExpression(bson.M{"role": RoleBoss}),
	})
	if err != nil {
		panic(err)
	}

	return &AuthService{
		usersCollection: usersCollection,
		jwtSecret:       jwtSecret,
	}
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (string, *User, error) {
	var user User

	err := s.usersCollection.FindOne(ctx, bson.M{"username": req.Username}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return "", nil, ErrInvalidCredentials
		}
		return "", nil, fmt.Errorf("failed to find user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return "", nil, ErrInvalidCredentials
	}

	tokenString, err := token.GenerateToken(user.ID, user.VenueID, user.Role, s.jwtSecret)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return tokenString, &user, nil
}

// ListByVenue, mekanın admin+boss hesaplarını (ayarlar sayfasındaki kullanıcı
// tablosu için) döner.
func (s *AuthService) ListByVenue(ctx context.Context, venueId bson.ObjectID) ([]User, error) {
	cursor, err := s.usersCollection.Find(ctx, bson.M{"venue_id": venueId})
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	var users []User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	return users, nil
}

// CreateAdmin, boss tarafından yeni bir admin hesabı açar. Role her zaman
// RoleAdmin'dir — istekten role alınmaz.
func (s *AuthService) CreateAdmin(ctx context.Context, venueId bson.ObjectID, req CreateAdminRequest) (*User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := User{
		VenueID:      venueId,
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         RoleAdmin,
		CreatedAt:    time.Now(),
	}

	result, err := s.usersCollection.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrUsernameTaken
		}
		return nil, fmt.Errorf("failed to create admin: %w", err)
	}

	user.ID = result.InsertedID.(bson.ObjectID)

	return &user, nil
}

// DeleteAdmin, boss tarafından bir admin hesabını siler. Hedef kullanıcı aynı
// venue'de ve role=admin değilse (yok, başka venue'ye ait ya da boss) silinmez —
// boss kendi kendini/başka bir venue'nin kullanıcısını silemez.
func (s *AuthService) DeleteAdmin(ctx context.Context, venueId, userId bson.ObjectID) error {
	result, err := s.usersCollection.DeleteOne(ctx, bson.M{
		"_id":      userId,
		"venue_id": venueId,
		"role":     RoleAdmin,
	})
	if err != nil {
		return fmt.Errorf("failed to delete admin: %w", err)
	}

	if result.DeletedCount == 0 {
		return ErrUserNotFound
	}

	return nil
}
