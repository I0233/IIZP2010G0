from flask             import Flask, make_response
from flask.ext         import restful as RESTful
from flask.ext.restful import reqparse as ReqParse

from pymongo        import MongoClient
from bson.objectid  import ObjectId
from bson.json_util import dumps

DEFAULT_DB_URL  = 'mongodb://localhost:27017/'
DEFAULT_DB_NAME = 'default'

# Setup a MongoDB connection.
client   = MongoClient(DEFAULT_DB_URL)
database = client[DEFAULT_DB_NAME]

# Insert some dummy data.
database.users.insert({
	'name': 'ismo',
	'tags': [ 'talon', 'mies' ],
})

# Handles actions that target a specific 'user'.
class User(RESTful.Resource):
	# Get the 'user' specified by 'id'.
	def get(self, id):
		# Remember to check that the passed in 'id' is a valid ObjectID, and
		# that the user actually exists.
		return database.users.find_one({ '_id': ObjectId(id) }), 200

# Handles actions that do not target a specific 'user'.
class UserList(RESTful.Resource):
	def __init__(self):
		self.parser = ReqParse.RequestParser()
		self.parser.add_argument('name', type = str)
		self.parser.add_argument('tags', type = str, action = 'append')

	# Get all the 'users'.
	def get(self):
		return list(database.users.find()), 200

	# Creates a new 'user' resource.
	def post(self):
		new_user_id = database.users.insert(self.parser.parse_args())
		return database.users.find_one({ '_id': new_user_id }), 201

# Setup our Flask application
app = Flask(__name__)
api = RESTful.Api(app)

# Due to ObjectIDs, we need a custom Representer for JSON / BSON from MongoDB.
# This in essence will capture the data that we 'return' from a handler...
def represent_bson(data, code, headers = None):
	response = make_response(dumps(data), code)
	response.headers.extend(headers or { })
	return response

# Since the handlers output JSON by default, we can just replace the JSON
# representation function with our custom one.
api.representations.update({
	'application/json': represent_bson,
})

# Route it up.
api.add_resource(UserList, '/users')
api.add_resource(User,     '/users/<string:id>')

# If this is the file being run, run the application.
if __name__ == '__main__':
	app.run(host = '0.0.0.0', port = 8080, debug = True)
