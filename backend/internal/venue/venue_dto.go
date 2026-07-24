package venue

import "time"

// Varsayılan tur ayarları (bkz. CLAUDE.md — tur süresi/aday sayısı/tekrar
// filtresi varsayılanları).
const (
	defaultRoundIntervalMin     = 10
	defaultCandidateCount       = 5
	defaultRecentlyPlayedWindow = 20
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
			RoundIntervalMin:     defaultRoundIntervalMin,
			CandidateCount:       defaultCandidateCount,
			RecentlyPlayedWindow: defaultRecentlyPlayedWindow,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
}
