const Emitter = require("events");

const cmpCard = (c1, c2) => c1[0] == c2[0] && c1[1] == c2[1];

class User extends Emitter {
	
	cards = [];
	
	constructor(name, game, type){
		super();
		this.name = name;
		this.game = game;
		this.type = type;
	}
	
	setCards(cards){
		this.cards = cards;
	}
	
	has(cards){
		cards.forEach((card) => {
			if(!this.cards.some(crd => cmpCard(crd, card)))
				return false;
		});
		
		return true;
	}
	
	getIndex(card){
		for(let i in this.cards){
			const crd = this.cards[i];
			
			if(cmpCard(crd, card))
				return i;
		}
		
		return -1;
	}
	
	getCard(index){
		return this.cards[index];
	}
	
	put(cards, as){
		
		if(this.has(cards)){
			this.game.put(this, cards, as);
		}
		else {
			throw new Error("You don't have these cards");
		}
	}
	
	look(){
		this.game.look(this);
	}
	
	pass(){
		this.game.pass(this);
	}
}

class Game extends Emitter {
	
	state = "WAITING";
	turn = 0;
	
	currentStack = [];
	currentCard = null;
	cardCount = 0;
	passCount = 0;

	winTurn = false;
	winTurnPlayer = null;

	createdAt = Date.now();
	
	users = {
		viewers: [],
		players: []
	};
	
	constructor(playersNum){
		super();
		this.playersNum = playersNum;
	}
	
	join(name){
		if(!this.exists(name)){
			const user = new User(name, this);
			
			user.type = this.state == "WAITING" ? "player" : "viewer";
			
			this.users[this.state == "WAITING" ? "players" : "viewers"].push(user);
		
			if(this.state == "WAITING" && this.users.players.length == this.playersNum){
				this.state = "READY";
				setImmediate(() => this.emit("ready"));
			}
			
			return user;
		}
		else {
			throw new Error("Name already taken.");
		}
	}
	
	leave(user){
		let i = this.users.viewers.indexOf(user);
		
		if(i != -1)
			return this.users.viewers.splice(i, 1);
		
		i = this.users.players.indexOf(user);
		
		if(i != -1){
			this.users.players.splice(i, 1);
			
			if(this.users.players.length < this.playersNum && this.state != "WAITING"){
				setImmediate(() => this.emit("abort"));
			}
		}
	}
	
	getCards(){
		Game.shuffleDeck();
		
		const deck = Game.deck;
		const num = this.users.players.length;
		const cardsForEach = Math.floor(52/num);
		const extraCards = 52-cardsForEach*num;
		
		const cards = [...Array(num)].map(_ => []);
		
		let x = 0;
		
		for(let i = 0; i < cardsForEach; ++i)
			for(let j = 0; j < num; ++j)
				cards[j][i] = deck[++x];
		
		for(let i = 0; i < num; ++i)
			this.users.players[i].setCards(cards[i]);
		
		return cards;
	}
	
	start(){
		const user = this.users.players[0];
		
		this.getCards();
		this.turn = 0;
		this.state = "STARTED";
		this.startedAt = Date.now();

		setImmediate(() => user.emit("new_turn"));
		
		return user;
	}
	
	put = (player, cards, as) => {
		
		if(this.users.players[this.turn].name == player.name){
			
			this.passCount = 0;
			
			const next = this.nextTurn();
				
			if(this.cardCount === 0){
				this.currentCard = as;

				setImmediate(() => this.emit("new_turn", {
					type: "put",
					num: cards.length,
					player: player.name,
					card: this.currentCard,
					next: next.name
				}));
			}
			else {
				setImmediate(() => this.emit("turn", {
					type: "put",
					num: cards.length,
					player: player.name,
					card: this.currentCard,
					next: next.name
				}));
			}

			setImmediate(() => next.emit("turn"));
				
			this.currentStack.push({ cards, player });
			this.cardCount += cards.length;
			
			for(let card of cards)
				player.cards.splice(player.cards.find(crd => cmpCard(crd, card)), 1);
			
			
			if(this.winTurn)
				this.announceWinner(this.winTurnPlayer);

			if(player.cards.length === 0){
				this.winTurn = true;
				this.winTurnPlayer = player;
			}
			else {
				this.winTurn = false;
				this.winTurnPlayer = null;
			}
		}
		else {
			throw new Error("Its not your turn.");
		}
	};
	
	nextTurn(){
		this.turn++;
		
		if(this.turn == this.playersNum)
			this.turn = 0;
			
		const player = this.users.players[this.turn];
		
		return player;
	}
	
