<?php

/**
 * A simple  wrapper for 'php-mongo'.
 */
class Database {
	const DEFAULT_DB_URL  = "mongodb://localhost";
	const DEFAULT_DB_NAME = "default";

	/**
	 * A MongoClient instance.
	 * @var MongoClient
	 */
	private static $connection;

	/**
	 * Returns the database with the given name. Will create a connection if
	 * one is not present. Note that
	 *
	 * @param string $name  Name of the database.
	 * @param string $url   URL of the database to connect to.
	 *
	 * @return MongoDB      Instance of MongoDB.
	 */
	public static function DB($name = self::DEFAULT_DB_NAME, $url = self::DEFAULT_DB_URL) {
		if(!isset(self::$connection)) {
			self::$connection = new Mongo($url);
		}
		return self::$connection->$name;
	}
}

?>
