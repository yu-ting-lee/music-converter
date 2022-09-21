SHELL = /bin/bash


.ONESHELL:

env:
	sudo apt install ffmpeg -y
	npm install
	cd client && npm install && npm run build

run:
	npm start