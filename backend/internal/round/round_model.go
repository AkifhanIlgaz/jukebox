package round

import (
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/track"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type RoundStatus string

const (
	StatusOpen   RoundStatus = "open"
	StatusClosed RoundStatus = "closed"
)

// Candidate, bir round'un aday şarkısı. Votes canlıyken Redis'teki sorted
// set'te tutulur (round:{roundId}:votes); bu alan yalnızca round kapanınca
// final skorla doldurulur (bkz. database.md, karar 2026-07-25).
type Candidate struct {
	TrackID   bson.ObjectID `bson:"track_id" json:"trackId"`
	YoutubeID string        `bson:"youtube_id" json:"youtubeId"`
	Title     string        `bson:"title" json:"title"`
	Channel   string        `bson:"channel" json:"channel"`
	Votes     int           `bson:"votes" json:"votes"`
}

// CandidateFromPlaylistTrack, PlaylistTrack'i round'a aday olarak eklenecek
// Candidate'a çevirir (Votes 0'dan başlar). PlaylistTrack track paketinde
// tanımlı olduğundan bu dönüşüm PlaylistTrack üzerinde bir metod olamaz
// (track paketi round'u import etmiyor, tersi geçerli) — bu yüzden burada,
// Candidate'ın sahibi olduğumuz round paketinde, bir constructor fonksiyonu.
func CandidateFromPlaylistTrack(playlistTrack track.PlaylistTrack) Candidate {
	return Candidate{
		TrackID:   playlistTrack.ID,
		YoutubeID: playlistTrack.YoutubeID,
		Title:     playlistTrack.Title,
		Channel:   playlistTrack.Channel,
		Votes:     0,
	}
}

type Round struct {
	ID              bson.ObjectID `bson:"_id,omitempty" json:"id"`
	VenueID         bson.ObjectID `bson:"venue_id" json:"venueId"`
	Status          RoundStatus   `bson:"status" json:"status"`
	StartedAt       time.Time     `bson:"started_at" json:"startedAt"`
	EndsAt          time.Time     `bson:"ends_at" json:"endsAt"`
	Candidates      []Candidate   `bson:"candidates" json:"candidates"`
	WinnerYoutubeID *string       `bson:"winner_youtube_id" json:"winnerYoutubeId,omitempty"`
}
