package venue

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type VenueSettings struct {
	RoundIntervalMin     int `bson:"round_interval_min" json:"roundIntervalMin"`
	CandidateCount       int `bson:"candidate_count" json:"candidateCount"`
	RecentlyPlayedWindow int `bson:"recently_played_window" json:"recentlyPlayedWindow"`
}

type Venue struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Slug      string        `bson:"slug" json:"slug"`
	Name      string        `bson:"name" json:"name"`
	LogoURL   string        `bson:"logo_url" json:"logoUrl"`
	Settings  VenueSettings `bson:"settings" json:"settings"`
	CreatedAt time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updatedAt"`
}
