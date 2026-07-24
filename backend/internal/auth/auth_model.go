package auth

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// User, mekan sahibi/admin hesabını temsil eder. Kayıt bu iterasyonda yok — hesaplar
// elle (DB'ye direkt) oluşturulur; sahibi isterse ileride yeni admin ekleyebilecek.
type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"id"`
	VenueID      bson.ObjectID `bson:"venue_id" json:"venueId"`
	Username     string        `bson:"username" json:"username"`
	PasswordHash string        `bson:"password_hash" json:"-"`
	CreatedAt    time.Time     `bson:"created_at" json:"createdAt"`
}
