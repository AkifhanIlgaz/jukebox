package ws

import (
	"context"

	"github.com/gofiber/contrib/v3/websocket"
	"github.com/gofiber/fiber/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// VenueResolver, müşteri bağlantısının slug'dan venueID çözmesi için ws
// paketinin ihtiyaç duyduğu minimal arayüz. Burada (kullanan tarafta)
// tanımlı, venue paketine bağımlı değil — venue paketi (ReportNowPlaying
// için) bu paketteki Hub'ı çağıracağından, ws -> venue -> ws döngüsü
// oluşmasın diye (bkz. docs/decisions.md).
type VenueResolver interface {
	GetVenueIDBySlug(ctx context.Context, slug string) (bson.ObjectID, error)
}

type Handler struct {
	hub           *Hub
	venueResolver VenueResolver
}

func NewHandler(hub *Hub, venueResolver VenueResolver) *Handler {
	return &Handler{
		hub:           hub,
		venueResolver: venueResolver,
	}
}

// RegisterRoutes, müşterinin /v/{slug} sayfasının bağlandığı tek upgrade
// endpoint'ini kaydeder. Player artık WS'e bağlanmıyor — track yaşam
// döngüsü REST üzerinden raporlanıyor (bkz. venue.VenueHandler.ReportNowPlaying,
// docs/decisions.md).
func (h *Handler) RegisterRoutes(app *fiber.App) {
	app.Get("/ws/venue/:slug", websocket.New(h.handleCustomer))
}

// handleCustomer, müşteri bağlantısını hub'a kaydeder.
func (h *Handler) handleCustomer(c *websocket.Conn) {
	slug := c.Params("slug")

	venueID, err := h.venueResolver.GetVenueIDBySlug(context.Background(), slug)
	if err != nil {
		c.Close()
		return
	}

	conn := NewConnection(c, venueID)
	h.hub.register <- conn

	go conn.writePump()
	conn.readPump(h.hub)
}
