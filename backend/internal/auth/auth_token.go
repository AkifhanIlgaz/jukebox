package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// CookieName, JWT'nin taşındığı httpOnly çerezin adıdır.
const CookieName = "auth_token"

// CookieMaxAge, çerezin tarayıcıda ne kadar saklanacağını belirler. Token'ın
// kendisinde süre sınırı YOK (kullanıcı isteği); logout dışında geçersiz olmaz.
const CookieMaxAge = 365 * 24 * time.Hour

type Claims struct {
	UserID  string `json:"userId"`
	VenueID string `json:"venueId"`
	jwt.RegisteredClaims
}

// GenerateToken süresiz bir JWT üretir (ExpiresAt yok) — oturum yalnızca logout'ta
// (çerez silinince) sona erer.
func GenerateToken(userId, venueId bson.ObjectID, secret string) (string, error) {
	claims := Claims{
		UserID:  userId.Hex(),
		VenueID: venueId.Hex(),
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

func ParseToken(tokenString, secret string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}

		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
