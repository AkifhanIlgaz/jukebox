package main

import (
	"context"
	"errors"
	"log"

	"github.com/AkifhanIlgaz/jukebox/internal/auth"
	"github.com/AkifhanIlgaz/jukebox/internal/config"
	"github.com/AkifhanIlgaz/jukebox/internal/db"
	"github.com/AkifhanIlgaz/jukebox/internal/middleware"
	"github.com/AkifhanIlgaz/jukebox/internal/queue"
	"github.com/AkifhanIlgaz/jukebox/internal/round"
	"github.com/AkifhanIlgaz/jukebox/internal/token"
	"github.com/AkifhanIlgaz/jukebox/internal/track"
	"github.com/AkifhanIlgaz/jukebox/internal/venue"
	"github.com/AkifhanIlgaz/jukebox/internal/youtube"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

const genericErrorMessage = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."

func main() {
	cfg := config.Load()

	database, err := db.Connect(cfg.MongoURI, cfg.MongoDBName)
	if err != nil {
		log.Fatal(err)
	}

	defer database.Client().Disconnect(context.Background())

	redisClient, err := db.ConnectRedis(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatal(err)
	}

	defer redisClient.Close()

	ytClient := youtube.NewClient()

	refreshStore := token.NewRefreshStore(database)
	authMiddleware := middleware.NewAuthMiddleware(cfg.JWTSecret, refreshStore, cfg.CookieDomain)
	authService := auth.NewAuthService(database, cfg.JWTSecret, refreshStore)
	authHandler := auth.NewAuthHandler(authService, authMiddleware, cfg.CookieDomain)

	trackService := track.NewTrackService(database, ytClient)
	trackHandler := track.NewTrackHandler(trackService, authMiddleware)

	venueService := venue.NewVenueService(database, redisClient)
	venueHandler := venue.NewVenueHandler(venueService, authMiddleware)

	queueService := queue.NewQueueService(redisClient, trackService, venueService)
	queueHandler := queue.NewQueueHandler(queueService, authMiddleware)

	roundService := round.NewRoundService(database, redisClient, trackService, venueService, queueService)
	roundHandler := round.NewRoundHandler(roundService, authMiddleware)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := genericErrorMessage

			var fiberErr *fiber.Error
			if errors.As(err, &fiberErr) {
				code = fiberErr.Code
				message = fiberErr.Message
			} else {
				log.Println(err)
			}

			return c.Status(code).JSON(fiber.Map{
				"status":  "error",
				"message": message,
			})
		},
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowedOrigin},
		AllowCredentials: true,
		// X-Access-Token: middleware.Auth() şeffaf refresh sonrası yeni access
		// token'ı buradan döner (bkz. karar 2026-07-28); tarayıcı bu header'ı
		// JS'e Expose edilmeden vermez.
		ExposeHeaders: []string{token.AccessTokenHeader},
	}))
	app.Use(middleware.Device(cfg.CookieDomain))
	app.Use(logger.New())
	app.Use(recover.New())

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	authHandler.RegisterRoutes(app)
	trackHandler.RegisterRoutes(app)
	queueHandler.RegisterRoutes(app)
	roundHandler.RegisterRoutes(app)
	venueHandler.RegisterRoutes(app)

	log.Fatal(app.Listen(":" + cfg.Port))
}
