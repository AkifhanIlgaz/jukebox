package middleware

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

const DeviceCookieName = "device_id"

// DeviceLocalsKey ile handler'lar cihaz kimliğine c.Locals üzerinden erişir.
const DeviceLocalsKey = "deviceID"

const deviceCookieMaxAge = 365 * 24 * time.Hour

// Device, ziyaretçi cihazına anonim kimlik atar: çerez yoksa uuid üretip
// httpOnly çerez yazar, varsa olduğu gibi korur (Story 1).
// cookieDomain boşsa çerez host-only yazılır (dev); prod'da ".X.com" verilir
// ve Secure açılır (HTTPS varsayımı).
func Device(cookieDomain string) fiber.Handler {
	return func(c fiber.Ctx) error {
		deviceID := c.Cookies(DeviceCookieName)

		if deviceID == "" {
			deviceID = uuid.NewString()
			c.Cookie(&fiber.Cookie{
				Name:     DeviceCookieName,
				Value:    deviceID,
				Path:     "/",
				Domain:   cookieDomain,
				MaxAge:   int(deviceCookieMaxAge.Seconds()),
				HTTPOnly: true,
				Secure:   cookieDomain != "",
				SameSite: fiber.CookieSameSiteLaxMode,
			})
		}

		c.Locals(DeviceLocalsKey, deviceID)

		return c.Next()
	}
}
