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


// const optionsfb = {
//     host: '192.168.0.254',
//     port: 3050,
//     database: 'C:/react/dados/DADOS.FDB',
//     user: 'SYSDBA',
//     password: 'masterkey',
//     lowercase_keys: false, // set to true to lowercase keys
//     role: null,            // default
//     pageSize: 16384       // default when creating database
// }

// const optionsfb = {
//     host: '187.44.93.73',
//     port: 3050,
//     database: 'C:/react/dados/DADOS.FDB',
//     user: 'SYSDBA',
//     password: 'masterkey',
//     lowercase_keys: false, // set to true to lowercase keys
//     role: null,            // default
//     pageSize: 16384       // default when creating database
// }

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


var whitelist = ['http://192.168.0.251:3000', 'http://localhost:3000', '*']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}


app.get('/clientes/:user', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('SELECT pk_cli, trim(cast(nome_fantasia as varchar(50) character SET UTF8)) NOME_FANTASIA,'+ 
        'trim(cast(razao_social as varchar(50) character SET UTF8)) razao_social, trim(cast(cnpj as varchar(14) character SET UTF8)) cnpj,'+
        'trim(cast(fone1 as varchar(20) character SET UTF8)) fone1, trim(cast(INSCRICAO_ESTADUAL as varchar(20) character SET UTF8)) INSCRICAO_ESTADUAL, trim(cast(INSCRICAO_MUNICIPAL as varchar(20) character SET UTF8)) INSCRICAO_MUNICIPAL, '+
        'trim(cast(SUFRAMA as varchar(20) character SET UTF8)) SUFRAMA, trim(cast(ENDERECO as varchar(100) character SET UTF8)) ENDERECO, trim(cast(NUMERO as varchar(20) character SET UTF8)) NUMERO, '+
        'trim(cast(BAIRRO as varchar(50) character SET UTF8)) BAIRRO, trim(cast(CEP as char(8) character SET UTF8)) CEP, trim(cast(COMPLEMENTO as varchar(20) character SET UTF8)) COMPLEMENTO, '+
        'FK_CID, DDD1, DDD2,'+campoVarChar('SIMPLESNACIONAL', 1)+', trim(cast(FONE2 as varchar(20) character SET UTF8)) FONE2, trim(cast(EMAIL as varchar(40) character SET UTF8)) EMAIL, trim(cast(EMAIL_FINANCEIRO as varchar(100) character SET UTF8)) EMAIL_FINANCEIRO '+
        'FROM clientes WHERE FK_VEN='+db.escape(req.params['user'])+' or FK_VEN2='+db.escape(req.params['user'])+ ' order by RAZAO_SOCIAL', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})

app.get('/descontolog', cors(corsOptions), function (req, res, next) {

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('select pk_des, mes, ano, '+campoDate('data_limite')+', desconto '
        +'from desconto_logistico', function(err, result) {
            // IMPORTANT: close the connection
            console.log(result)
            
            db.detach();
            res.json(result)
        });

    });
})



app.get('/cidades', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('select cid.pk_cid, trim(cast(cid.nome as varchar(30) character SET UTF8)) NOMECIDADE, cid.FK_EST, trim(cast(est.nome as varchar(30) character SET UTF8)) NOMEESTADO, trim(cast(est.sigla as varchar(2) character SET UTF8)) UF from cidade cid '
        +'left join estado est on cid.fk_est = est.pk_est', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})


app.get('/pedidos/:user', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select PED.PK_PED, PED.NRO_MACROPECAS, PED.NUMWEB, PED.FK_CLI, PED.FK_REP, PED.VALOR_IPI, PED.VALOR_ST, CLI.RAZAO_SOCIAL, PED.FK_CPG, CPG.NOME NOMECPG, '+
                'PED.DATA, PED.VALOR_CALCULADO, PED.VALOR_INFORMADO, trim(cast(PED.OBSERVACAO as varchar(5000) character SET UTF8)) OBSERVACAO, '+
                'trim(cast(PED.ORCAMENTO as char(1) character SET UTF8)) ORCAMENTO, cast(PED.DATA_ENVIO as date) DATA_ENVIO, PED.NUMPED, PED.NUMORC, '+
                'trim(cast(PED.ENVIADO as char(1) character SET UTF8)) ENVIADO, trim(cast(PED.IMPORTACAO as char(1) character SET UTF8)) IMPORTACAO,'+
                'trim(cast(PED.STATUS as char(1) character SET UTF8)) STATUS, trim(cast(PED.WEB as char(1) character SET UTF8)) WEB,'+
                'PED.DESCONTO1, PED.DESCONTO2, PED.DESCONTO3 '+
                'from PEDIDOS_VENDA PED '+
                'join CLIENTES CLI on CLI.PK_CLI = PED.FK_CLI '+
                'join COND_PAG CPG on CPG.PK_CPG = PED.FK_CPG '+
                'WHERE PED.FK_VEN='+db.escape(req.params['user'])+' AND DATA>'+db.escape('2018-10-29');
        // console.log(sql)

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})

function campoVarChar (campo, tamanho){
    let x ='trim(cast('+campo+' as varchar('+tamanho+') character SET UTF8)) '+campo
    return x
}

