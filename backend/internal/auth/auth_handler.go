package auth

import (
	"errors"

	"github.com/gofiber/fiber/v3"
)

type AuthHandler struct {
	service      *AuthService
	cookieDomain string
}

func NewAuthHandler(service *AuthService, cookieDomain string) *AuthHandler {
	return &AuthHandler{
		service:      service,
		cookieDomain: cookieDomain,
	}
}

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/login", h.Login)
	router.Post("/logout", h.Logout)
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

	token, err := h.service.Login(ctx.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}
		return err
	}

	ctx.Cookie(&fiber.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		Domain:   h.cookieDomain,
		MaxAge:   int(CookieMaxAge.Seconds()),
		HTTPOnly: true,
		Secure:   h.cookieDomain != "",
		SameSite: fiber.CookieSameSiteLaxMode,
	})

	return ctx.JSON(fiber.Map{"message": "logged in"})
}

func (h *AuthHandler) Logout(ctx fiber.Ctx) error {
	ctx.Cookie(&fiber.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		Domain:   h.cookieDomain,
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   h.cookieDomain != "",
		SameSite: fiber.CookieSameSiteLaxMode,
	})

	return ctx.JSON(fiber.Map{"message": "logged out"})
}
