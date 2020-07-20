const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { Game } = require("./game");
const api = require("./api");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());
app.use(express.static(__dirname+"/client"));

app.get("/game/:name", (req, res) => {
	const { name } = req.params;

	if(api.nameExists(name))
		res.sendFile(__dirname+"/client/game/index.html");	
	else
		res.sendFile(__dirname+"/client/404/index.html");
});

app.post("/api/creategame", (req, res) => {
	const { name, num } = req.body;
	
	if(api.nameExists(name.toLowerCase())){
		res.send({ err: "A game with that name is already running" });
	}
	else {
		api.createNewGame(num, name, io.of("/game/"+name));
		res.send({ ok: true });
	}
});

server.listen(8080, () => console.log("Server running successfully."));