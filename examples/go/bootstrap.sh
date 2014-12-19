#!/bin/bash

apt-get install -y git golang mongodb-server

# setup GOPATH and change the owner to 'vagrant' user
echo "export GOPATH=/home/vagrant/go" >> /home/vagrant/.profile
chown -R vagrant:vagrant /home/vagrant/go
