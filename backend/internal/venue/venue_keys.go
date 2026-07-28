package venue

import "go.mongodb.org/mongo-driver/v2/bson"

func nowPlayingKey(venueId bson.ObjectID) string {
	return "venue:" + venueId.Hex() + ":nowPlaying"
}
