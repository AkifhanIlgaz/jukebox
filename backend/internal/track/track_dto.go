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
