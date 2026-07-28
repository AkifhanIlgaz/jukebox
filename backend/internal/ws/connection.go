package ws

import (
	"time"

	"github.com/gofiber/contrib/v3/websocket"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// sendBufferSize, writePump'ın henüz yetişemediği mesajlar için send
// kanalının tamponu; dolarsa (yavaş/kopmuş tüketici) hub bağlantıyı düşürür.
const sendBufferSize = 16

// pongWait, bir client'tan pong (ya da herhangi bir mesaj) beklerken
// tanınan süre; bu süre içinde hiçbir şey gelmezse bağlantı ölü sayılır.
// pingPeriod, writePump'ın ping gönderme aralığı — pongWait'ten kısa olmalı
// ki bir sonraki ping, deadline dolmadan client'ı canlı tutabilsin.
// writeWait, tekil bir yazma (ping/close control frame dahil) için tanınan
// süre.
const (
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	writeWait  = 10 * time.Second
)

// Connection, hub'a kayıtlı tek bir müşteri WS bağlantısını sarmalar. Yazma
// her zaman writePump üzerinden, send kanalına düşürülerek yapılır — aynı
// *websocket.Conn'a birden fazla goroutine'in eş zamanlı yazması güvenli
// değil.
type Connection struct {
	conn    *websocket.Conn
	venueID bson.ObjectID
	send    chan Envelope
}

func NewConnection(conn *websocket.Conn, venueID bson.ObjectID) *Connection {
	return &Connection{
		conn:    conn,
		venueID: venueID,
		send:    make(chan Envelope, sendBufferSize),
	}
}

// readPump, bağlantı canlı kaldığı sürece bloklar. Müşteri bağlantısı tek
// yönlü (server -> customer) — sunucuya business mesajı göndermiyor, bu
// yüzden gelen mesajlar okunup atılır; asıl amaç (a) bağlantı kopunca hub'dan
// unregister edip dönmek, (b) writePump'ın gönderdiği ping'lere karşılık
// gelen pong'ları okuyup read deadline'ı yenilemek — aksi halde yarı-açık
// bir bağlantı (ör. mobil ağda sessizce kopmuş) sonsuza kadar "bağlı"
// görünürdü.
func (c *Connection) readPump(hub *Hub) {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			return
		}
	}
}

// writePump, send kanalına düşen mesajları sırayla socket'e yazar; ayrıca
// pingPeriod'da bir ping control frame gönderip karşı tarafın hâlâ orada
// olduğunu doğrular. Kanal hub tarafından kapatılınca (unregister) döner.
func (c *Connection) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case env, ok := <-c.send:
			if !ok {
				return
			}
			if err := c.conn.WriteJSON(env); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(writeWait)); err != nil {
				return
			}
		}
	}
}
