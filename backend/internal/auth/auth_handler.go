package auth

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/AkifhanIlgaz/jukebox/internal/token"
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type AuthHandler struct {
	service        *AuthService
	authMiddleware *middleware.AuthMiddleware
	cookieDomain   string
}

func NewAuthHandler(service *AuthService, authMiddleware *middleware.AuthMiddleware, cookieDomain string) *AuthHandler {
	return &AuthHandler{
		service:        service,
		authMiddleware: authMiddleware,
		cookieDomain:   cookieDomain,
	}
}

// roleCookieName, usernameCookieName: httpOnly OLMAYAN cookie'ler — frontend'in
// ayarlar sayfasını/sidebar'ı role göre göstermesi için elle bir /me isteği
// atmasına gerek kalmasın diye login/logout'ta auth_token ile birlikte
// set/temizlenir. Yetki sınırı DEĞİL, sadece UI kararı — asıl yetki kontrolü
// backend'de RequireRole ile yapılıyor.
const (
	roleCookieName     = "role"
	usernameCookieName = "username"
)

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/login", h.Login)
	router.Post("/logout", h.Logout)

	users := router.Group("/users")
	users.Use(h.authMiddleware.Auth(), h.authMiddleware.RequireRole(RoleBoss))
	users.Get("/", h.ListUsers)
	users.Post("/", h.CreateAdmin)
	users.Delete("/:id", h.DeleteAdmin)
}

func (h *AuthHandler) Login(ctx fiber.Ctx) error {
	var req LoginRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return err
	}

	if err := req.Validate(); err != nil {
		if errors.Is(err, ErrUsernameRequired) || errors.Is(err, ErrPasswordRequired) {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return err
	}

	tokenString, user, err := h.service.Login(ctx.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}
		return err
	}

	ctx.Cookie(&fiber.Cookie{
		Name:     token.CookieName,
		Value:    tokenString,
		Path:     "/",
		Domain:   h.cookieDomain,
		MaxAge:   int(token.CookieMaxAge.Seconds()),
		HTTPOnly: true,
		Secure:   h.cookieDomain != "",
		SameSite: fiber.CookieSameSiteLaxMode,
	})
	ctx.Cookie(&fiber.Cookie{
		Name:     roleCookieName,
		Value:    user.Role,
		Path:     "/",
		Domain:   h.cookieDomain,
		MaxAge:   int(token.CookieMaxAge.Seconds()),
		HTTPOnly: false,
		Secure:   h.cookieDomain != "",
		SameSite: fiber.CookieSameSiteLaxMode,
	})
	ctx.Cookie(&fiber.Cookie{
		Name:     usernameCookieName,
		Value:    user.Username,
		Path:     "/",
		Domain:   h.cookieDomain,
		MaxAge:   int(token.CookieMaxAge.Seconds()),
		HTTPOnly: false,
		Secure:   h.cookieDomain != "",
		SameSite: fiber.CookieSameSiteLaxMode,
	})

	return ctx.JSON(fiber.Map{"message": "logged in"})
}

func (h *AuthHandler) Logout(ctx fiber.Ctx) error {
	for _, name := range []string{token.CookieName, roleCookieName, usernameCookieName} {
		ctx.Cookie(&fiber.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			Domain:   h.cookieDomain,
			MaxAge:   -1,
			HTTPOnly: name == token.CookieName,
			Secure:   h.cookieDomain != "",
			SameSite: fiber.CookieSameSiteLaxMode,
		})
	}

	return ctx.JSON(fiber.Map{"message": "logged out"})
}

// ListUsers, ayarlar sayfasındaki kullanıcı tablosu için mekanın admin+boss
// hesaplarını döner. Sadece boss erişebilir (bkz. RegisterRoutes).
func (h *AuthHandler) ListUsers(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	users, err := h.service.ListByVenue(ctx.Context(), venueId)
	if err != nil {
		return err
	}

	return ctx.Status(200).JSON(users)
}

// CreateAdmin, boss'un mekanına yeni bir admin hesabı açması için kullanılır.
func (h *AuthHandler) CreateAdmin(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	var req CreateAdminRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := req.Validate(); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	user, err := h.service.CreateAdmin(ctx.Context(), venueId, req)
	if err != nil {
		if errors.Is(err, ErrUsernameTaken) {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		return err
	}

	return ctx.Status(fiber.StatusCreated).JSON(user)
}

// DeleteAdmin, boss'un mekanındaki bir admin hesabını silmesi için kullanılır.
// Boss kendi hesabını (role != admin olduğu için) bu yoldan silemez.
func (h *AuthHandler) DeleteAdmin(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	userId, err := bson.ObjectIDFromHex(ctx.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "geçersiz kullanıcı id")
	}

	if err := h.service.DeleteAdmin(ctx.Context(), venueId, userId); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(fiber.Map{"message": "kullanıcı silindi"})
}
