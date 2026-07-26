package db

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func Connect(uri, dbName string) (*mongo.Database, error) {
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI).SetTimeout(10 * time.Second)

	client, err := mongo.Connect(opts)
	if err != nil {
		panic(err)
	}

	if err := client.Ping(context.Background(), nil); err != nil {
		return nil, err
	}

	return client.Database(dbName), nil
}
