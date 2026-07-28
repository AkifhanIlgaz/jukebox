package ws

import (
	"encoding/json"
	"log"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Hub, bağlı tüm müşteri WS bağlantılarının merkezi kayıt defteri ve dağıtım
// noktasıdır. connections map'ine yalnızca Run() goroutine'i dokunur;
// dışarıdan register/unregister/broadcast kanalları üzerinden istek
// yapılır (mutex yerine tek-okuyucu goroutine deseni). Hub herhangi bir
// servise bağımlı değil — business mantığı (nowPlaying güncelleme vb.)
// REST handler'larda yaşıyor, onlar bu Hub'ı çağırıyor (bkz.
// venue.VenueHandler.ReportNowPlaying).
type Hub struct {
	connections map[*Connection]bool
	register    chan *Connection
	unregister  chan *Connection
	broadcast   chan broadcastMsg
}

type broadcastMsg struct {
	venueID bson.ObjectID
	env     Envelope
}

func NewHub() *Hub {
	return &Hub{
		connections: make(map[*Connection]bool),
		register:    make(chan *Connection),
		unregister:  make(chan *Connection),
		broadcast:   make(chan broadcastMsg),
	}
}

// Run, hub'ın olay döngüsüdür; main.go'da tek bir goroutine olarak
// başlatılır (go hub.Run()).
func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.connections[c] = true
		case c := <-h.unregister:
			if _, ok := h.connections[c]; ok {
				delete(h.connections, c)
				close(c.send)
			}
		case msg := <-h.broadcast:
			for c := range h.connections {
				if c.venueID != msg.venueID {
					continue
				}

				select {
				case c.send <- msg.env:
				default:
					// send kanalı dolu: yavaş/kopmuş tüketici, bağlantıyı düş.
					delete(h.connections, c)
					close(c.send)
				}
			}
		}
	}
}

// BroadcastToVenue, ilgili servislerin (venue, round, queue) çağıracağı dışa
// açık API. venueID'si eşleşen tüm müşteri bağlantılarına mesajı yollar.
func (h *Hub) BroadcastToVenue(venueID bson.ObjectID, msgType MessageType, payload any) {
	raw, err := json.Marshal(payload)
	if err != nil {
		log.Println("ws: broadcast payload marshal failed:", err)
		return
	}

	h.broadcast <- broadcastMsg{
		venueID: venueID,
		env:     Envelope{Type: msgType, Payload: raw},
	}
}
