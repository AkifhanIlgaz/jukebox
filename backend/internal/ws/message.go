package ws

import "encoding/json"

type MessageType string

const (
	NowPlaying   MessageType = "NOW_PLAYING"   // server -> customer (broadcast)
	VoteUpdate   MessageType = "VOTE_UPDATE"   // server -> customer
	RoundStarted MessageType = "ROUND_STARTED" // server -> customer
	RoundEnded   MessageType = "ROUND_ENDED"   // server -> customer
)

// Envelope, tüm WS mesajlarının ortak zarfıdır. Payload, Type'a göre ikinci
// bir adımda ilgili struct'a decode edilir (bkz. Connection.readPump).
type Envelope struct {
	Type    MessageType     `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// NowPlayingPayload, o an mekanda çalan track'i taşır. Player track'i fiilen
// çalmaya başladığında REST üzerinden raporlar (bkz. venue.ReportNowPlaying);
// bu payload o raporun müşteri WS bağlantılarına broadcast edilen halidir.
type NowPlayingPayload struct {
	YoutubeVideoID string `json:"youtubeVideoId"`
}
