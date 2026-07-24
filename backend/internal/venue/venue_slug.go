package venue

import (
	"strings"
)

var slugReplacer = strings.NewReplacer(
	"ç", "c", "Ç", "c",
	"ğ", "g", "Ğ", "g",
	"ı", "i", "I", "i",
	"İ", "i", "i", "i",
	"ö", "o", "Ö", "o",
	"ş", "s", "Ş", "s",
	"ü", "u", "Ü", "u",
)

// slugify, mekan adından QR URL'inde kullanılacak slug'ı türetir (örn. "Kahve
// Durağı" → "kahve-duragi"). Çakışmada sonek eklenmesi (kahve-duragi-2) service
// katmanında ele alınır.
func slugify(name string) string {
	s := strings.ToLower(slugReplacer.Replace(name))

	var b strings.Builder
	prevDash := false
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z' || r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		default:
			if !prevDash {
				b.WriteByte('-')
				prevDash = true
			}
		}
	}

	return strings.Trim(b.String(), "-")
}
