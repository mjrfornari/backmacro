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
let CryptoJS = require('crypto-js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');


app.get('/', function(req, res){
    res.sendFile(__dirname + '/testClient.html')
})



function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}


var whitelist = ['http://192.168.0.251:3000', 'http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}


app.get('/clientes', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         

        db.query('SELECT pk_cli, cast(codigo_representada as varchar(20) character SET UTF8) codigo_representada,'+ 
        'cast(razao_social as varchar(50) character SET UTF8) razao_social, cast(cnpj as varchar(14) character SET UTF8) cnpj,'+
        'cast(fone1 as varchar(20) character SET UTF8) fone1 '+
        'FROM clientes', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})

app.get('/produtos', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         
        let sql = 'SELECT pk_pro, cast(codigo_representada as varchar(20) character SET UTF8) codigo_representada, cast(codigo_macropecas as varchar(20) character SET UTF8) codigo_macropecas,cast(nome_macropecas as varchar(100) character SET UTF8) nome_macropecas '+
        'FROM produtos where ativo='+db.escape("S");
        console.log(sql)
        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log(result) 
            db.detach();
            res.json(result)
        });

    });
})

app.get('/asdd', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         

        db.query('SELECT pk_cli, cast(codigo_representada as varchar(20) character SET UTF8) codigo_representada,'+ 
        'cast(razao_social as varchar(50) character SET UTF8) razao_social, cast(cnpj as varchar(14) character SET UTF8) cnpj,'+
        'cast(fone1 as varchar(20) character SET UTF8) fone1 '+
        'FROM clientes', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})

app.get('/asd', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         

        db.query('SELECT pk_cli, cast(codigo_representada as varchar(20) character SET UTF8) codigo_representada,'+ 
        'cast(razao_social as varchar(50) character SET UTF8) razao_social, cast(cnpj as varchar(14) character SET UTF8) cnpj,'+
        'cast(fone1 as varchar(20) character SET UTF8) fone1 '+
        'FROM clientes', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });

///////////////////////////////////////////////////////////
})



app.get('/login/:user/:password', cors(corsOptions), function (req, res, next) {
    
    let crypto = CryptoJS.MD5(req.params['password'])
    let senha = crypto.toString()
    senha = senha.slice(0,19)

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         
        if  (req.params['user'].length == 11) {

            let sql = 'SELECT PK_VEN FROM VENDEDORES where CPF=' +db.escape(req.params['user'])+' and senha='+db.escape(senha);

            db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log('cpf')
            console.log(result) 
            db.detach();
            res.json(result)
        });}
        else if  (req.params['user'].length == 14) {
            let sql = 'SELECT PK_VEN FROM VENDEDORES where CNPJ=' +db.escape(req.params['user'])+' and senha='+db.escape(senha);
            
            db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log('cnpj') 
            console.log(result)           
            db.detach();
            res.json(result)
        });
        } else {res.json([])
        db.detach();}
    });
    
    
   

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
