package track

import (
	"errors"

	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/AkifhanIlgaz/jukebox/internal/youtube"
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type TrackHandler struct {
	service        *TrackService
	authMiddleware *middleware.AuthMiddleware
}

func NewTrackHandler(service *TrackService, authMiddleware *middleware.AuthMiddleware) *TrackHandler {
	return &TrackHandler{
		service:        service,
		authMiddleware: authMiddleware,
	}
}

func (h *TrackHandler) RegisterRoutes(app *fiber.App) {
	tracks := app.Group("/tracks")
	tracks.Use(h.authMiddleware.Auth())

	tracks.Post("/", h.AddTrack)
	tracks.Get("/", h.GetVenueTracks)
	tracks.Delete("/:id", h.DeleteTrack)

}

func (h *TrackHandler) AddTrack(ctx fiber.Ctx) error {
	var req AddTrackRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return err
	}

	if err := req.Validate(); err != nil {
		if errors.Is(err, ErrYoutubeURLRequired) || errors.Is(err, ErrAmbiguousYoutubeURL) || errors.Is(err, youtube.ErrInvalidURL) {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return err
	}

	req.UserId = middleware.GetUserID(ctx)
	req.VenueId = middleware.GetVenueID(ctx)

	if req.IsPlaylist() {
		result, err := h.service.ImportPlaylist(ctx.Context(), req.VenueId, req.UserId, req.YoutubePlaylistID)
		if err != nil {
			if errors.Is(err, youtube.ErrAPIKeyMissing) {
				return fiber.NewError(fiber.StatusServiceUnavailable, err.Error())
			}
			if errors.Is(err, youtube.ErrPlaylistNotFound) || errors.Is(err, youtube.ErrPlaylistEmpty) || errors.Is(err, youtube.ErrUnsupportedPlaylist) {
				return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
			}
			return err
		}

		return ctx.Status(201).JSON(AddTrackResponse{
			Message: "playlist imported",
			Added:   &result.Added,
			Skipped: &result.Skipped,
		})
	}

	if err := h.service.InsertTrack(ctx.Context(), req); err != nil {
		if errors.Is(err, ErrTrackAlreadyExists) {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		return err
	}

	return ctx.Status(201).JSON(AddTrackResponse{Message: "track added"})
}

func (h *TrackHandler) GetVenueTracks(ctx fiber.Ctx) error {
	var req GetVenueTracksRequest
	if err := ctx.Bind().Query(&req); err != nil {
		return err
	}
	req.Normalize()

	venueId := middleware.GetVenueID(ctx)

	res, err := h.service.GetVenueTracks(ctx.Context(), venueId, req)
	if err != nil {
		return err
	}

	return ctx.Status(200).JSON(res)
}

func (h *TrackHandler) DeleteTrack(ctx fiber.Ctx) error {
	trackId, err := bson.ObjectIDFromHex(ctx.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "geçersiz şarkı id'si")
	}

	venueId := middleware.GetVenueID(ctx)

	if err := h.service.DeleteTrack(ctx.Context(), venueId, trackId); err != nil {
		if errors.Is(err, ErrTrackNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}

	return ctx.SendStatus(200)
}
