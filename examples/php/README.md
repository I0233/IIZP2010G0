# Sample PHP Project

Don't use PHP for your project.

If for some reason you do decide to use PHP... Make sure to read
[this](http://www.phptherightway.com) before delving right into it. This can
save you many headaches.

## Getting Started

1. Setup

	[Composer](https://getcomposer.org) is dependency manager for PHP. You
	should use it. Run the following command in the project directory, to
	install runtime dependencies.

	```
	composer install
	```

2. Running

	PHP has a built in development server which we will be using for now. If
	you want to use Apache, Nginx or some other solution be my guest.

	Run the following command to start a development server at port `8080`. You
	can change the port to anything you want but make sure it matches the
	`forwarded_port` setting in the project's `vagrantfile`.

	```
	php -S 0.0.0.0:8080 index.php
	```

	We bind the server to `0.0.0.0` because of vagrant's port forwarding
	shenanigans. The last argument (`index.php`) is the `router` script, that
	should handle incoming requests.

3. Development

	Add your dependencies to the `composer.json` file. Don't forget to commit
	the `composer.lock` file into version control too, since it controls the
	exact versions of libraries you depend on, essentially making sure each
	team member will be developing against a similiar environment.


