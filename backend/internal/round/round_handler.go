package round

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

type RoundHandler struct {
	service        *RoundService
	authMiddleware *middleware.AuthMiddleware
}

func NewRoundHandler(service *RoundService, authMiddleware *middleware.AuthMiddleware) *RoundHandler {
	return &RoundHandler{
		service:        service,
		authMiddleware: authMiddleware,
	}
}

func (h *RoundHandler) RegisterRoutes(app *fiber.App) {
	round := app.Group("/round")
	round.Use(h.authMiddleware.Auth())

	round.Get("/", h.GetActiveRound)
	round.Post("/start", h.StartRound)
	round.Post("/close", h.CloseRound)
}

// GetActiveRound, venue'nin şu an açık olan oylama turunu döner. Açık tur
// yoksa 404 döner (admin panel bunu "aktif oylama yok" empty state'i olarak
// yorumlar).
func (h *RoundHandler) GetActiveRound(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	r, err := h.service.FindActiveRound(ctx.Context(), venueId)
	if err != nil {
		if errors.Is(err, ErrNoOpenRound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(r)
}

// StartRound, admin panelden manuel olarak yeni bir oylama turu başlatır.
func (h *RoundHandler) StartRound(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	r, err := h.service.OpenRound(ctx.Context(), venueId)
	if err != nil {
		if errors.Is(err, ErrRoundAlreadyOpen) {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		if errors.Is(err, ErrNotEnoughTracks) {
			return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
		}
		return err
	}

	return ctx.Status(201).JSON(r)
}

// CloseRound, admin panelden mevcut açık oylama turunu süresi dolmadan
// manuel olarak kapatır. Kazanan seçilmez, kuyruğa ekleme yapılmaz; yeni
// round admin tekrar "Oylama başlat" demeden açılmaz.
func (h *RoundHandler) CloseRound(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	r, err := h.service.CloseRound(ctx.Context(), venueId)
	if err != nil {
		if errors.Is(err, ErrNoOpenRound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(r)
}
