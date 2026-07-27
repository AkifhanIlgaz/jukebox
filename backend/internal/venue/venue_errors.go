package venue

import "errors"

var (
	ErrNameRequired  = errors.New("Mekan adı zorunludur.")
	ErrVenueNotFound = errors.New("Mekan bulunamadı.")
)
