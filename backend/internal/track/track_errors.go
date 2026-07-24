package track

import "errors"

var (
	ErrYoutubeURLRequired = errors.New("YouTube URL'si zorunludur.")
	ErrTrackAlreadyExists = errors.New("Bu şarkı zaten mevcut.")
)
