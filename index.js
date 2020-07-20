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
	const name = req.params.name.toLowerCase();

	if(api.nameExists(name))
		res.sendFile(__dirname+"/client/game/index.html");	
	else
		res.sendFile(__dirname+"/client/404/index.html");
});

app.post("/api/creategame", (req, res) => {
	const { name, num } = req.body;
	
	if(num < 2){
		res.send({ err: "Minimun two players are required to play this game." });
	}
	else if(num > 13){
		res.send({ err: "Maximun 13 players can play the game." });
	}
	else if(api.nameExists(name)){
		res.send({ err: "A game with that name is already running" });
	}
	else {
		api.createNewGame(num, name, io.of("/game/"+name));
		res.send({ ok: true });
	}
});

app.get("/api/getactivegames", (req, res) => {
	res.send(api.getActiveGames());
});
/*
api.on("join", (game) => {
	io.of("/").emit("join", {

	});
});
*/

server.listen(8080, () => console.log("Server running successfully."));