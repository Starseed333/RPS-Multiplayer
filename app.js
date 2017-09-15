$(document).ready(function(){
console.log("inside js");

var config = {
    apiKey: "AIzaSyDPzueWrdTSP7ar2SCji0dP5291tUtvhqY",
    authDomain: "rockpaperscissors-d013c.firebaseapp.com",
    databaseURL: "https://rockpaperscissors-d013c.firebaseio.com",
    projectId: "rockpaperscissors-d013c",
    storageBucket: "",
    messagingSenderId: "124222787692"
  };
  

  firebase.initializeApp(config);


//-----------------Global Variables-------------------------------


// Player names
var player1Name = "";
var player2Name = "";

// Name of the player in their browser
var yourPlayerName = "";

// Store the player choices
var player1Choice = "";
var player2Choice = "";

//Turn
var turn = 1;

var player1 = null;
var player2 = null;

//Firebase Reference
var db = firebase.database();
//--------------End of Global Variable-----------------------------



//DB Listener to listen for changes
db.ref("/players/").on("value", function(snapshot) {
  // Check the database for player1
  if (snapshot.child("player1").exists()) {
    console.log("Player 1 exists");

    // Player1 data FB
    player1 = snapshot.val().player1;
    player1Name = player1.name;

    //Player1 Display
    $("#playerOneName").text(player1Name);
    $("#player1Stats").html("Win: " + player1.win + ", Loss: " + player1.loss + ", Tie: " + player1.tie);
  } else {
    //console.log("Player 1 is not here");
    
    player1 = null;
    player1Name = "";

    // Update player1 display
    $("#playerOneName").text("Waiting for Player 1");
    $("#playerPanel1").removeClass("playerPanelTurn");
    $("#playerPanel2").removeClass("playerPanelTurn");
    
    //DB outcome
    db.ref("/outcome").remove();
    //html outcome
    $("#roundOutcome").html("Rock * Paper * Scissors");
    $("#waitingNotice").html("");
    $("#player1Stats").html("Win: 0, Loss: 0, Tie: 0");
  }



  // Check the database for player2
  if (snapshot.child("player2").exists()) {
    console.log("Player 2 exists");

    // Player2 data FB
    player2 = snapshot.val().player2;
    player2Name = player2.name;

    // Update player2 display
    $("#playerTwoName").text(player2Name);
    $("#player2Stats").html("Win: " + player2.win + ", Loss: " + player2.loss + ", Tie: " + player2.tie);
  } else {
   // console.log("Player 2 is not available");
    
    player2 = null;
    player2Name = "";

    // Update player2 display
    $("#playerTwoName").text("Waiting for Player 2");
    $("#playerPanel1").removeClass("playerPanelTurn");
    $("#playerPanel2").removeClass("playerPanelTurn");
    
    //DB outcome
    db.ref("/outcome/").remove();
    //html outcome
    $("#roundOutcome").html("Rock * Paper * Scissors");
    $("#waitingNotice").html("");
    $("#player2Stats").html("Win: 0, Loss: 0, Tie: 0");
  }

  // Both players present player one goes first
  if (player1 && player2) {
    // Update the display with a black border for the current player
    $("#playerPanel1").addClass("playerPanelTurn");

    // Update the center display
    $("#waitingNotice").html("Waiting on " + player1Name + " to choose.");
  }

  // If both players leave the game, empty the chat session
  if (!player1 && !player2) {
    db.ref("/chat/").remove();
    db.ref("/turn/").remove();
    db.ref("/outcome/").remove();
    //empty the html chat session
    $("#chatDisplay").empty();
    $("#playerPanel1").removeClass("playerPanelTurn");
    $("#playerPanel2").removeClass("playerPanelTurn");
    $("#roundOutcome").html("Rock-Paper-Scissors");
    $("#waitingNotice").html("");
  }
  
});



//------------End of Listening for Changes----------------------------






//------------------Beginning of DB listener for players leaving------
// DB Listener for players leaving
db.ref("/players/").on("child_removed", function(snapshot) {
  var msg = snapshot.val().name + " has left the game!";

  // Get a key for the disconnection chat entry
  var chatKey = db.ref().child("/chat/").push().key;

  // Save the disconnection chat entry
  db.ref("/chat/" + chatKey).set(msg);
});

// Attach a listener to the database /chat/ node to listen for any new chat messages
db.ref("/chat/").on("child_added", function(snapshot) {
  var chatMsg = snapshot.val();
  var chatEntry = $("<div>").html(chatMsg);

  // Change the color of the chat message depending on user or connect/disconnect event
  if (chatMsg.includes("disconnected")) {
    chatEntry.addClass("chatColorDisconnected");
  } else if (chatMsg.includes("joined")) {
    chatEntry.addClass("chatColorJoined");
  } else if (chatMsg.startsWith(yourPlayerName)) {
    chatEntry.addClass("chatColor1");
  } else {
    chatEntry.addClass("chatColor2");
  }
  //update the html chat box with scroll bar accordingly to the chatbox height
  $("#chatDisplay").append(chatEntry);
  $("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});

//----------------------End of listener-------------------------------


//------------------------Beginning of Listener for Turns-------------
//DB Listener for the turns
db.ref("/turn/").on("value", function(snapshot) {
  // Check if it's player1 turn
  if (snapshot.val() === 1) {
    //console.log("turn 1");
    turn = 1;

    // Update the display if both players are in the game
    if (player1 && player2) {
      $("#playerPanel1").addClass("playerPanelTurn");
      $("#playerPanel2").removeClass("playerPanelTurn");
      $("#waitingNotice").html("Waiting on " + player1Name + " to choose.");
    }
  } else if (snapshot.val() === 2) {
    //console.log("turn 2");
    turn = 2;

    // Update the display if both players are in the game
    if (player1 && player2) {
      $("#playerPanel1").removeClass("playerPanelTurn");
      $("#playerPanel2").addClass("playerPanelTurn");
      $("#waitingNotice").html("Waiting on " + player2Name + " to choose.");
    }
  }
});


//----------------End of Listener--------------------------------------




// DB Listener for the game outcome
db.ref("/outcome/").on("value", function(snapshot) {
  $("#roundOutcome").html(snapshot.val());
});








//-----------------------Beginning of event handler-----------------

 //Event Handler for the new user (submit button)
$("#add-name").on("click", function(event) {
  event.preventDefault();

  // First, make sure that the name field is non-empty and we are still waiting for a player
  if ( ($("#name-input").val().trim() !== "") && !(player1 && player2) ) {
    // Adding player1
    if (player1 === null) {
      //console.log("adding player 1");
      
      yourPlayerName = $("#name-input").val().trim();
      //DB game score update
      player1 = {
        name: yourPlayerName,
        win: 0,
        loss: 0,
        tie: 0,
        choice: ""
      };

      // Add player1 to the DB
      db.ref().child("/players/player1").set(player1);


      // Set the turn value to 1 in DB
      db.ref().child("/turn").set(1);

      // Remove the user from the database once disconnected
      db.ref("/players/player1").onDisconnect().remove();
    } else if( (player1 !== null) && (player2 === null) ) {
      // Adding player2
      //console.log("adding player 2");

      
      yourPlayerName = $("#name-input").val().trim();
      //DB game score update
      player2 = {
        name: yourPlayerName,
        win: 0,
        loss: 0,
        tie: 0,
        choice: ""
      };

      // Add player2 to the DB
      db.ref().child("/players/player2").set(player2);

      // Remove the user from the database once disconnected
      db.ref("/players/player2").onDisconnect().remove();
    }

    // Add a user joining message to the chat
    var msg = yourPlayerName + " has joined!";
    //console.log(msg);

    // Get a key for the join chat entry
    var chatKey = db.ref().child("/chat/").push().key;

    // DB Join chat entry
    db.ref("/chat/" + chatKey).set(msg);

    // Reset the name input box
    $("#name-input").val(""); 
  }
});



//------------------------end of event handler----------------------






//Chat send Button
$("#chat-send").on("click", function(event) {
  event.preventDefault();

  //If player exists and the message box is not empty
  if ( (yourPlayerName !== "") && ($("#chat-input").val().trim() !== "") ) {
    //Reset the input box by grabbing the message
    var msg = yourPlayerName + ": " + $("#chat-input").val().trim();
    $("#chat-input").val("");

    // Key for the new chat entry
    var chatKey = db.ref().child("/chat/").push().key;

    // New chat entry
    db.ref("/chat/" + chatKey).set(msg);
  }
});





//----------------------------Both players selections--------------------



// Player1's selection
$("#playerPanel1").on("click", ".panelOption", function(event) {
  event.preventDefault();

  // Make selections only when both players are in the game
  if (player1 && player2 && (yourPlayerName === player1.name) && (turn === 1) ) {
    // Player1's choice
    var choice = $(this).text().trim();

    // Player choice into the db
    player1Choice = choice;
    db.ref().child("/players/player1/choice").set(choice);

    // Turn value to 2 for the 2nd turn/next turn
    turn = 2;
    db.ref().child("/turn").set(2);
  }
});




// Player2's selection
$("#playerPanel2").on("click", ".panelOption", function(event) {
  event.preventDefault();

  // Make selections only when both players are in the game
  if (player1 && player2 && (yourPlayerName === player2.name) && (turn === 2) ) {
    // Record player2's choice
    var choice = $(this).text().trim();

    // Player choice into the db
    player2Choice = choice;
    db.ref().child("/players/player2/choice").set(choice);

    // Compare player1 and player 2 choices and record the outcome
    rpsGame();
  }
});




//------------------------End both players selection---------------------



// The Logic of the game
function rpsGame() {
  if (player1.choice === "Rock") {
    if (player2.choice === "Rock") {
      // Tie
      //console.log("tie");

      db.ref().child("/outcome/").set("Tie Game!");
      db.ref().child("/players/player1/tie").set(player1.tie + 1);
      db.ref().child("/players/player2/tie").set(player2.tie + 1);
    } else if (player2.choice === "Paper") {
      // Player2 wins
     // console.log("paper wins");

      db.ref().child("/outcome/").set("Paper Wins!");
      db.ref().child("/players/player1/loss").set(player1.loss + 1);
      db.ref().child("/players/player2/win").set(player2.win + 1);
    } else { // scissors
      // Player1 wins
      //console.log("rock wins");

      db.ref().child("/outcome/").set("Rock Wins!");
      db.ref().child("/players/player1/win").set(player1.win + 1);
      db.ref().child("/players/player2/loss").set(player2.loss + 1);
    }

  

  } else if (player1.choice === "Paper") {
    if (player2.choice === "Rock") {
      // Player1 wins
      //console.log("paper wins");

      db.ref().child("/outcome/").set("Paper Wins!");
      db.ref().child("/players/player1/win").set(player1.win + 1);
      db.ref().child("/players/player2/loss").set(player2.loss + 1);
    } else if (player2.choice === "Paper") {
      // Tie
     // console.log("tie");

      db.ref().child("/outcome/").set("Tie Game!");
      db.ref().child("/players/player1/tie").set(player1.tie + 1);
      db.ref().child("/players/player2/tie").set(player2.tie + 1);
    } else { // Scissors
      // Player2 wins
     // console.log("scissors win");

      db.ref().child("/outcome/").set("Scissors Win!");
      db.ref().child("/players/player1/loss").set(player1.loss + 1);
      db.ref().child("/players/player2/win").set(player2.win + 1);
    }

  

  } else if (player1.choice === "Scissors") {
    if (player2.choice === "Rock") {
      // Player2 wins
     // console.log("rock wins");

      db.ref().child("/outcome/").set("Rock Wins!");
      db.ref().child("/players/player1/loss").set(player1.loss + 1);
      db.ref().child("/players/player2/win").set(player2.win + 1);
    } else if (player2.choice === "Paper") {
      // Player1 wins
     // console.log("scissors win");

      db.ref().child("/outcome/").set("Scissors Win!");
      db.ref().child("/players/player1/win").set(player1.win + 1);
      db.ref().child("/players/player2/loss").set(player2.loss + 1);
    } else {
      // Tie
     // console.log("tie");

      db.ref().child("/outcome/").set("Tie Game!");
      db.ref().child("/players/player1/tie").set(player1.tie + 1);
      db.ref().child("/players/player2/tie").set(player2.tie + 1);
    }

  }



  // Change the value of the turn in DB
  turn = 1;
  db.ref().child("/turn").set(1);
};


});










