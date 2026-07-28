package venue

import "errors"

var (
	ErrNameRequired       = errors.New("Mekan adı zorunludur.")
	ErrVenueNotFound      = errors.New("Mekan bulunamadı.")
	ErrInvalidSettings    = errors.New("Tur ayarları geçersiz. Süre ve sayılar pozitif olmalı.")
	ErrYoutubeIDRequired  = errors.New("YouTube ID zorunludur.")
	ErrInvalidPlayerState = errors.New("Geçersiz player state.")
)
