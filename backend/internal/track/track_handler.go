package track

import (
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type TrackHandler struct {
	service *TrackService
}

func NewTrackHandler(service *TrackService) *TrackHandler {
	return &TrackHandler{
		service: service,
	}
}

func (h *TrackHandler) AddTrack(ctx fiber.Ctx) error {
	var req AddTrackRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return err
	}

	if err := req.Validate(); err != nil {
		return err
	}

	req.UserId = ctx.Context().Value("userId").(bson.ObjectID)
	req.VenueId = ctx.Context().Value("venueId").(bson.ObjectID)

	if err := h.service.InsertTrack(ctx.Context(), req); err != nil {
		return err
	}

	return ctx.Status(201).JSON(fiber.Map{"message": "track added"})
}
