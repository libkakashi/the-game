const { Game } = require("./game");
const Emitter = require("events");

module.exports = {
	activeGames: {},
	emitter: new Emitter,

	createNewGame(playersNum, name, io){
		const game = new Game(playersNum);

		game.on("turn", (turn) => {
			io.emit("turn", turn);
		});
		
		game.on("new_turn", (turn) => {
			io.emit("new_turn", turn);
		});
		
		game.on("flush", () => {
			io.emit("game_flush");
		});
		
		game.on("abort", () => {
			io.emit("abort");
			this.deleteGame(name);
		});
		
		game.on("winner", (winner) => {
			io.emit("winner", winner);
			this.deleteGame(name);
		});

		game.once("ready", () => {
			const { name } = game.start();
		
			for(let player of game.users.players){
				player.emit("start", {
					player: name,
					cards: player.cards,
					extraCards: game.extraCards
				});
			}
		});

		io.on("connect", socket => {
			let user;
			
			socket.once("message", info => {
				const state = game.state;
				
				try {
					user = game.join(info.name);
				} catch(e){
					socket.send({ err: e.message });
					return;
				}
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
						} catch(e){
							socket.send({ err: e.message });
						}
					});
					socket.on("look", () => {
						try {
							user.look();
							socket.send({ ok: true });
						} catch(e){
							socket.send({ err: e.message });
						}
					});
					socket.on("pass", () => {
						try {
							user.pass();
							socket.send({ ok: true });
						} catch(e){
							socket.send({ err: e.message });
						}
					});
					
					socket.send({
						users: {
							players: game.users.players.map(player => ({ name: player.name, type: "player" })),
							viewers: game.users.viewers.map(viewer => ({ name: viewer.name, type: "viewer" }))
						},
						playersNum: game.playersNum,
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
						playersNum: game.playersNum,
						currentTurn: {
							num: game.cardCount,
							next: game.users.players[game.turn].name,
							card: this.currentTurn
						}
					});
				}
				
				socket.on("chat", (msg) =>{
					io.emit("chat", { user: user.name, msg });
				});
				
				socket.broadcast.emit("join", {
					name: user.name,
					type: user.type
				});
				
				this.emitter.emit("usersChange", {
					name: name, 
					users: {
						players: game.users.players.map(player => player.name),
						viewers: game.users.viewers.map(viewer => viewer.name)
					}
				});
			});
			
			socket.once("disconnect", () => {
				if(user){
					game.leave(user);
					io.emit("leave", { name: user.name, type: user.type });
					
					this.emitter.emit("usersChange", {
						name: name, 
						users: {
							players: game.users.players.map(player => player.name),
							viewers: game.users.viewers.map(viewer => viewer.name)
						}
					});
				}
			});
		});

		this.activeGames[name] = { name, game, io };
	},

	nameExists(name){
		return Boolean(this.activeGames[name]);
	},

	deleteGame(name){
		const game = this.activeGames[name];
		
		// cuz garbage collector wont do it meh
		delete game.game;
		delete game.io;
		delete this.activeGames[name];
	},

	getActiveGames(){
		const games = [];

		for(let name in this.activeGames){
			const { game } = this.activeGames[name];
			
			games.push({
				name: name, 
				users: {
					players: game.users.players.map(player => player.name),
					viewers: game.users.viewers.map(viewer => viewer.name)
				},
				createdAt: game.createdAt, 
				startedAt: game.startedAt, 
				state: game.state,
				playersNum: game.playersNum 
			});
		};

		return games;
	}
};