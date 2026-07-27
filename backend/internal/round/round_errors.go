package round

import "errors"

var (
	ErrNoOpenRound      = errors.New("Bu mekanda açık bir oylama turu yok.")
	ErrRoundAlreadyOpen = errors.New("Bu mekanda zaten açık bir oylama turu var.")
	ErrNotEnoughTracks  = errors.New("Oylama turu başlatmak için playlist'te yeterli şarkı yok.")
	ErrRoundNotFound    = errors.New("Oylama turu bulunamadı.")
)
