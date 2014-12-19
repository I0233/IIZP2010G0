package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"

	"github.com/julienschmidt/httprouter"
)

const (
	DEFAULT_DB_URL  = "mongodb://localhost"
	DEFAULT_DB_NAME = "default"
)

type (
	/**
	 * Our 'user' object.
	 */
	User struct {
		ID   bson.ObjectId `bson:"_id"  json:"id"`
		Name string        `bson:"name" json:"name"`
		Tags []string      `bson:"tags" json:"tags"`
	}

	/**
	 * Small wrapper struct used by 'HandlerFunc'.
	 */
	Context struct {
		Params   httprouter.Params
		Database *mgo.Database
	}

	/**
	 * HTTP handlers taken to the next level.
	 */
	HandlerFunc func(http.ResponseWriter, *http.Request, *Context)
)

/**
 * Small helper function that wraps a 'HandlerFunc' and establishes a MongoDB
 * session for the underlying request handler.
 */
func Handler(s *mgo.Session, handler HandlerFunc) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		var (
			session  = s.Copy()
			database = session.DB(DEFAULT_DB_NAME)
		)
		defer session.Close()

		handler(w, r, &Context{p, database})
		return
	}
}

/**
 * Add a new 'user'.
 */
func AddUser(w http.ResponseWriter, r *http.Request, c *Context) {
	user := User{}

	// First we decode the request body, we assume it is a 'user' object.
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		// If we can't parse the Body of the request, we must've gotten some
		// malformed data.
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// We have to explicitly create a new ObjectID with 'mgo'.
	user.ID = bson.NewObjectId()

	// Add the user to the database.
	if err := c.Database.C("users").Insert(&user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Then we marshal the user back to JSON and return it.
	marshaled, err := json.MarshalIndent(user, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set the Content Type and Content Length headers and write out a '201'
	// response (created) containing the JSON data.
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", strconv.Itoa(len(marshaled)))
	w.WriteHeader(201)
	w.Write(marshaled)
	return
}

/**
 * Get a 'user' specified by 'id'.
 */
func GetUser(w http.ResponseWriter, r *http.Request, c *Context) {
	var (
		user      = User{}
		userIDHex = c.Params.ByName("id")
	)

	// Check that we are dealing with a valid ObjectID.
	if !bson.IsObjectIdHex(userIDHex) {
		http.Error(w, "Invalid ObjectID", http.StatusBadRequest)
		return
	}

	// Construct a query to retrieve a 'user' by its 'id' attribute.
	userQuery := c.Database.C("users").FindId(bson.ObjectIdHex(userIDHex))

	// Perform the query to database for the user. Handle cases where the user
	// is not found or something goes seriously wrong.
	if err := userQuery.One(&user); err != nil {
		if err == mgo.ErrNotFound {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Marshal the 'user' struct into 'json' data.
	marshaled, err := json.MarshalIndent(user, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set the Content Type and Content Length headers and write out a '200'
	// response containing the JSON data.
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", strconv.Itoa(len(marshaled)))
	w.WriteHeader(200)
	w.Write(marshaled)
	return
}

/**
 * Get all the 'users'.
 */
func GetUsers(w http.ResponseWriter, r *http.Request, c *Context) {
	users := []User{}

	// First we retrieve the users and marshal them from 'bson' data to an
	// array composed of 'user' structs.
	if err := c.Database.C("users").Find(nil).All(&users); err != nil {
		// Remember that there are error codes other than 500. Make sure to
		// read up on them before throwing them around randomly.
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Marshal the 'user' array into 'json' data.
	marshaled, err := json.MarshalIndent(users, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set the Content Type and Content Length headers and write out a '200'
	// response containing the JSON data.
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", strconv.Itoa(len(marshaled)))
	w.WriteHeader(200)
	w.Write(marshaled)
	return
}

func main() {
	var (
		router       = httprouter.New()
		session, err = mgo.Dial(DEFAULT_DB_URL)
	)

	if err != nil {
		log.Panicln(err.Error())
	}

	router.GET("/users",
		Handler(session, GetUsers))

	router.POST("/users",
		Handler(session, AddUser))

	router.GET("/users/:id",
		Handler(session, GetUser))

	log.Fatalln(http.ListenAndServe(":8080", router))
	return
}
