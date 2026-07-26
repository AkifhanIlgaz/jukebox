package track

import "errors"

var (
	ErrYoutubeURLRequired = errors.New("YouTube URL'si zorunludur.")
	ErrTrackAlreadyExists = errors.New("Bu şarkı zaten mevcut.")
	ErrTrackNotFound      = errors.New("Şarkı bulunamadı.")
	ErrNoAvailableTrack   = errors.New("Uygun şarkı bulunamadı.")
)
