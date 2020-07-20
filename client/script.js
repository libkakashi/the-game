const activeGamesEl = document.getElementById("active-games-content");

const getActiveGames = async () => await (await fetch("/api/getactivegames")).json();

const activeGames = new Map();

const updateActiveGames = (games) => {
    for(let i in games){
        const game = games[i];

        const el = document.createElement("div");

        el.id = "active-game-"+i;
        el.className = "active-game";

        el.innerHTML = `
            <div class="active-game-title">
                ${game.name}
            </div>
            <div class="active-game-users">
                <div class="active-game-players">
                    <div class="active-game-players-heading">
                        Players
                    </div>
                    <div class="active-game-players-content">
                        ${game.users.players.length > 0 ? game.users.players.map((player => `<div class="active-game-player-name">${player}</div>`)).join("\n") : `<div class="active-game-players-empty-message">No players yet.</div>`}
                    </div>
                </div>        
                <div class="active-game-viewers">
                    <div class="active-game-viewers-heading">
                        Viewers
                    </div>
                    <div class="active-game-viewers-content">
                        ${game.users.viewers.length > 0 ? game.users.viewers.map((viewer => `<div class="active-game-viewer-name">${viewer}</div>`)).join("\n") : `<div class="active-game-players-empty-message">No viewers yet.</div>`}
                    </div>
                </div>
                <div class="active-game-players-num">
                    (${game.users.players.length}/${game.playersNum}) players joined.
                </div>
                <div class="active-game-state">
                    ${game.state == "WAITING" ? "Waiting for more players..." : "Started."}
                </div>
                <a href="/game/${game.name}" class="active-game-join-button">Join game</a>
            </div>
        `;
				
		activeGames.set(game.name, game);
        activeGamesEl.appendChild(el);
    }    
};

getActiveGames()
.then((games) => {
    updateActiveGames(games);
});