package auth

import (
	"context"
	"errors"
	"fmt"

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

	return &AuthService{
		usersCollection: usersCollection,
		jwtSecret:       jwtSecret,
	}
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (string, error) {
	var user User

	err := s.usersCollection.FindOne(ctx, bson.M{"username": req.Username}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return "", ErrInvalidCredentials
		}
		return "", fmt.Errorf("failed to find user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return "", ErrInvalidCredentials
	}

	token, err := GenerateToken(user.ID, user.VenueID, s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	return token, nil
}
