package track

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Track struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"id"`
	YoutubeID      string        `bson:"youtube_id" json:"youtubeId"`
	TotalVotes     int           `bson:"total_votes" json:"-"`
	NumberOfWins   int           `bson:"number_of_wins" json:"-"`
	NumberOfVenues int           `bson:"number_of_venues" json:"-"`
}

type PlaylistTrack struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	YoutubeID string        `bson:"youtube_id" json:"youtubeId"`
	Title     string        `bson:"title" json:"title"`
	Channel   string        `bson:"channel" json:"channel"`
	VenueID   bson.ObjectID `bson:"venue_id" json:"-"`
	CreatedAt time.Time     `bson:"created_at" json:"createdAt"`
	AddedBy   bson.ObjectID `bson:"added_by" json:"addedBy"`
	// LastPlayedAt, "son çalınanlar" cooldown filtresi için (bkz.
	// decisions.md 2026-07-26). Hiç çalınmadıysa nil.
	LastPlayedAt *time.Time `bson:"last_played_at" json:"lastPlayedAt,omitempty"`
}
