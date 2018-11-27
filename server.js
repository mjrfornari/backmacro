// create server connection

// const optionsfb = {
//     host: 'servidor',
//     port: 3050,
//     database: 'C:/delphus/delphus/BancosFB/Projeto Macropecas Web/DADOS.FDB',
//     user: 'SYSDBA',
//     password: 'masterkey',
//     lowercase_keys: false, // set to true to lowercase keys
//     role: null,            // default
//     pageSize: 16384       // default when creating database
// }


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

const optionsfb = {
    host: '187.44.93.73',
    port: 3050,
    database: 'C:/react/dados/DADOS2.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: false, // set to true to lowercase keys
    role: null,            // default
    pageSize: 16384       // default when creating database
}

let app = require('express')()
let http = require('http').Server(app)
let cors = require('cors')
const fs = require('fs');
let port = process.env.PORT || 3001
let Firebird = require('node-firebird');
let CryptoJS = require('crypto-js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
var sread = require('stream').Readable;
var stream = sread();

var swrite = require('stream').Writable;
var wstream = swrite();






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

app.use(cors())

var whitelist = ['https://192.168.0.254', 'http://localhost:3000']
var corsOptions = {
  origin: 'https://macropecasweb.sytes.net',
  optionsSuccessStatus: 200
}



app.get('/api/clientes/:user',  function (req, res, next) {

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

app.get('/api/descontolog',  function (req, res, next) {

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('select pk_des, mes, ano, '+campoDate('data_limite')+', desconto '
        +'from desconto_logistico', function(err, result) {
            // IMPORTANT: close the connection
            
            db.detach();
            res.json(result)
        });

    });
})



app.get('/api/cidades',  function (req, res, next) {
    
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


app.get('/api/pedidos/:user',  function (req, res, next) {
    
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

// app.get('/api/produtos',  function (req, res, next) {
    
//     Firebird.attach(optionsfb, function(err, db) {
//         if (err)
//             throw err;                        

//         let sql = 'select first 10000 PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_REPRESENTADA as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
//         'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
//         'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
//         campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        

//         db.query(sql, function(err, result) {
//             // IMPORTANT: close the connection
//             if (err)
//                 throw err;

//             db.detach();
//             res.json(result)
//         });

//     });
// })

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

app.get('/api/produtos',  function (req, res, next) {
    // console.log(req.query)
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;             
        


        let sql = isEmpty(req.query) ? 'select count(pk_pro) from produtos where ATIVO='+db.escape('S') :  'select first '+req.query.first+' skip '+req.query.skip+' PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_REPRESENTADA as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
        'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
        'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
        campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        


        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
            if (err)
                throw err;

            db.detach();
            res.json(result)
        });

    });
})




app.get('/api/sticms',  function (req, res, next) {
    // console.log(req.query)
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;             
        


        let sql = isEmpty(req.query) ? 'select count(pk_sti) from ST_ICMS' :  'select first '+req.query.first+' skip '+req.query.skip+' PK_STI, '+campoVarChar('ORIGEM',2)+', FK_PRO, FK_ESTDESTINO, '+campoVarChar('SIMPLES_NACIONAL', 1)+', PERCENTUAL_ST, FK_ESTORIGEM from ST_ICMS';
        


        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
            if (err)
                throw err;

            db.detach();
            res.json(result)
        });

    });
})



app.get('/api/startSync',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            sync = {
                qty: {
                    create: 0,
                    update: 0,
                    delete: 0
                },
                create: [],
                update: [],
                delete: []
            }
            if (!fs.existsSync('sync_log')){
                fs.mkdirSync('sync_log');
            }
            arquivo = JSON.stringify(sync)
            fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            res.json('sync_'+req.query.user+'_'+name)
            console.log('Sync stared: '+'sync_'+req.query.user+'_'+name)
        } else {
            res.status(404).end();
        }
    } 
    catch (err) {
        res.status(404).end();
    }
})


app.get('/api/identifySync',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
                if (err) throw err;
                sync = JSON.parse(data)
                sync.qty.create = req.query.create
                sync.qty.update = req.query.update
                sync.qty.delete = req.query.delete
                sync.create = []
                sync.update = []
                sync.delete = []
                arquivo = JSON.stringify(sync)
                res.json(sync.qty)
                fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            })
        } else {
            res.status(404).end();
        }
    } 
    catch (err) {
        res.status(404).end();
    }
})

app.get('/api/sendSQL',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
                if (err) throw err;
                sync = JSON.parse(data)
                sync[req.query.type].push(req.query.sql)
                console.log(req.query.sql)
                arquivo = JSON.stringify(sync)
                res.json(sync)
                fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            })
        } else {
            res.status(404).end();
        }
    } 
    catch (err) {
        res.status(404).end();
    }
})


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function commitTransaction(transaction, db){
    return new Promise (async (resolve) => {
        console.log('commit')
        transaction.commit(function(err) {
                if (err){
                    transaction.rollback();
                    db.detach();
                    resolve('Rollback executed')
                }
                else{
                    db.detach();
                    resolve('Commited!')
                }
                    
        });
        
    })

}