	look = (player) => {
		
		if(this.users.players[this.turn].name == player.name){
			
			if(this.currentStack.length > 0){
				this.passCount = 0;
			
				const lastTurn = this.currentStack[this.currentStack.length-1];
				const cardCount = this.cardCount;
				
				if(!lastTurn.cards.every(card => card[0] == this.currentCard)){
				
					setImmediate(() => this.emit("turn", { 
						type: "look",
						success: true,
						cards: lastTurn.cards,
						player: player.name,
						last: lastTurn.player.name,
						num: cardCount,
						next: player.name
					}));
					
					this.winTurn = false;
					this.winTurnPlayer = null;

					this.flush(lastTurn.player);
					this.newTurn(player);
				}
				else {	
					setImmediate(() => this.emit("turn", { 
						type: "look",
						success: false,
						cards: lastTurn.cards,
						player: player.name,
						last: lastTurn.player.name,
						num: cardCount,
						next: lastTurn.player.name
					}));
					
					if(this.winTurn)
						this.announceWinner(this.winTurnPlayer)
					
					this.flush(player);
					this.newTurn(lastTurn.player);	
				}
			}
			else {
				throw new Error("There are no cards to look.");
			}
		}
		else {
			throw new Error("Its not your turn.");
		}
	}
	
	flush(player){
		
		if(player){
			let cards = [];
		
			this.currentStack.forEach(turn => {
				cards = cards.concat(turn.cards);
			});
		
			player.cards = player.cards.concat(cards);
			player.emit("cards", cards);
		}
		
		this.currentStack = [];
		this.currentCard = null;
		this.cardCount = 0;
		
		setImmediate(() => this.emit("flush"));
	}
	
	pass = (player) => {
		
		if(this.users.players[this.turn].name == player.name){
				
			if(this.currentStack.length){
				++this.passCount;
				
				if(this.passCount == this.playersNum){
					
					this.flush();
					let next = this.currentStack[this.currentStack.length-1].player;
					
					if(this.winTurn){
						this.announceWinner(this.winTurnPlayer);
						next = this.currentStack[this.currentStack.length-2];
					}
					
					setImmediate(() => this.emit("turn", { 
						type: "pass",
						player: player.name,
						next: next.name
					}));
				
					this.newTurn(next);
				}
				else {
					const next = this.nextTurn();
					
					setImmediate(() => this.emit("turn", { 
						type: "pass",
						player: player.name,
						next: next.name
					}));
					
					setImmediate(() => next.emit("turn"));
				}
			}
			else {
				throw new Error("You can't pass this turn.");
			}
		}
		else {
			throw new Error("Its not your turn.");
		}
	}
	
	newTurn(player){
		this.turn = this.users.players.indexOf(player);
		
		player.emit("new_turn");
		return player;
	}
	
	static shuffleDeck(){
		
		for(let i = 0; i < 100; ++i){
			const rand = Math.floor(Math.random()*52);
			const i = Math.floor(Math.random()*(52-rand));
		
			const t = Game.deck.splice(i, rand);
			Game.deck = Game.deck.concat(t);
		}
	
		return Game.deck;
	}
	
	exists(name){
		return this.users.players.some(usr => usr.name == name) || this.users.viewers.some(usr => usr.name == name);
	}
	
	announceWinner(player){
		setImmediate(() => this.emit("winner", player.name));
		this.users.players.splice(this.users.players.indexOf(player), 1);
		--this.playersNum;
	}

	static deck = [
		["A", "S"],
		["2", "S"],
		["3", "S"],
		["4", "S"],
		["5", "S"],
		["6", "S"],
		["7", "S"],
		["8", "S"],
		["9", "S"],
		["10", "S"],
		["J", "S"],
		["Q", "S"],
		["K", "S"],
		
		["A", "D"],
		["2", "D"],
		["3", "D"],
		["4", "D"],
		["5", "D"],
		["6", "D"],
		["7", "D"],
		["8", "D"],
		["9", "D"],
		["10", "D"],
		["J", "D"],
		["Q", "D"],
		["K", "D"],
		
		["A", "H"],
		["2", "H"],
		["3", "H"],
		["4", "H"],
		["5", "H"],
		["6", "H"],
		["7", "H"],
		["8", "H"],
		["9", "H"],
		["10", "H"],
		["J", "H"],
		["Q", "H"],
		["K", "H"],
		
		["A", "C"],
		["2", "C"],
		["3", "C"],
		["4", "C"],
		["5", "C"],
		["6", "C"],
		["7", "C"],
		["8", "C"],
		["9", "C"],
		["10", "C"],
		["J", "C"],
		["Q", "C"],
		["K", "C"]
	];
}
	
module.exports = { Game, User };