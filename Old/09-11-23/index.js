//carrega bibliotecas
const fs = require('fs');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
//cria autenticação https
const privateKey  = fs.readFileSync('../server.key', 'utf8');
const certificate = fs.readFileSync('../server.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};
//cria servidor
const server = require('https').createServer(credentials, app);
const io = require('socket.io')(server);
//abre variaveis de ambiente
dotenv.config();
const port = process.env.PORT || 80;

//configura servidor
app.use(cors());
app.use(express.static(path.join('public')));
app.set('views',path.join('public'));
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'html');

//variaveis globais da aplicação
let guaxas = [];

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
  }
  return result;
}
//cria novo usuario tipo jogador
function newGamer(user){
  let result = {guaxa:false, user:true, vaga:true, playnamber:0};
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
        result.playnamber = el.gamers.length;
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
			result.words.push(' F ');
		}else if (res > atrr){
			result.words.push(' I ');
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
		if(el == ' F ') {
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
		if(el == ' I ') {
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

  console.log('usuario conectado com id:',socket.id);

  socket.on('sendUser', async (data) =>{
    //messages.push(data);
    data.sid = socket.id;
    console.log(data);
    //socket.broadcast.emit('receivedUser', data);
    if (data.typeuser === "Guaxa"){
      data.status = newGuaxa(data);
      if (data.status){
        room = data.username;
        await socket.join(room);
      }
    }else{
      data.status = newGamer(data);
      if (data.status.guaxa && data.status.user && data.status.vaga && data.status.playnamber){
        room = data.guaxaname;
        await socket.join(room);
      }
    }
    console.log('acessou a sala:',room);
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
    //messages.push(data);
    io.to(room).emit('receivedMessage', data);
  });

  socket.on('rollDice', data=>{
    let result;
    if (data.typetest === 'o') result=rolldices(data.attr,data.nroll);
    else if (data.typetest === 'f') result=testef(data.attr,data.nroll);
    else if (data.typetest === 'i') result=testei(data.attr,data.nroll);
    result.user = data.user;
    io.to(data.room).emit('roolresult', result);
  });

  socket.on('disconnect', () => {
    let index = -1;
    let room = '';
    guaxas.forEach((el,ind)=>{
      if (el.sid === socket.id){
        index = ind;
        room = el.username;
      }else{
        let gindex = -1;
        el.gamers.forEach((ele,inde)=>{
          if (ele.sid === socket.id){
            gindex = inde;
            room = ele.guaxaname;
          }
        });
        if (gindex>=0){
          el.gamers.splice(gindex,1);
          if (room) io.to(room).emit('removeuser', gindex+1);
        }
      }
    });
    if (index>=0){
      guaxas.splice(index,1);
      if (room) io.to(room).emit('removeuser', 0);
    }

    console.log('usuario desconectado id:',socket.id);
    });

  });

//escuta o servidor https
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  server.listen(port, () =>{
    console.log(`para conversar acesse: https://${add}:${port}`);
    console.log(`ou: https://localhost:${port}`);
    //console.log(err);
    //console.log(fam);
  });
  return true;
});

