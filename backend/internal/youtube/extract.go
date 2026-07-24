package youtube

import (
	"net/url"
)

const youtubeBaseHost = "www.youtube.com"
const youtubeWatchPath = "/watch"
const youtubeVideoIDParam = "v"

func ExtractVideoID(youtubeURL string) (string, error) {
	u, err := url.Parse(youtubeURL)
	if err != nil {
		return "", err
	}

	if u.Host != youtubeBaseHost || u.Path != youtubeWatchPath {
		return "", ErrInvalidURL
	}

	videoID := u.Query().Get(youtubeVideoIDParam)
	if videoID == "" {
		return "", ErrInvalidURL
	}

	return videoID, nil
}
