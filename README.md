## Description

A website that can convert YouTube video or playlist URLs into files

## Get Started

#### Run Locally

```
sudo apt install ffmpeg -y
npm install
cd client && npm install && npm run build
cd .. && npm start
```

#### Deploy to Heroku

```
heroku buildpacks:set https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
```

## Support Options

`url`, `compress`, `format`