function campoDate (campo){
    let x ='cast('+campo+' as date) '+campo
    return x
}

app.get('/produtos', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_REPRESENTADA as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
        'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
        'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
        campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      

            db.detach();
            res.json(result)
        });

    });
})

app.get('/sticms', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select PK_STI, '+campoVarChar('ORIGEM',2)+', FK_PRO, FK_ESTDESTINO, '+campoVarChar('SIMPLES_NACIONAL', 1)+', PERCENTUAL_ST, FK_ESTORIGEM from ST_ICMS'

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})

app.get('/itepedidos/:pedido', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select IPE.PK_IPE, IPE.FK_PRO, trim(cast(PRO.CODIGO_MACROPECAS as varchar(20) character SET UTF8)) CODIGOPRO, IPE.QUANTIDADE, IPE.VALOR, IPE.DESCONTO1, IPE.DESCONTO2, IPE.DESCONTO3, '+
                'trim(cast(IPE.OBSERVACAO as varchar(100) character SET UTF8)) OBSERVACAO, IPE.CONTROLE, IPE.IPI, IPE.PERC_STICMS, IPE.VALOR_STICMS, (IPE.QUANTIDADE*IPE.VALOR*(IPE.DESCONTO1/100)) as TOTAL '+
                'from ITENS_PED_VENDA IPE '+
                'join PRODUTOS PRO on PRO.PK_PRO = IPE.FK_PRO '+
                'WHERE IPE.FK_PED='+db.escape(req.params['pedido']);
        // console.log(sql)

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})


app.get('/cpg', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select CPG.PK_CPG, trim(cast(CPG.NOME as varchar(50) character SET UTF8)) NOME, CPG.DESCONTO, trim(cast(CPG.CODIGO_REPRESENTADA as varchar(50) character SET UTF8)) CODIGO_REPRESENTADA, '+
                ' trim(cast(CPG.BLOQ_FIN as char(1) character SET UTF8)) BLOQ_FIN, trim(cast(CPG.INATIVO as char(1) character SET UTF8)) INATIVO '+
                'from COND_PAG CPG where cpg.INATIVO <> '+db.escape('S');
        // console.log(sql)

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})



app.get('/gerapk/:nomepk', cors(corsOptions), function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
         db.query('update controle set valor=(valor+1) where campo = '+db.escape(req.params['nomepk']), function(err, result) {
            // IMPORTANT: close the connection
            // console.log(result)
            db.query('select valor from controle where campo = '+db.escape(req.params['nomepk']), function(err, result) {
                // IMPORTANT: close the connection
                // console.log(result)
                res.json(result)
                db.detach();
            });
            
        });
    });
})


app.get('/criaitem/:table/:fields/:values', cors(corsOptions), function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        let sql = 'INSERT INTO '+req.params['table']+' ('+req.params['fields'];
        sql = sql+') values ('+req.params['values']+')';
        console.log(sql)
        if (err)
            throw err;
        db.query(sql, function(err, result) {
                res.json(result)
                db.detach();
        });
            
    });
});

app.get('/atualizaitem/:table/:fieldsnvalues/:where', cors(corsOptions), function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        let sql = 'UPDATE '+req.params['table']+' SET '+req.params['fieldsnvalues'];
        sql = sql+' WHERE '+req.params['where'];
        console.log(sql)
        if (err)
            throw err;
        db.query(sql, function(err, result) {
                res.json(result)
                db.detach();
        });
            
    });
});


app.get('/create/:command', cors(corsOptions), function (req, res, next) {
    console.log('entrou')
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
         db.query('update controle set valor=(valor+1) where campo = '+db.escape('PK_CLI'), function(err, result) {
            // IMPORTANT: close the connection
            console.log(result)
            db.query('select valor from controle where campo = '+db.escape('PK_CLI'), function(err, result) {
                // IMPORTANT: close the connection
                console.log(result)
                res.json(result)
                db.detach();
            });
            
        });
    });
})

app.get('/produtos', cors(corsOptions), function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         
        let sql = 'SELECT pk_pro, trim(cast(codigo_representada as varchar(20) character SET UTF8)) codigo_representada, trim(cast(codigo_macropecas as varchar(20) character SET UTF8)) codigo_macropecas,trim(cast(nome_macropecas as varchar(100) character SET UTF8)) nome_macropecas '+
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

        db.query('SELECT pk_cli, trim(cast(codigo_representada as varchar(20) character SET UTF8)) codigo_representada,'+ 
        'trim(cast(razao_social as varchar(50) character SET UTF8)) razao_social, trim(cast(cnpj as varchar(14) character SET UTF8)) cnpj,'+
        'trim(cast(fone1 as varchar(20) character SET UTF8)) fone1 '+
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

        db.query('SELECT pk_cli, trim(cast(codigo_representada as varchar(20) character SET UTF8)) codigo_representada,'+ 
        'trim(cast(razao_social as varchar(50) character SET UTF8)) razao_social, trim(cast(cnpj as varchar(14) character SET UTF8)) cnpj,'+
        'trim(cast(fone1 as varchar(20) character SET UTF8)) fone1 '+
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
