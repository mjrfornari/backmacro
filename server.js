// create server connection


const optionsfb = {
    host: 'servidor',
    port: 3050,
    database: 'C:/delphus/delphus/BancosFB/Projeto Macropecas Web/DADOS.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: false, // set to true to lowercase keys
    role: null,            // default
    pageSize: 16384       // default when creating database
}

const Game = require('./game.js').HigherOrder
let app = require('express')()
let http = require('http').Server(app)
let cors = require('cors')
let io = require('socket.io')(http)
let port = process.env.PORT || 3001
let Firebird = require('node-firebird');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/testClient.html')
})

let retornaSQL = searchsql => {
    Firebird.attach(optionsfb, function(err, db) {
                if (err)
                    throw err;
            
                // db = DATABASE                         

                db.query('SELECT * FROM CONJUNTOS', function(err, result) {
                    // IMPORTANT: close the connection
                    let sql = result
                    db.detach();
                    return sql
                });
            
    });    
}

let corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.get('/user', cors(corsOptions), function (req, res, next) {
     res.json({retornaSQL})


})


// app.get('/user', function(req, res){
//     res.status(200).json({ vai: 'funcionou' })
// })

io.on('connection', function(socket){
    let game = Game()
    socket.on('start', function(msg){
        game.start()
        socket.emit('gameState', game.getState())
        socket.on('turnLeft', function() {
            game.turnLeft()
            socket.emit('gameState', game.getState())
        })
        socket.on('turnRight', function() {
            game.turnRight()
            socket.emit('gameState', game.getState())
        })
        socket.on('shoot', function() {
            game.shoot()
            socket.emit('gameState', game.getState())
        })
        socket.on('testaSQL', function() {
            Firebird.attach(optionsfb, function(err, db) {
                if (err)
                    throw err;
            
                // db = DATABASE                         

                db.query('SELECT * FROM CONJUNTOS', function(err, result) {
                    // IMPORTANT: close the connection
                    socket.emit('voltaSQL', result) 
                    db.detach();
                });
            
            });
            socket.emit('gameState', game.getState())
        })
        let i = setInterval(function(){
            let gameState = game.getState()
            socket.emit('gameState', gameState)
            if(gameState.playerLives <= 0) clearInterval(i)
        }, 20)
    })
})

http.listen(port, function(){
    console.log('listening on *:' + port)
})
