package venue

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/auth"
	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/AkifhanIlgaz/jukebox/internal/ws"
	"github.com/gofiber/fiber/v3"
)

type VenueHandler struct {
	service        *VenueService
	authMiddleware *middleware.AuthMiddleware
	hub            *ws.Hub
}

func NewVenueHandler(service *VenueService, authMiddleware *middleware.AuthMiddleware, hub *ws.Hub) *VenueHandler {
	return &VenueHandler{
		service:        service,
		authMiddleware: authMiddleware,
		hub:            hub,
	}
}

func (h *VenueHandler) RegisterRoutes(app *fiber.App) {
	venue := app.Group("/venue")
	venue.Use(h.authMiddleware.Auth())

	venue.Get("/", h.authMiddleware.RequireRole(auth.RoleBoss), h.GetVenue)
	venue.Put("/", h.authMiddleware.RequireRole(auth.RoleBoss), h.UpdateVenue)
	venue.Post("/now-playing", h.ReportNowPlaying)

	app.Get("/v/:slug", h.GetPublicVenue)
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

// ReportNowPlaying, admin panelin YouTube IFrame player'ı bir track'i fiilen
// çalmaya başladığında çağırır (ilk açılış, hata sonrası fallback, ya da
// player'ın kendi isteğiyle REST /queue/next'ten aldığı sıradaki track —
// hepsi için). nowPlaying güncellenir ve o venue'nin müşteri WS
// bağlantılarına NOW_PLAYING broadcast edilir.
func (h *VenueHandler) ReportNowPlaying(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	var req ReportNowPlayingRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := req.Validate(); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := h.service.SetNowPlaying(ctx.Context(), venueId, req.YoutubeID); err != nil {
		return err
	}

	h.hub.BroadcastToVenue(venueId, ws.NowPlaying, ws.NowPlayingPayload{YoutubeVideoID: req.YoutubeID})

	return ctx.SendStatus(200)
}

// GetPublicVenue, müşterinin QR ile açtığı /v/{slug} sayfasının ilk yükte
// çektiği mekan bilgisidir (auth gerektirmez).
func (h *VenueHandler) GetPublicVenue(ctx fiber.Ctx) error {
	slug := ctx.Params("slug")

	v, err := h.service.GetBySlug(ctx.Context(), slug)
	if err != nil {
		if errors.Is(err, ErrVenueNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	nowPlaying, err := h.service.GetNowPlaying(ctx.Context(), v.ID)
	if err != nil {
		return err
	}

	return ctx.Status(200).JSON(PublicVenueResponse{
		Name:       v.Name,
		LogoURL:    v.LogoURL,
		NowPlaying: nowPlaying,
	})
}
