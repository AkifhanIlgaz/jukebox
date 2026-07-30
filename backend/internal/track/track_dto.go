package track

import (
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/youtube"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// AddTrackMode, YoutubeURL hem bir video hem bir playlist'e işaret ettiğinde
// (ör. `?v=...&list=...`) hangisinin ekleneceğini belirtir. URL tek anlamlı
// olduğunda (sadece video veya sadece playlist linki) gerekmez.
type AddTrackMode string

const (
	AddTrackModeVideo    AddTrackMode = "video"
	AddTrackModePlaylist AddTrackMode = "playlist"
)

type AddTrackRequest struct {
	YoutubeURL        string        `json:"youtubeUrl"`
	Mode              AddTrackMode  `json:"mode"`
	YoutubeVideoID    string        `json:"-"`
	YoutubePlaylistID string        `json:"-"`
	VenueId           bson.ObjectID `json:"-"`
	UserId            bson.ObjectID `json:"-"`
}

func (r *AddTrackRequest) Validate() error {
	if r.YoutubeURL == "" {
		return ErrYoutubeURLRequired
	}

	parsed, err := youtube.ParseURL(r.YoutubeURL)
	if err != nil {
		return err
	}

	switch {
	case parsed.VideoID != "" && parsed.PlaylistID != "":
		switch r.Mode {
		case AddTrackModeVideo:
			r.YoutubeVideoID = parsed.VideoID
		case AddTrackModePlaylist:
			r.YoutubePlaylistID = parsed.PlaylistID
		default:
			return ErrAmbiguousYoutubeURL
		}
	case parsed.VideoID != "":
		r.YoutubeVideoID = parsed.VideoID
	default:
		r.YoutubePlaylistID = parsed.PlaylistID
	}

	return nil
}

// IsPlaylist, Validate sonrası bu isteğin bir playlist importu mu yoksa tek
// şarkı ekleme mi olduğunu söyler.
func (r *AddTrackRequest) IsPlaylist() bool {
	return r.YoutubePlaylistID != ""
}

func (r *AddTrackRequest) ToPlaylistTrack() *PlaylistTrack {
	return &PlaylistTrack{
		YoutubeID: r.YoutubeVideoID,
		VenueID:   r.VenueId,
		AddedBy:   r.UserId,
		CreatedAt: time.Now(),
	}
}

// AddTrackResponse, tek şarkı eklemede sadece message ile döner; playlist
// importunda Added/Skipped de dolu gelir (frontend bu ikisinin varlığına
// bakarak hangi durumda olduğunu anlar).
type AddTrackResponse struct {
	Message string `json:"message"`
	Added   *int   `json:"added,omitempty"`
	Skipped *int   `json:"skipped,omitempty"`
}

const (
	defaultTracksPage  = 1
	defaultTracksLimit = 20
	maxTracksLimit     = 100
)

type GetVenueTracksRequest struct {
	Page  int `query:"page"`
	Limit int `query:"limit"`
}

func (r *GetVenueTracksRequest) Normalize() {
	if r.Page < 1 {
		r.Page = defaultTracksPage
	}

	if r.Limit < 1 {
		r.Limit = defaultTracksLimit
	}

	if r.Limit > maxTracksLimit {
		r.Limit = maxTracksLimit
	}
}

func (r *GetVenueTracksRequest) Skip() int64 {
	return int64((r.Page - 1) * r.Limit)
}

type PaginatedTracksResponse struct {
	Tracks     []PlaylistTrack `json:"tracks"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	Total      int64           `json:"total"`
	TotalPages int             `json:"totalPages"`
}
