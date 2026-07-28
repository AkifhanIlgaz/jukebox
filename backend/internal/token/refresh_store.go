package token

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const refreshTokensCollectionName = "refresh_tokens"

// AccessTokenHeader, middleware'in Rotate sırasında ürettiği yeni access
// token'ı geri bildirdiği response header'ıdır — dedike bir /refresh endpoint'i
// yok, yenileme her istekte middleware.Auth() içinde şeffafça olur (bkz. karar
// 2026-07-28). Frontend her response'ta bu header'ı kontrol edip varsa
// memory'deki access token'ı günceller.
const AccessTokenHeader = "X-Access-Token"

// RefreshToken, DB'de saklanan bir refresh token kaydını temsil eder. Düz
// metin token asla saklanmaz, yalnızca TokenHash. Role de saklanır ki
// middleware, kullanıcıyı tekrar DB'den okumadan yeni bir access token
// üretebilsin (rol değişikliği bir sonraki login'e kadar bekler — role/
// username cookie'leriyle aynı taviz).
type RefreshToken struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	UserID    bson.ObjectID `bson:"user_id"`
	VenueID   bson.ObjectID `bson:"venue_id"`
	Role      string        `bson:"role"`
	TokenHash string        `bson:"token_hash"`
	ExpiresAt time.Time     `bson:"expires_at"`
	CreatedAt time.Time     `bson:"created_at"`
}

// RefreshStore, refresh token kayıtlarının Mongo'daki yaşam döngüsünden
// sorumludur (kaydet/bul/sil). Süresi dolan kayıtlar TTL index ile Mongo
// tarafından otomatik silinir.
type RefreshStore struct {
	collection *mongo.Collection
}

func NewRefreshStore(db *mongo.Database) *RefreshStore {
	collection := db.Collection(refreshTokensCollectionName)

	_, err := collection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{Key: "token_hash", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		panic(err)
	}

	_, err = collection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{Key: "expires_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(0),
	})
	if err != nil {
		panic(err)
	}

	return &RefreshStore{collection: collection}
}

func (s *RefreshStore) Save(ctx context.Context, userId, venueId bson.ObjectID, role, tokenHash string, expiresAt time.Time) error {
	_, err := s.collection.InsertOne(ctx, RefreshToken{
		UserID:    userId,
		VenueID:   venueId,
		Role:      role,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	})
	if err != nil {
		return fmt.Errorf("failed to save refresh token: %w", err)
	}

	return nil
}

// Refresh, geçerli bir refresh token karşılığında yeni bir access token
// üretir. Token rotate EDİLMEZ (karar 2026-07-28-2): aynı refresh token
// (ve cookie) kullanılmaya devam eder, sadece kalan süresi
// RefreshExtendThreshold'un altına düştüyse expires_at sliding window ile
// yeniden RefreshTokenTTL'e ötelenir. Bu sayede eşzamanlı istekler arasında
// eski rotation modelindeki "kaybeden 401 alır" yarış durumu ortadan kalkar —
// burada sadece okuma + koşullu, idempotent bir update var.
func (s *RefreshStore) Refresh(ctx context.Context, plainRefreshToken, secret string) (accessToken string, err error) {
	tokenHash := HashRefreshToken(plainRefreshToken)

	existing, err := s.FindByHash(ctx, tokenHash)
	if err != nil {
		return "", err
	}

	accessToken, err = GenerateAccessToken(existing.UserID, existing.VenueID, existing.Role, secret)
	if err != nil {
		return "", fmt.Errorf("failed to generate access token: %w", err)
	}

	if time.Until(existing.ExpiresAt) < RefreshExtendThreshold {
		_, err := s.collection.UpdateOne(ctx,
			bson.M{"token_hash": tokenHash},
			bson.M{"$set": bson.M{"expires_at": time.Now().Add(RefreshTokenTTL)}},
		)
		if err != nil {
			return "", fmt.Errorf("failed to extend refresh token: %w", err)
		}
	}

	return accessToken, nil
}

// SetCookie, refresh_token çerezini yazar — hem login'de (AuthHandler) hem
// şeffaf yenilemede (AuthMiddleware) kullanılır, tek yerde tanımlı.
func SetRefreshCookie(c fiber.Ctx, cookieDomain, refreshToken string) {
	c.Cookie(&fiber.Cookie{
		Name:     RefreshCookieName,
		Value:    refreshToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(RefreshTokenTTL.Seconds()),
		HTTPOnly: true,
		Secure:   cookieDomain != "",
		SameSite: fiber.CookieSameSiteLaxMode,
	})
}

// FindByHash, süresi dolmamış bir refresh token kaydını hash'ine göre bulur.
// Süresi dolmuş bir kaydın hâlâ DB'de olması (TTL index'in silmesini
// beklerken) ErrInvalidToken ile aynı şekilde reddedilir.
func (s *RefreshStore) FindByHash(ctx context.Context, tokenHash string) (*RefreshToken, error) {
	var rt RefreshToken

	err := s.collection.FindOne(ctx, bson.M{"token_hash": tokenHash}).Decode(&rt)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrInvalidToken
		}
		return nil, fmt.Errorf("failed to find refresh token: %w", err)
	}

	if time.Now().After(rt.ExpiresAt) {
		return nil, ErrInvalidToken
	}

	return &rt, nil
}

func (s *RefreshStore) DeleteByHash(ctx context.Context, tokenHash string) error {
	_, err := s.collection.DeleteOne(ctx, bson.M{"token_hash": tokenHash})
	if err != nil {
		return fmt.Errorf("failed to delete refresh token: %w", err)
	}

	return nil
}
