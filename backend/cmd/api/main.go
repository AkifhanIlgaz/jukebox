package main

import (
	"log"

	"github.com/AkifhanIlgaz/jukebox/internal/config"
	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func main() {
	cfg := config.Load()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowedOrigin},
		AllowCredentials: true,
	}))
	app.Use(middleware.Device(cfg.CookieDomain))

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	log.Fatal(app.Listen(":" + cfg.Port))
}
