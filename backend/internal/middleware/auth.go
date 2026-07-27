package middleware

import (
	"github.com/AkifhanIlgaz/jukebox/internal/token"
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

const (
	// UserIDLocalsKey, VenueIDLocalsKey ile handler'lar auth middleware'in doldurduğu
	// kimliklere c.Locals üzerinden erişir.
	localsUserID  = "userID"
	localsVenueID = "venueID"
	localsRole    = "role"
)

type AuthMiddleware struct {
	jwtSecret string
}

func NewAuthMiddleware(jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: jwtSecret,
	}
}

func (mw *AuthMiddleware) Auth() fiber.Handler {
	return func(c fiber.Ctx) error {
		tokenString := c.Cookies(token.CookieName)
		if tokenString == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "giriş gerekli")
		}

		claims, err := token.ParseToken(tokenString, mw.jwtSecret)
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
		c.Locals(localsRole, claims.Role)

		return c.Next()
	}
}

// RequireRole, Auth()'tan sonra zincirlenir; sadece verilen role sahip
// kullanıcıların devam etmesine izin verir. Rol sabitleri auth paketinde
// tanımlı (auth.RoleAdmin/RoleBoss) — middleware paketi bunlara bağımlı değil,
// import cycle oluşmasın diye (auth zaten bu paketteki AuthMiddleware'e
// bağımlı; middleware auth'a bağımlı olsaydı döngü olurdu).
func (mw *AuthMiddleware) RequireRole(role string) fiber.Handler {
	return func(c fiber.Ctx) error {
		if GetRole(c) != role {
			return fiber.NewError(fiber.StatusForbidden, "bu işlem için yetkiniz yok")
		}

		return c.Next()
	}
}

func GetUserID(c fiber.Ctx) bson.ObjectID {
	return c.Locals(localsUserID).(bson.ObjectID)
}

func GetVenueID(c fiber.Ctx) bson.ObjectID {
	return c.Locals(localsVenueID).(bson.ObjectID)
}

func GetRole(c fiber.Ctx) string {
	return c.Locals(localsRole).(string)
}
