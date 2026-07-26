package queue

import "errors"

var (
	ErrNoPlayableTrack    = errors.New("Çalınabilecek şarkı bulunamadı.")
	ErrTrackAlreadyQueued = errors.New("Bu şarkı zaten sırada.")
	ErrTrackNotQueued     = errors.New("Bu şarkı sırada değil.")
)
