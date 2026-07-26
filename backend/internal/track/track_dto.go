package track

import (
	"time"

	"github.com/AkifhanIlgaz/jukebox/internal/youtube"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type AddTrackRequest struct {
	YoutubeURL     string        `json:"youtubeUrl"`
	YoutubeVideoID string        `json:"-"`
	VenueId        bson.ObjectID `json:"-"`
	UserId         bson.ObjectID `json:"-"`
}

func (r *AddTrackRequest) Validate() error {
	if r.YoutubeURL == "" {
		return ErrYoutubeURLRequired
	}

	videoId, err := youtube.ExtractVideoID(r.YoutubeURL)
	if err != nil {
		return err
	}

	r.YoutubeVideoID = videoId

	return nil
}

func (r *AddTrackRequest) ToPlaylistTrack() *PlaylistTrack {
	return &PlaylistTrack{
		YoutubeID: r.YoutubeVideoID,
		VenueID:   r.VenueId,
		AddedBy:   r.UserId,
		CreatedAt: time.Now(),
	}
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
