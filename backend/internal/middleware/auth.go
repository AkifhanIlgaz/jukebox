package middleware

import (
	"github.com/AkifhanIlgaz/jukebox/internal/auth"
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

const (
	// UserIDLocalsKey, VenueIDLocalsKey ile handler'lar auth middleware'in doldurduğu
	// kimliklere c.Locals üzerinden erişir.
	localsUserID  = "userID"
	localsVenueID = "venueID"
)

func Auth(jwtSecret string) fiber.Handler {
	return func(c fiber.Ctx) error {
		tokenString := c.Cookies(auth.CookieName)
		if tokenString == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "giriş gerekli")
		}

		claims, err := auth.ParseToken(tokenString, jwtSecret)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "oturum geçersiz")
		}

		userID, err := bson.ObjectIDFromHex(claims.UserID)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "oturum geçersiz")
		}

		venueID, err := bson.ObjectIDFromHex(claims.VenueID)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "oturum geçersiz")
		}

		c.Locals(localsUserID, userID)
		c.Locals(localsVenueID, venueID)

		return c.Next()
	}
}

func GetUserID(c fiber.Ctx) bson.ObjectID {
	return c.Locals(localsUserID).(bson.ObjectID)
}

func GetVenueID(c fiber.Ctx) bson.ObjectID {
	return c.Locals(localsVenueID).(bson.ObjectID)
}
