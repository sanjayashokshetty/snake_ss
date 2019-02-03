var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const _ = require('lodash');

const Snake = require('./snake');
const Apple = require('./apple');

// ID's seed
let autoId = 0;
// Grid size
const GRID_SIZE = 40;
// Remote players 🐍
let players = [];
// Apples 🍎
let apples = [];

http.listen(3000, function(){
    console.log('listening on *:3000');
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client){
    //chat
    console.log('a user connected');
    client.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
    client.on('disconnect', function(){
      console.log('user disconnected');
    });

    //game
    let player;
    let id;

    client.on('auth', (opts, cb) => {
    // Create player
    id = ++autoId;
    player = new Snake(_.assign({
        id,
        dir: 'right',
        gridSize: GRID_SIZE,
        snakes: players,
        apples
    }, opts));
    players.push(player);
    // Callback with id
    cb({ id: autoId });
    });

    // Receive keystrokes
    client.on('key', (key) => {
    // and change direction accordingly
    if(player) {
        player.changeDirection(key);
    }
    });

    // Remove players on disconnect
    client.on('disconnect', () => {
    _.remove(players, player);
    });
});

// Create apples
for(var i=0; i < 3; i++) {
    apples.push(new Apple({
        gridSize: GRID_SIZE,
        snakes: players,
        apples
    }));
}

// Main loop
setInterval(() => {
    players.forEach((p) => {
        p.move();
});

io.emit('state', {
    players: players.map((p) => ({
        x: p.x,
        y: p.y ,
        id: p.id,
        nickname: p.nickname,
        points: p.points,
        tail: p.tail
        })),
        apples: apples.map((a) => ({
        x: a.x,
        y: a.y
        }))
    });
}, 100);
  