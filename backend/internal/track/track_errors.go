package track

import "errors"

var (
	ErrYoutubeURLRequired = errors.New("YouTube URL'si zorunludur.")
	ErrTrackAlreadyExists = errors.New("Bu şarkı zaten mevcut.")
	ErrTrackNotFound      = errors.New("Şarkı bulunamadı.")
	ErrNoAvailableTrack   = errors.New("Uygun şarkı bulunamadı.")
	// ErrAmbiguousYoutubeURL, hem video hem playlist içeren bir link mode
	// belirtilmeden gönderildiğinde döner (bkz. AddTrackRequest.Validate).
	ErrAmbiguousYoutubeURL = errors.New("Bu link bir oynatma listesinin parçası. Tek şarkı mı, tüm liste mi eklensin?")
)
