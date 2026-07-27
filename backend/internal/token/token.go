// Package token, oturum JWT'sinin üretilip doğrulanmasından sorumludur. Hem
// auth (login'de token üretir) hem middleware (isteklerde token doğrular) buna
// bağımlı — aralarında import cycle oluşmasın diye ayrı bir pakette. Rol
// sabitleri burada DEĞİL, auth paketinde yaşıyor (bkz. auth.RoleAdmin/RoleBoss);
// middleware rol kontrolünü auth'tan bağımsız, generic RequireRole(role string)
// ile yapıyor.
package token

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// CookieName, JWT'nin taşındığı httpOnly çerezin adıdır.
const CookieName = "auth_token"

// CookieMaxAge, çerezin tarayıcıda ne kadar saklanacağını belirler. Token'ın
// kendisinde süre sınırı YOK (kullanıcı isteği); logout dışında geçersiz olmaz.
const CookieMaxAge = 365 * 24 * time.Hour

var ErrInvalidToken = errors.New("Oturum geçersiz veya süresi dolmuş.")

type Claims struct {
	UserID  string `json:"userId"`
	VenueID string `json:"venueId"`
	Role    string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken süresiz bir JWT üretir (ExpiresAt yok) — oturum yalnızca logout'ta
// (çerez silinince) sona erer.
func GenerateToken(userId, venueId bson.ObjectID, role, secret string) (string, error) {
	claims := Claims{
		UserID:  userId.Hex(),
		VenueID: venueId.Hex(),
		Role:    role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return jwtToken.SignedString([]byte(secret))
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
