package middleware

import "github.com/gofiber/fiber/v3"

const (
	localsUserIDKey  = "userID"
	localsVenueIDKey = "venueID"
)

func Auth() fiber.Handler {
	return func(c fiber.Ctx) error {

	}
}