function sendTransaction(sync, transaction){
    return new Promise (async (resolve) => {
        let count = 0
        if (sync.length === 0){
            resolve('Done')
        }
        for(let i of sync){
            count = count+1
            await transaction.query(i, [],function(err, result) {
                console.log(i)
                if (err) {
                    console.log(err)
                    console.log('b')
                    transaction.rollback();
                    resolve('Rollback executed')
                } else {
                    
                    console.log('a')
                }
                if (count === sync.length){
                    resolve('Done')
                }

            })
        }
        
    })
}


app.get('/api/startTransaction',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
                if (err) throw err;
                sync = JSON.parse(data)

                if (Number(sync.qty.create) !== Number(sync.create.length)) throw "Create";
                if (Number(sync.qty.update) !== Number(sync.update.length)) throw "Update";
                if (Number(sync.qty.delete) !== Number(sync.delete.length)) throw "Delete";

                Firebird.attach(optionsfb, function(err, db) {
                    if (err)
                        throw err;                        
                    
                    
                    db.transaction(Firebird.ISOLATION_READ_UNCOMMITTED, async function(err, transaction) {
                        console.log(sync.create.length, sync.update.length, sync.delete.length)
                        sendTransaction(sync.create, transaction).then(async (resolve) => {
                            sendTransaction(sync.update, transaction).then(async (resolve)=>{
                                sendTransaction(sync.delete, transaction).then(async (resolve)=>{
                                    commitTransaction(transaction, db).then(async (resolve)=>{
                                        res.json(resolve)

                                        fs.unlinkSync('sync_log/sync_'+req.query.user+'_'+name+'.json',function(err){
                                                if(err) return console.log(err);
                                                console.log('file deleted successfully');
                                        });  
                                    })
                                })
                            })
                        })
                    });

                });
                // fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            })
        } else {
            res.json('Rollback executed')
            // res.status(404).end();
        }
    } 
    catch (err) {
        console.log(err)
        res.json('Rollback executed')
        // res.status(404).end();
    }
})






// app.get('/api/sticms',  function (req, res, next) {
    
//     Firebird.attach(optionsfb, function(err, db) {
//         if (err)
//             throw err;                        

//         let sql = 'select PK_STI, '+campoVarChar('ORIGEM',2)+', FK_PRO, FK_ESTDESTINO, '+campoVarChar('SIMPLES_NACIONAL', 1)+', PERCENTUAL_ST, FK_ESTORIGEM from ST_ICMS where PK_STI=3'

//         db.query(sql, function(err, result) {
//             // IMPORTANT: close the connection
      
//             // console.log(result)
//             db.detach();
//             res.json(result)
//         });

//     });
// })




app.get('/api/itepedidos/:pedido',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select IPE.PK_IPE, IPE.FK_PED, IPE.FK_PRO, trim(cast(PRO.CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGOPRO, trim(cast(NOME_REPRESENTADA as varchar(100) character SET UTF8)) DESCRICAOPRO, IPE.QUANTIDADE, IPE.VALOR, IPE.DESCONTO1, IPE.DESCONTO2, IPE.DESCONTO3, '+
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


app.get('/api/cpg',  function (req, res, next) {
    
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



app.get('/api/gerapk/:nomepk',  function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        if (req.params['nomepk'] === 'NUMWEB') {
            db.query('select max(NUMWEB) valor from pedidos_venda', function(err, result) {
                // IMPORTANT: close the connection
                // console.log(result)
                res.json(result)
                db.detach();
            });            
        }
        else {
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
        }
    });
})


app.get('/api/criaitem/:table/:fields/:values',  function (req, res, next) {
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


app.get('/api/deletaitem/:table/:pkname/:pk',  function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        let limpaitens = 'DELETE FROM itens_ped_venda WHERE FK_PED=0'
        if (req.params['table'] === 'pedidos_venda') {
             limpaitens = 'DELETE FROM itens_ped_venda WHERE FK_PED='+req.params['pk'];
        }
        let sql = 'DELETE FROM '+req.params['table']+' WHERE '+req.params['pkname']+'='+req.params['pk'];
        console.log(sql)
        if (err)
            throw err;
        db.query(limpaitens, function(err, result) {
            db.query(sql, function(err, result) {
                res.json(result)
                db.detach();
            });
        });
            
    });
});

app.get('/api/atualizaitem/:table/:fieldsnvalues/:where',  function (req, res, next) {
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

app.get('/api/testquery',  function (req, res, next) {
    console.log(req.query.test)
    res.json(req.query.test)
})


app.get('/api/create/:command',  function (req, res, next) {
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


app.get('/api/asdd',  function (req, res, next) {
    
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

app.get('/api/asd',  function (req, res, next) {
    
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



app.get('/api/login/:user/:password',  function (req, res, next) {
    
    // let crypto = CryptoJS.MD5(req.params['password'])
    // let senha = crypto.toString()
    // senha = senha.slice(0,20)

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         
        if  (req.params['user'].length == 11) {

            let sql = 'SELECT PK_VEN FROM VENDEDORES where CPF=' +db.escape(req.params['user'])+' and senha='+db.escape(req.params['password']);

            db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log('cpf')
            console.log(result) 
            db.detach();
            res.json(result)
        });}
        else if  (req.params['user'].length == 14) {
            let sql = 'SELECT PK_VEN FROM VENDEDORES where CNPJ=' +db.escape(req.params['user'])+' and senha='+db.escape(req.params['password']);
            
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


// app.get('/api/user', function(req, res){
//     res.status(200).json({ vai: 'funcionou' })
// })


http.listen(port, function(){
    console.log('listening on *:' + port)
})
