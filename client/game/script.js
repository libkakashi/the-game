<html>
	<head>
		<title>The Game</title>
		<link rel="stylesheet" href="/style.css"/>
	</head>
	<body>
        <!-- y u like ids so much kakshi. lol ids are cool -->
		<div id="login-area">
			<input type="text" id="name-input" placeholder="Enter your name"/>
			<button id="login-button">Join game</button>
		</div>
    
    <!-- when waiting for more players-->
    <div id="waiting-area">
    	Players
    	<div id="playerss">
    		
    	</div>
    	<div>Waiting for more players..</div>
    </div>
    
		<div id="game-area">
			
			<div id="info">
				<div id="users">
					<div id="players">
					
						<div id="players-title">Players</div>
						<div id="player0" class="player"><!-- js puts stuff here --></div>
						<div id="player1" class="player"><!-- js puts stuff here --></div>
					</div>
				
					<div id="viewers">
    				<div id="viewers-title">Viewers</div>
						<!-- js puts stuff here -->
					</div>
				</div>

				<div id="plane"><!-- js puts stuff here --></div>
				<div id="extras">
					<div id="chatbox">
						<div id="chatbox-title">Chat</div>
						<div id="chats">
							<!-- js puts stuff here -->	
						</div>
						<input type="text" id="chat-input" placeholder="Enter message here"/>
					</div>
					<div id="logs">
						<!-- js puts stuff here -->
					</div>
				</div>
			</div>
			
			<div id="main">
				<div id="meta">
					<!-- js puts stuff here -->
				</div>
				<div id="cards">
					<!-- js puts stuff here -->
				</div>
				
				<div id="controls">
					<div>
						<button  class="input" id="throw-button" disabled>Throw</button> as <input class="input" id="as-input" list="cards-list" disabled>
					</div>
					
					<button class="input" id="look-button" disabled>Look</button>
					<button class="input" id="pass-button" disabled>Pass</button>
				</div>
				
			</div>
		</div>
		
		<datalist id="cards-list">
			<option value="Ace">
			<option value="2">
			<option value="3">
			<option value="4">
			<option value="5">
			<option value="6">
			<option value="7">
			<option value="8">
			<option value="9">
			<option value="10">
			<option value="Jack">
			<option value="Queen">
			<option value="King">
		</datalist>
		
		<script src="/socket.io/socket.io.js"></script>
		<script src="/game.js"></script>
		<script src="/script.js"></script>
	</body>
</html>