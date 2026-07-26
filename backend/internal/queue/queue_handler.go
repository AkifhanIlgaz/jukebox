package queue

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/AkifhanIlgaz/jukebox/internal/track"
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
}

func (h *QueueHandler) GetQueue(ctx fiber.Ctx) error {
	venueId := middleware.GetVenueID(ctx)

	tracks, err := h.service.List(ctx.Context(), venueId)
	if err != nil {
		return err
	}

	return ctx.Status(200).JSON(fiber.Map{"tracks": tracks})
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
