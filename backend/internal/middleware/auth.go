package middleware

import (
	"strings"

	"github.com/AkifhanIlgaz/jukebox/internal/token"
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

const bearerPrefix = "Bearer "

const (
	// UserIDLocalsKey, VenueIDLocalsKey ile handler'lar auth middleware'in doldurduğu
	// kimliklere c.Locals üzerinden erişir.
	localsUserID  = "userID"
	localsVenueID = "venueID"
	localsRole    = "role"
)

type AuthMiddleware struct {
	jwtSecret    string
	refreshStore *token.RefreshStore
}

func NewAuthMiddleware(jwtSecret string, refreshStore *token.RefreshStore) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret:    jwtSecret,
		refreshStore: refreshStore,
	}
}

// Auth, access token'ı (Authorization: Bearer) doğrular. Geçersiz/süresi
// dolmuşsa dedike bir /refresh endpoint'ine gitmek yerine burada şeffafça
// yenilenir: refresh_token çerezi (her istekte zaten otomatik gelir) DB'de
// aranır, geçerliyse yeni bir access token üretilir (X-Access-Token response
// header'ında döner) ve istek normal şekilde devam eder. Refresh token rotate
// EDİLMEZ, sliding window ile ötelenir (bkz. token.RefreshStore.Refresh) —
// cookie'nin yeniden yazılmasına gerek yok. Refresh token da yoksa/geçersizse
// 401 döner.
func (mw *AuthMiddleware) Auth() fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get(fiber.HeaderAuthorization)
		tokenString := strings.TrimPrefix(authHeader, bearerPrefix)

		claims, err := token.ParseToken(tokenString, mw.jwtSecret)
		if err != nil {
			claims, err = mw.refreshFromCookie(c)
			if err != nil {
				return fiber.NewError(fiber.StatusUnauthorized, "oturum geçersiz")
			}
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

func (mw *AuthMiddleware) refreshFromCookie(c fiber.Ctx) (*token.Claims, error) {
	refreshCookie := c.Cookies(token.RefreshCookieName)
	if refreshCookie == "" {
		return nil, token.ErrInvalidToken
	}

	accessToken, err := mw.refreshStore.Refresh(c.Context(), refreshCookie, mw.jwtSecret)
	if err != nil {
		return nil, err
	}

	c.Set(token.AccessTokenHeader, accessToken)

	return token.ParseToken(accessToken, mw.jwtSecret)
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
