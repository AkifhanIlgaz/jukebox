package main

import (
	"log"

	"github.com/AkifhanIlgaz/jukebox/internal/auth"
	"github.com/AkifhanIlgaz/jukebox/internal/config"
	"github.com/AkifhanIlgaz/jukebox/internal/db"
	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
)

func main() {
	cfg := config.Load()

	database, err := db.Connect(cfg.MongoURI, cfg.MongoDBName)
	if err != nil {
		log.Fatal(err)
	}

	authService := auth.NewAuthService(database, cfg.JWTSecret)
	authHandler := auth.NewAuthHandler(authService, cfg.CookieDomain)

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowedOrigin},
		AllowCredentials: true,
	}))
	app.Use(middleware.Device(cfg.CookieDomain))
	app.Use(logger.New())

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	authHandler.RegisterRoutes(app)

	log.Fatal(app.Listen(":" + cfg.Port))
}
