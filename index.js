const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { Game } = require("./game");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(__dirname+"/client"));

app.get("game/*", (req, res) => {
	res.sendFile(__dirname+"/game/index.html");
});

server.listen(8080, () => console.log("Server running successfully."));

let game = new Game(3);

game.on("turn", (turn) => {
	io.to("game").emit("turn", turn);
});

game.on("new_turn", (turn) => {
	io.to("game").emit("new_turn", turn);
});

game.on("flush", () => {
	io.to("game").emit("game_flush");
});

game.on("abort", () => {
	io.to("game").emit("abort");
	game = new Game(3);
});

game.once("ready", () => {
	const { name } = game.start();

	for(let player of game.users.players)
		player.emit("start", {
			player: name,
			cards: player.cards
		});
});
	
io.on("connection", socket => {
	
	let user;
	
	socket.once("message", info => {
		const state = game.state;
		
		user = game.join(info.name);
		user.sock = socket;
		
		if(state == "WAITING"){
			
			user.on("new_turn", () => {
				socket.emit("my_new_turn");
			});
			user.on("turn", () => {
				socket.emit("my_turn");
			});
			user.on("cards", cards => {
				socket.emit("cards", cards);
			});
			user.on("start", data => {
				socket.emit("start", data);
			});
			
			socket.on("put", ({ cards, as }) => {
				try {
					user.put(cards, as);
					socket.send({ ok: true });
				}
				catch(e){
					socket.send({ err: e.message });
				}
			});
			socket.on("look", () => {
				try {
					user.look();
					socket.send({ ok: true });
				}
				catch(e){
					socket.send({ err: e.message });
				}
			});
			socket.on("pass", () => {
				try {
					user.pass();
					socket.send({ ok: true });
				}
				catch(e){
					socket.send({ err: e.message });
				}
			});
			
			socket.send({
				users: {
					players: game.users.players.map(player => ({ name: player.name, type: "player" })),
					viewers: game.users.viewers.map(viewer => ({ name: viewer.name, type: "viewer" }))
				},
				state: game.state
			});
		}
		else {
			socket.send({
				users: {
					players: game.users.players.map(player => ({ name: player.name, type: "player", num: player.cards.length })),
					viewers: game.users.viewers.map(viewer => ({ name: viewer.name, type: "viewer" }))
				},
				state: game.state,
				currentTurn: {
					num: game.cardCount,
					next: game.users.players[game.turn].name,
					card: this.currentTurn
				}
			});
		}
		
		socket.on("chat", (msg) =>{
			io.to("game").emit("chat", { user: user.name, msg });
		});

		socket.join("game");
		
		socket.broadcast.emit("join", {
			name: user.name,
			type: user.type
		});
	});
	
	socket.once("disconnect", () => {
		if(user){
			game.leave(user);
			io.to("game").emit("leave", { name: user.name, type: user.type });
		}
	});
});