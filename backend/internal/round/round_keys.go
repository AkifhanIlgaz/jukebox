package round

import "go.mongodb.org/mongo-driver/v2/bson"

func votesKey(roundId bson.ObjectID) string {
	return "round:" + roundId.Hex() + ":votes"
}
