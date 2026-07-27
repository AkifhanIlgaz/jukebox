package venue

import "time"

// Varsayılan tur ayarları (bkz. CLAUDE.md — tur süresi/aday sayısı/tekrar
// filtresi varsayılanları).
const (
	defaultRoundIntervalMin          = 2
	defaultCandidateCount            = 5
	defaultRecentlyPlayedCooldownMin = 20
	defaultCandidateCooldownMin      = 30
)

type CreateVenueRequest struct {
	Name    string `json:"name"`
	LogoURL string `json:"logoUrl"`
}

func (r *CreateVenueRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}

	return nil
}

func (r *CreateVenueRequest) ToVenue() *Venue {
	now := time.Now()

	return &Venue{
		Slug:    slugify(r.Name),
		Name:    r.Name,
		LogoURL: r.LogoURL,
		Settings: VenueSettings{
			RoundIntervalMin:          defaultRoundIntervalMin,
			CandidateCount:            defaultCandidateCount,
			RecentlyPlayedCooldownMin: defaultRecentlyPlayedCooldownMin,
			CandidateCooldownMin:      defaultCandidateCooldownMin,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// UpdateVenueRequest, admin panelden mekan adı/logosu ve tur ayarlarının
// güncellenmesi için kullanılır. Slug değişmez (bkz. venue_slug.go).
type UpdateVenueRequest struct {
	Name     string        `json:"name"`
	LogoURL  string        `json:"logoUrl"`
	Settings VenueSettings `json:"settings"`
}

func (r *UpdateVenueRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}

	if r.Settings.RoundIntervalMin <= 0 ||
		r.Settings.CandidateCount <= 0 ||
		r.Settings.RecentlyPlayedCooldownMin <= 0 ||
		r.Settings.CandidateCooldownMin <= 0 {
		return ErrInvalidSettings
	}

	return nil
}
