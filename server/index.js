const express = require("express");
const http = require("http");
const morgan = require("morgan");
const socket = require("socket.io");
const api = require("./api");

const port = process.env.PORT || 5000;
const app = express();
const public = "client/build";
const server = http.createServer(app);
const io = socket(server);

// middleware
app.use(morgan("dev", { immediate: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(public));

// express
app.post("/api/get-info", (req, res) => {
  api.getInfo(req, res);
});
app.post("/api/get-file", (req, res) => {
  api.getFile(req, res, io);
});
app.post("*", (req, res) => {
  res.status(404).send("Not Found!");
});
app.get("*", (req, res) => {
  res.status(404).send("Not Found!");
});
server.listen(port, () => {
  console.log(`Listening Port: ${port}`);
});

// socket.io
io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);
  socket.on("ready", () => {
    socket.emit("create", socket.id);
  });
});
