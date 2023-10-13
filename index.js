const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
dotenv.config();
const port = process.env.PORT || 80;

//let messages = [];
let guaxas = [];
app.use(cors());
app.use(express.static(path.join('public')));
app.set('views',path.join('public'));
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'html');
/*
app.use('/',(req,res)=>{
    res.sendFile(join('index.html'));
});
*/
app.use('/',express.static('./public'));
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
io.on('connection', function(socket){
    let room = '';

    console.log('usuario conectado com id:'+socket.id);

    //socket.emit('previousMessages', messages);

    socket.on('sendUser', async (data) =>{
        //messages.push(data);
        data.sid = socket.id;
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
        if (room){
            guaxas.forEach(async (el)=>{
                if (el.username===room){
                    await io.to(room).emit('adduser', el);
                    el.gamers.forEach(async (ele)=>{
                        await io.to(room).emit('adduser', ele);
                    });     
                }
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

    socket.on('join-room', (roomId, userId) => {
        console.log(roomId);
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)
    
        socket.on('disconnect', () => {
          socket.to(roomId).broadcast.emit('user-disconnected', userId)
        });
      });


    socket.on('disconnect', () => {
        let index = -1;
        let room = '';
        let usernumber = 0;
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
        /*if (room){
            guaxas.forEach(async (el)=>{
                if (el.username===room){
                    await io.to(room).emit('radduser', el);
                    el.gamers.forEach(async (ele)=>{
                        await io.to(room).emit('radduser', ele);
                    });
                    for(let i=el.gamers.length; i<3;i++){
                        let datauser = {typeuser: 'Jogador', status:{guaxa:true, vaga:true, user:true, playnamber:i+1}};
                        await io.to(room).emit('radduser', datauser);
                    }
                }
            });
        }*/
        console.log('usuario desconectado id:'+socket.id);
      });

  });

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    server.listen(port, () =>{
        console.log(`para conversar acesse: http://${add}:${port}`);
        //console.log(err);
        //console.log(fam);
    });
    return true;
});

