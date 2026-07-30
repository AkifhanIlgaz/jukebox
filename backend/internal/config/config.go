package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	AllowedOrigin string
	// CookieDomain boş bırakılırsa çerez host-only yazılır (dev için doğru).
	// Prod'da ".X.com" verilir (bkz. docs/architecture.md → Kimlik / erişim).
	CookieDomain  string
	MongoURI      string
	MongoDBName   string
	JWTSecret     string
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	// YoutubeAPIKey, playlist importu için YouTube Data API v3'te kullanılır
	// (tekli şarkı ekleme oEmbed ile devam ediyor, key gerektirmiyor).
	YoutubeAPIKey string
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
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		RedisDB:       getEnvInt("REDIS_DB", 0),
		YoutubeAPIKey: os.Getenv("YOUTUBE_API_KEY"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}

func getEnvInt(key string, fallback int) int {
	v, err := strconv.Atoi(os.Getenv(key))
	if err != nil {
		return fallback
	}

	return v
}
