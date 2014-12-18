#!/bin/bash

sudo apt-get install -y php5-cli php5-mongo mongodb-server

curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
