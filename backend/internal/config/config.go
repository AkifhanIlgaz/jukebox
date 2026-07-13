package config

import "os"

type Config struct {
	Port          string
	AllowedOrigin string
	// CookieDomain boş bırakılırsa çerez host-only yazılır (dev için doğru).
	// Prod'da ".X.com" verilir (bkz. docs/architecture.md → Kimlik / erişim).
	CookieDomain string
}

func Load() Config {
	return Config{
		Port:          getEnv("PORT", "8080"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		CookieDomain:  os.Getenv("COOKIE_DOMAIN"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
