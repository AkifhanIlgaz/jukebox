package venue

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/auth"
	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

type VenueHandler struct {
	service        *VenueService
	authMiddleware *middleware.AuthMiddleware
}

func NewVenueHandler(service *VenueService, authMiddleware *middleware.AuthMiddleware) *VenueHandler {
	return &VenueHandler{
		service:        service,
		authMiddleware: authMiddleware,
	}
}

func (h *VenueHandler) RegisterRoutes(app *fiber.App) {
	venue := app.Group("/venue")
	venue.Use(h.authMiddleware.Auth())

	venue.Get("/", h.authMiddleware.RequireRole(auth.RoleBoss), h.GetVenue)
	venue.Put("/", h.authMiddleware.RequireRole(auth.RoleBoss), h.UpdateVenue)
}

// GetVenue, admin panelde mekan bilgisi ve ayarlarını göstermek için kullanılır.
func (h *VenueHandler) GetVenue(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	v, err := h.service.GetByID(ctx.Context(), venueId)
	if err != nil {
		if errors.Is(err, ErrVenueNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(v)
}

// UpdateVenue, admin panelden mekan adı/logosu ve tur ayarlarını günceller.
func (h *VenueHandler) UpdateVenue(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	var req UpdateVenueRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := req.Validate(); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	v, err := h.service.UpdateVenue(ctx.Context(), venueId, req)
	if err != nil {
		if errors.Is(err, ErrVenueNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(v)
}
