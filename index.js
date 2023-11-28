//carrega bibliotecas
const fs = require('fs');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
//cria autenticação https
dotenv.config();
const local = process.env.ISLOCAL || false;
let server;
if (local){
  const privateKey  = fs.readFileSync('../server.key', 'utf8');
  const certificate = fs.readFileSync('../server.crt', 'utf8');
  const credentials = {key: privateKey, cert: certificate};
  server = require('https').createServer(credentials, app);
}else{
  server = require('http').createServer(app);
}
//cria servidor
const io = require('socket.io')(server);
//abre variaveis de ambiente
const port = process.env.PORT || 80;
const messlimit = process.env.MESSLIMIT || 100;

//configura servidor
app.use(cors());
app.use(express.static(path.join('public')));
app.set('views',path.join('public'));
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'html');

//variaveis globais da aplicação
let guaxas = [];
let messages = {};

//end-point da pagina estática
app.get('/', (req, res) => {
  console.log('acesso em:',path.join(__dirname, 'public'),'por get');
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});
//end-point da pagina estática
app.post('/', (req, res) => {
  console.log('acesso em:',path.join(__dirname, 'public'),'por post');
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});
//cria novo usuario tipo guaxa
function newGuaxa(user){
  let result = true;
  guaxas.forEach(el=>{
    if (user.username === el.username){
      result = false;
    }
  });
  if (result){
    user.gamers=[];
    guaxas.push(user);
    messages[user.username] = [];
  }
  return result;
}
//cria novo usuario tipo jogador
function newGamer(user){
  let result = {guaxa:false, user:true, vaga:true, playnumber:0};
  guaxas.forEach(el=>{
    if(user.guaxaname === el.username){
      if (el.gamers.length>=3){
        result.vaga = false;
      }else{
        el.gamers.forEach(ele=>{
          if (user.username === ele.username){
            result.user = false;
          }
        });
      }

      if (result.user && result.vaga){
        el.gamers.push(user);
        result.playnumber = el.gamers.length;
      }
      result.guaxa = true;
    }
  });
  return result;
}
//executa rolagem de dados
function rolldices(atrr, nroll){
	let result = {nums:[], words:[]};
	let res = 0;
  atrr = parseInt(atrr);
	for(let i = 0; i< nroll; i++){
		res = Math.ceil(Math.random()*6);
		result.nums.push(res);
		if (res < atrr){
			result.words.push('F');
		}else if (res > atrr){
			result.words.push('I');
		}else if (res === atrr){
			result.words.push('Critico');
		}
	}
	return result;
}
//executa teste físico
function testef(atrr, nroll){
	let result = rolldices(atrr, nroll);
	result.acertos = 0;
	result.words.forEach(el => {
		if(el == 'F') {
			result.acertos++;
		}else if(el == 'Critico') {
			result.acertos += 2;
		}
	});
	return result;
}
//executa teste intelectual
function testei(atrr, nroll){
	let result = rolldices(atrr, nroll);
	result.acertos = 0;
	result.words.forEach(el => {
		if(el == 'I') {
			result.acertos++;
		}else if(el == 'Critico') {
			result.acertos += 2;
		}
	});
	return result;
}
//escuta conecção websocket
io.on('connection', function(socket){
  let room = '';
  let username = '';

  //console.log('usuario conectado com id:',socket.id);

  socket.on('sendUser', async (data) =>{
    //messages.push(data);
    username = data.username;
    data.sid = socket.id;
    //socket.broadcast.emit('receivedUser', data);
    if (data.typeuser === "Guaxa"){
      data.status = newGuaxa(data);
      if (data.status){
        data.playnumber = 0;
        room = data.username;
        await socket.join(room);
      }
    }else{
      data.status = newGamer(data);
      if (data.status.guaxa && data.status.user && data.status.vaga && data.status.playnumber){
        data.playnumber = data.status.playnumber;
        room = data.guaxaname;
        await socket.join(room);
      }
    }
    if(messages[data.guaxaname]){
      io.to(socket.id).emit('previousMessages',{username:data.username, hist:messages[data.guaxaname]});
    }
    data.room = room;
    //console.log(data);
    console.log(username,'acessou a sala:',room);
    if (room){
      const peersroom = [];
      guaxas.forEach(async (el)=>{
        if (el.username===room){
          await io.to(room).emit('adduser', el);
          peersroom.push({peerid:el.peerid,usernumber: 0});
          el.gamers.forEach(async (ele,index)=>{
            peersroom.push({peerid:ele.peerid,usernumber: index+1});
            await io.to(room).emit('adduser', ele);
          });
        }
        await io.to(room).emit('addvideos', peersroom);
      });
    }
    else{socket.emit('adduser', data);}
  });

  socket.on('sendMessage', data =>{
    if (messages[room] !== undefined){
      messages[room].push(data);
      if (messages[room].length > messlimit){
        messages[room].shift();
      }
    }
    io.to(room).emit('receivedMessage', data);
  });

  socket.on('rollDice', data=>{
    let result;
    if (data.typetest === 'o') result=rolldices(data.attr,data.nroll);
    else if (data.typetest === 'f') result=testef(data.attr,data.nroll);
    else if (data.typetest === 'i') result=testei(data.attr,data.nroll);
    result.user = data.user;
    //console.log(result);
    io.to(data.room).emit('roolresult', result);
  });

  socket.on('sendping', datatime=>{
    io.to(socket.id).emit('receivedpong', datatime);
  })

  socket.on('disconnect', () => {
    if (room) io.to(room).emit('removeuser', username);
    let index = -1;
    guaxas.forEach((el,ind)=>{
      if (el.sid === socket.id){
        index = ind;
      }else{
        let gindex = -1;
        el.gamers.forEach((ele,inde)=>{
          if (ele.sid === socket.id){
            gindex = inde;
          }
        });
        if (gindex>=0){
          el.gamers.splice(gindex,1);
        }
      }
    });
    if (index>=0){
      delete messages[username];
      guaxas.splice(index,1);
    }
    console.log('usuario desconectado id:',socket.id, username);
  });
});

//escuta o servidor https
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  server.listen(port, () =>{
    if (local){
      console.log(`para conversar acesse: https://${add}:${port}`);
      console.log(`ou: https://localhost:${port}`);
    }else{
      console.log(`para conversar acesse: http://${add}:${port}`);
      console.log(`ou: https://${add}:${port}`);
    }
    //console.log(err);
    //console.log(fam);
  });
  return true;
});
