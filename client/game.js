const socket = io();
const cmpCards = (c1, c2) => c1[0] == c2[0] && c1[1] == c2[1];

class Game {
	
	constructor(){
		this.users = {
			players: [],
			viewers: []
		};
		this.normalNames = {
			"A": "Ace",
			"J": "Jack",
			"Q": "Queen",
			"K": "King",
			
			"S": "Spades",
			"C": "Clubs",
			"D": "Diamonds",
			"H": "Hearts"
		};
		this.nativeNames = {
			"Ace": "A",
			"King": "K",
			"Queen": "Q",
			"Jack": "J"
		};
		this.you = {};
		this.state = "WAITING";
	}
	
	prep(){
		socket.on("join", user => {
			if(user.type == "player")
				this.users.players.push(user);
			else
				this.users.viewers.push(user);
			
			this.onUpdate();
		});
		
		socket.on("leave", user => {
			if(usr.type == "player")
				this.users.players.splice(this.users.players.findIndex(usr => usr.name == user.name), 1);
			else
				this.users.viewers.splice(this.users.viewers.findIndex(usr => usr.name == user.name), 1);

			this.onUpdate();
		});
		
		socket.once("start", ({ cards }) => {
			this.you.cards = cards;
			this.state = "STARTED";
			this.users.players.forEach(player => player.num = cards.length);
		});
		
		socket.on("cards", (cards) => {
			this.you.cards = this.you.cards.concat(cards);
			this.onUpdate();
		});
		
		socket.on("new_turn", (turn) => {
			if(turn.player !== this.you.name){
				this.getPlayer(turn.player).num -= turn.num;
				this.onUpdate();
			}
		});

		socket.on("turn", (turn) => {
			if(turn.type == "look"){
				if(turn.success)
					this.getPlayer(turn.last).num += turn.num;
				else if(turn.player != this.you.name)
					this.getPlayer(turn.player).num += turn.num;
			}
			else if(turn.type == "put" && turn.player != this.you.name){
				this.getPlayer(turn.player).num -= turn.num;
			}
			else 
				return;
			
			this.onUpdate();
		});
	}
	
	getPlayer(name){
		return this.users.players.find(player => player.name == name);
	}
	
	join(info){
		return new Promise((resolve, reject) => {
			socket.once("message", (msg) => {
				if(msg.err)
					reject(msg.err);
				
				this.users = msg.users;
				this.state = msg.state;
				
				this.you.name = info.name;
				this.you.type = this.state == "STARTED" ? "viewer" : "player";
				
				resolve();
			});
			
			socket.send(info);
		});
	}
	
	put(cards, as){
		return new Promise((resolve, reject) => {
			socket.once("message", msg => {
			 	if(msg.ok) {
			 		cards.forEach(card => {
						 this.you.cards.splice(this.you.cards.find(crd => cmpCards(card, crd)), 1);
						 this.onUpdate();
					 });
					 this.onUpdate();
			 		resolve();
			 	}
			 	else reject(msg.err);
			 });
			socket.emit("put", { cards, as });
		});
	}
	
	look(){
		return new Promise((resolve, reject) => {
			socket.once("message", msg => {
			 	if(msg.ok) resolve();
			 	else reject(msg.err);
			 });
			socket.emit("look");
		});
	}

	pass(){
		return new Promise((resolve, reject) => {
			socket.once("message", msg => {
			 	if(msg.ok) resolve();
			 	else reject(msg.err);
			 });
			socket.emit("pass");
		});
	}
	
	on(event, callback){
		return socket.on(event, callback);
	}
	
	once(event, callback){
		return socket.once(event, callback);
	}
	
	getState(){
		return new Promise((resolve, reject) => {
			socket.once("state", state => resolve(state));
			socket.emit("gib_state");
		});
	}
	
	normalizeCard(card){
		return (this.normalNames[card[0]] || card[0]) + " of " + (this.normalNames[card[1]] || card[1]);
	}
	
	getCardFromNormalName(card){
		 const arr = card.split(" ");
		 return [arr[0][0], arr[2][0]];
	}
	
	getUnicodeChar(card){
		let char = 0x1F000;
		
		switch(card[1]){
			case "S":
				char += 0xA0;
				break;
			case "H":
				char += 0xB0;
				break;
			case "D":
				char += 0xC0;
				break;
			case "C":
				char += 0xD0;
				break;
		}
		
		switch(card[0]){
			case "A":
				char += 0x1;
				break;
			case "J":
				char += 0xB;
				break;
			case "Q":
				char += 0xD;
				break;
			case "K":
				char += 0xE;
				break;
			default:
				char += Number(card[0]);
				break;
		}
		
		return char;
	}
}