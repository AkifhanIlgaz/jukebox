package queue

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/AkifhanIlgaz/jukebox/internal/track"
	"github.com/AkifhanIlgaz/jukebox/internal/venue"
	"github.com/gofiber/fiber/v3"
)

type QueueHandler struct {
	service        *QueueService
	authMiddleware *middleware.AuthMiddleware
}

func NewQueueHandler(service *QueueService, authMiddleware *middleware.AuthMiddleware) *QueueHandler {
	return &QueueHandler{
		service:        service,
		authMiddleware: authMiddleware,
	}
}

func (h *QueueHandler) RegisterRoutes(app *fiber.App) {
	queue := app.Group("/queue")
	queue.Use(h.authMiddleware.Auth())

	queue.Get("/", h.GetQueue)
	queue.Post("/", h.AddToQueue)
	queue.Post("/next", h.Next)
	queue.Delete("/", h.ClearQueue)
	queue.Delete("/:youtubeId", h.RemoveFromQueue)

	app.Get("/v/:slug/queue", h.GetPublicQueue)
}

func (h *QueueHandler) GetQueue(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	tracks, total, err := h.service.List(ctx.Context(), venueId)
	if err != nil {
		return err
	}

	return ctx.Status(200).JSON(fiber.Map{"tracks": tracks, "total": total})
}

func (h *QueueHandler) AddToQueue(ctx fiber.Ctx) error {
	var req track.AddTrackRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return err
	}

	if err := req.Validate(); err != nil {
		if errors.Is(err, track.ErrYoutubeURLRequired) {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return err
	}

	req.VenueId = middleware.GetVenueID(ctx)
	req.UserId = middleware.GetUserID(ctx)

	if err := h.service.EnqueueManual(ctx.Context(), req); err != nil {
		if errors.Is(err, ErrTrackAlreadyQueued) {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		return err
	}

	return ctx.Status(201).JSON(fiber.Map{"message": "şarkı sıraya eklendi"})
}

func (h *QueueHandler) Next(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	playlistTrack, err := h.service.Next(ctx.Context(), venueId)
	if err != nil {
		if errors.Is(err, ErrNoPlayableTrack) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(playlistTrack)
}

// ClearQueue, admin panelden venue'nin tüm çalma sırasını sıfırlar.
func (h *QueueHandler) ClearQueue(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	if err := h.service.ClearQueue(ctx.Context(), venueId); err != nil {
		return err
	}

	return ctx.SendStatus(200)
}

// GetPublicQueue, müşterinin /v/{slug} sayfasının ilk yükte çektiği çalma
// sırasıdır (auth gerektirmez).
func (h *QueueHandler) GetPublicQueue(ctx fiber.Ctx) error {
	slug := ctx.Params("slug")

	tracks, total, err := h.service.ListBySlug(ctx.Context(), slug)
	if err != nil {
		if errors.Is(err, venue.ErrVenueNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.Status(200).JSON(fiber.Map{"tracks": tracks, "total": total})
}

func (h *QueueHandler) RemoveFromQueue(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)
	youtubeId := ctx.Params("youtubeId")

	if err := h.service.Remove(ctx.Context(), venueId, youtubeId); err != nil {
		if errors.Is(err, ErrTrackNotQueued) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.SendStatus(200)
}
