package auth

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Roller: RoleBoss mekan sahibidir (mekan başına tek boss, elle DB'ye açılır),
// RoleAdmin boss tarafından oluşturulan/silinen hesaplardır. Ayarları değiştirme
// ve admin oluşturma/silme sadece boss'a özgüdür, geri kalan her şey ortak.
const (
	RoleAdmin = "admin"
	RoleBoss  = "boss"
)

// User, mekan sahibi/admin hesabını temsil eder. Kayıt bu iterasyonda yok — hesaplar
// elle (DB'ye direkt) oluşturulur; boss ileride yeni admin ekleyebilecek/silebilecek.
type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"id"`
	VenueID      bson.ObjectID `bson:"venue_id" json:"venueId"`
	Username     string        `bson:"username" json:"username"`
	PasswordHash string        `bson:"password_hash" json:"-"`
	Role         string        `bson:"role" json:"role"`
	CreatedAt    time.Time     `bson:"created_at" json:"createdAt"`
}
