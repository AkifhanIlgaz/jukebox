package youtube

import "errors"

var (
	ErrInvalidURL    = errors.New("Lütfen geçerli bir YouTube URL'si giriniz.")
	ErrRequestFailed = errors.New("Video bilgilerini almaya çalışırken bir hata oluştu.")
)
