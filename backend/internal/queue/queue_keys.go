package queue

import "go.mongodb.org/mongo-driver/v2/bson"

func queueKey(venueId bson.ObjectID) string {
	return "venue:" + venueId.Hex() + ":queue"
}

func recentKey(venueId bson.ObjectID) string {
	return "venue:" + venueId.Hex() + ":recent"
}
