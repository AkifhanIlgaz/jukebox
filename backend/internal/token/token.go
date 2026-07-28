// Package token, oturum JWT'sinin (access token) ve refresh token'ın
// üretilip doğrulanmasından sorumludur. Hem auth (login/refresh'te token
// üretir) hem middleware (isteklerde access token doğrular) buna bağımlı —
// aralarında import cycle oluşmasın diye ayrı bir pakette. Rol sabitleri
// burada DEĞİL, auth paketinde yaşıyor (bkz. auth.RoleAdmin/RoleBoss);
// middleware rol kontrolünü auth'tan bağımsız, generic RequireRole(role string)
// ile yapıyor.
//
// İkili token modeli (karar 2026-07-28, bkz. docs/decisions.md): access token
// kısa ömürlü stateless JWT, refresh token ise DB'de (RefreshStore) hash'lenerek
// saklanan, rotate edilen opak string.
package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// RefreshCookieName, refresh token'ın taşındığı httpOnly çerezin adıdır.
// Access token artık cookie'de taşınmaz — /login ve /refresh response body'sinde
// döner, frontend Authorization: Bearer header'ıyla gönderir (bkz. karar 2026-07-28).
const RefreshCookieName = "refresh_token"

// AccessTokenTTL, access token'ın (ve auth_token çerezinin) ömrüdür.
const AccessTokenTTL = 15 * time.Minute

// RefreshTokenTTL, refresh token'ın (ve refresh_token çerezinin) ömrüdür.
// Rotate edilmez (karar 2026-07-28-2, bkz. docs/decisions.md) — aynı token
// sliding window ile kullanıldıkça ötelenir. 30 saat, mekanların günlük açılış
// döngüsünü (örn. her gün ~10:00) birkaç saatlik sapmayla rahatça kapsayacak
// ama bir gün hiç kullanılmazsa (~48 saatlik boşluk) süresi dolacak şekilde
// seçildi.
const RefreshTokenTTL = 30 * time.Hour

// RefreshExtendThreshold, sliding ötelemenin tetiklendiği eşiktir: kalan süre
// bunun altına düşmeden expires_at'e dokunulmaz. Amaç, her 15 dakikalık
// şeffaf access token yenilemesinde DB'ye yazmamak — ötelemenin sıklığı
// TTL/threshold oranıyla sınırlanır (burada günde ~1 kez).
const RefreshExtendThreshold = RefreshTokenTTL / 2

var ErrInvalidToken = errors.New("Oturum geçersiz veya süresi dolmuş.")

type Claims struct {
	UserID  string `json:"userId"`
	VenueID string `json:"venueId"`
	Role    string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAccessToken, AccessTokenTTL sonra sona eren bir JWT üretir.
func GenerateAccessToken(userId, venueId bson.ObjectID, role, secret string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:  userId.Hex(),
		VenueID: venueId.Hex(),
		Role:    role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(AccessTokenTTL)),
		},
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return jwtToken.SignedString([]byte(secret))
}

// GenerateRefreshToken, DB'de hash'lenerek saklanacak opak bir refresh token
// üretir (JWT değil — client'ın claim'leri okuyabilmesine gerek yok).
func GenerateRefreshToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// HashRefreshToken, DB'ye yalnızca hash'in yazılması için kullanılır — düz
// metin refresh token hiçbir yerde saklanmaz.
func HashRefreshToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

func ParseToken(tokenString, secret string) (*Claims, error) {
	claims := &Claims{}

	parsed, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}

		return []byte(secret), nil
	})
	if err != nil || !parsed.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
