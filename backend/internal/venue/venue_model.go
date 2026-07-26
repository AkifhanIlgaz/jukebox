package venue

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type VenueSettings struct {
	RoundIntervalMin int `bson:"round_interval_min" json:"roundIntervalMin"`
	CandidateCount   int `bson:"candidate_count" json:"candidateCount"`
	// RecentlyPlayedCooldownMin, bir şarkının tekrar aday/fallback
	// olabilmesi için son çalınışından bu kadar dakika geçmesi gerektiğini
	// belirtir (bkz. decisions.md 2026-07-26 — sayı bazlı pencereden süre
	// bazlı cooldown'a geçiş).
	RecentlyPlayedCooldownMin int `bson:"recently_played_cooldown_min" json:"recentlyPlayedCooldownMin"`
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
