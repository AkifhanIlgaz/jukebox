package auth

import "errors"

var (
	ErrUsernameRequired   = errors.New("Kullanıcı adı zorunludur.")
	ErrPasswordRequired   = errors.New("Şifre zorunludur.")
	ErrInvalidCredentials = errors.New("Kullanıcı adı veya şifre hatalı.")
	ErrInvalidToken       = errors.New("Oturum geçersiz veya süresi dolmuş.")
	ErrUsernameTaken      = errors.New("Bu kullanıcı adı zaten kullanılıyor.")
	ErrUserNotFound       = errors.New("Kullanıcı bulunamadı.")
)
