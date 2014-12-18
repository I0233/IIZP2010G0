<?php

// Because we are using Composer, we can require our libraries simply by
// requiring this little script.
require "vendor/autoload.php";

// We also require our Database wrapper.
require "database.php";


// Let's declare a global level constant for the database we are about to use.
define("DB_NAME", "testi-kanta");

// We use our Database wrapper to get the specified Database. Note that our
// wrapper handles the underlying client, we just use a certain database.
$db = Database::DB(DB_NAME);

// Let's create some dummy data for our database.
$ismo = array(
	"name" => "ismo",
	"tags" => array("talon", "mies"),
);

// We add our dummy data to the 'users' collection.
$db->users->save($ismo);

// Let's create a simple web application using the Slim framework. For those
// confused by the backslashes, they are namespace declarations.
$app = new \Slim\Slim();

/**
 * Perform a HTTP Response.
 *
 * @param  Slim   $app      The Slim application.
 * @param  array  $payload  The content that is encoded in JSON.
 * @param  number $status   HTTP status code.
 */
function respond($app, $payload, $status = 200) {
	$response = $app->response;

	$response->setStatus($status);
	$response->headers->set("Content-Type", "application/json");
	$response->setBody(json_encode($payload));

	return $response->finalize();
}

/**
 * Returns all the 'users'.
 */
$app->get("/users", function() use ($app, $db) {
	// Please note that using 'iterator_to_array' is not really best practice.
	// An empty 'find' method will return a 'MongoCursor', that can be iterated
	// over.
	// In a situation where you have a lot of data, you don't want to load it
	// all into memory at once and would be better off iterating over it and
	// maybe paging it to some degree.
	return respond($app, iterator_to_array($db->users->find()));
});

/**
 * Adds a new 'user'.
 */
$app->post("/users", function() use($db, $app) {
	// Note that you should check the 'Content-Type' header of request before
	// attempting any decoding and wrap the decode in a 'try' block.
	$payload = json_decode($app->request->getBody());

	// In a real scenario, always validate the payload!
	$db->users->save($payload);

	// Since payload is a reference, it is enhanced with a '_id' attribute on
	// a succesful save. I feel like it the 'save' method would be much more
	// clear if it returned the actual stored instance, but that's PHP for you.
	return respond($app, $payload, 201);
});

/**
 * Get the user specified by 'id'.
 */
$app->get("/users/:id", function($id) use ($app, $db) {
	// Beware of double quotes when constructing MongoDB queries, because they
	// often contain the '$' character which indicates a variable for PHP.
	return respond($app, $db->users->findOne(array("_id" => new MongoId($id))));
});

// Start the Slim application.
$app->run();

?>
