const nameInput = document.getElementById("input-room-name");
const playersNumInput = document.getElementById("input-players-num");
const submitButton = document.getElementById("submit-button");
const messageEl = document.getElementById("message");

const message = (msg) => {
    messageEl.innerHTML = msg;
};
const error = (err) => {
    message("Error: "+err+"!");
};

submitButton.onclick = () => {
    
    const name = nameInput.value;
    const num =  parseFloat(playersNumInput.value);

    if(!name){
        error("Please provide a valid room name");
    }
    else if(!num){
        error("Please provide a valid input for number of players of the game");
    }
    else {
        fetch("/api/creategame", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({ name: name.toLowerCase(), num })
        })
        .then((res) => res.json())
        .then(json => {
            if(json.ok)
                window.location = "/game/"+name;
            else
                error(json.err);
        });
    }
};