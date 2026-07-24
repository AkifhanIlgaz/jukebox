package youtube

import (
	"encoding/json"
	"net/http"
	"net/url"
	"time"
)

type Client struct {
	client  *http.Client
	baseURL string
}

type TrackInfo struct {
	ID        string
	Title     string `json:"title"`
	Channel   string `json:"author_name"`
	Thumbnail string `json:"thumbnail_url"`
}

func NewClient() *Client {
	cc := &http.Client{
		Timeout: 10 * time.Second,
	}

	return &Client{
		client:  cc,
		baseURL: "https://www.youtube.com",
	}
}

func (c *Client) ExtractTrackInfo(videoID string) (*TrackInfo, error) {
	watchURL, err := url.Parse(c.baseURL + "/watch")
	if err != nil {
		return nil, ErrInvalidURL
	}

	watchQuery := watchURL.Query()
	watchQuery.Add("v", videoID)
	watchURL.RawQuery = watchQuery.Encode()

	oembedURL, err := url.JoinPath(c.baseURL, "oembed")
	if err != nil {
		return nil, ErrInvalidURL
	}

	reqURL, err := url.Parse(oembedURL)
	if err != nil {
		return nil, ErrInvalidURL
	}

	q := reqURL.Query()
	q.Add("url", watchURL.String())
	q.Add("format", "json")
	reqURL.RawQuery = q.Encode()

	resp, err := c.client.Get(reqURL.String())
	if err != nil {
		return nil, ErrRequestFailed
	}
	defer resp.Body.Close()

	dec := json.NewDecoder(resp.Body)

	var info TrackInfo
	if err := dec.Decode(&info); err != nil {
		return nil, ErrRequestFailed
	}

	return &info, nil
}
