package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	AllowedOrigin string
	// CookieDomain boş bırakılırsa çerez host-only yazılır (dev için doğru).
	// Prod'da ".X.com" verilir (bkz. docs/architecture.md → Kimlik / erişim).
	CookieDomain string
	MongoURI     string
	MongoDBName  string
	JWTSecret    string
}

func Load() Config {
	// .env yoksa (örn. prod'da env değişkenleri doğrudan verilir) sessizce yok sayılır.
	_ = godotenv.Load()

	return Config{
		Port:          getEnv("PORT", "8080"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		CookieDomain:  os.Getenv("COOKIE_DOMAIN"),
		MongoURI:      getEnv("MONGO_URI", ""),
		MongoDBName:   getEnv("MONGO_DB_NAME", "jukebox"),
		JWTSecret:     getEnv("JWT_SECRET", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
