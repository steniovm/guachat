const chat = document.getElementById('chat');
const submitbt = document.getElementById('submitbt');
const username = document.getElementById('username');
const message = document.getElementById('message');
const messages = document.getElementById('messages');
const modal = document.getElementById('modal');
const modalform = document.getElementById('modalform');
const inusername = document.getElementById('inusername');
const typeguaxa = document.getElementById('typeguaxa');
const typeplayer = document.getElementById('typeplayer');
const caracterinfos = document.getElementById('caracterinfos');
const guaxaname = document.getElementById('guaxaname');
const caractername = document.getElementById('caractername');
const attrlabel = document.getElementById('attrlabel');
const caracteratrib = document.getElementById('caracteratrib');
const submituser = document.getElementById('submituser');
const showusername = document.getElementsByClassName('showusername');
const caracterinfo = document.getElementsByClassName('caracterinfo');
const atrr = document.getElementsByClassName('atrr');
const caract = document.getElementsByClassName('caract');
const dicebt = document.getElementsByClassName('dicebt');
const mediabt = document.getElementsByClassName('mediabt');
const PORT = 3000;

let datauser = {};
let usernumber = 0;
attrlabel.innerHTML = caracteratrib.value;
caracteratrib.addEventListener('change',()=>{
    attrlabel.innerHTML = caracteratrib.value;
});

typeguaxa.addEventListener('click',()=>{
    caracterinfos.classList.add('hiddemdiv');
    guaxaname.required = false;
    caractername.required = false;
    caracteratrib.required = false;
});
typeplayer.addEventListener('click',()=>{
    caracterinfos.classList.remove('hiddemdiv');
    guaxaname.required = true;
    caractername.required = true;
    caracteratrib.required = true;
});
modalform.addEventListener('submit',(ev)=>{
    ev.preventDefault();
    let data = new FormData(modalform);
    datauser = Object.fromEntries(data);
    modal.classList.add('hiddemdiv');
    username.value = data.get('username');
    if (data.get('typeuser')==="Guaxa"){
        usernumber = 0;
    }else if (data.get('typeuser')==="Jogador"){
        usernumber = 1;
    }
    renderMessage({author:"", message:"Bem Vindo ao Guaxinins e Gambiarras"});
    socket.emit('sendUser', datauser);
});

for(let i=0; i<dicebt.length; i++){
    let rolldices = {};
    rolldices.nroll = i%3 + 1;
    if (i<3) {rolldices.typetest = 'o'}
    else if (i<6) {rolldices.typetest = 'f'}
    else {rolldices.typetest = 'i'}
    dicebt[i].addEventListener('click',()=>{
        rolldices.user = datauser.username;
        rolldices.room = datauser.guaxaname || datauser.username;
        rolldices.attr = datauser.caracteratrib;
        socket.emit('rollDice', rolldices);
        console.log(rolldices);
    });
}

let socket = io();
let author = '';
let mess = '';

function renderMessage(messag){
    messages.innerHTML += `<div class="message"><strong>${messag.author}: </strong>${messag.message}</div>`;
    messages.scrollTo({top: Array.from(messages.childNodes).reduce((acc, v) => acc + v.clientHeight, 0), behavior: "smooth"});
}

socket.on('previousMessages',(arr)=>{
    arr.forEach(el => {
        renderMessage(el);
    });
});

socket.on('receivedMessage', (messag)=>{
    renderMessage(messag);
});
/*
socket.on('receivedUser', (messag)=>{
    console.log(messag);
});
*/
socket.on('adduser', (datauser)=>{
    if (datauser.typeuser === "Guaxa"){
        if (datauser.status){
            datauser.playnamber = 0;
            datauser.caracteratrib = 0;
            datauser.caractername = "Guaxa";
            datauser.guaxaname = datauser.username;
            showdatauser(datauser);
            if(datauser.playnamber === usernumber)
                renderMessage({author:'',message:`Você está conectado como ${datauser.username}, convide três amigos`});
            videoconect(0);
        }else{
            renderMessage({author:'',message:'Já existe um guaxa online com este nome, tente outro.'});
            modal.classList.remove('hiddemdiv');
        }
    }else{
        if (!datauser.status.guaxa){
            renderMessage({author:'',message:'Não existe um guaxa com este nome online, confirme com seu guaxa o nome de usuário dele.'});
            modal.classList.remove('hiddemdiv');
        }else if(!datauser.status.vaga){
            renderMessage({author:'',message:'As vagas para jogar com este guaxa já estão preenchidas, aguarde um jogador sair ou tente com outro guaxa.'});
            modal.classList.remove('hiddemdiv');
        }else if(!datauser.status.user){
            renderMessage({author:'',message:'Já existe um jogador com este nome jogando com este guaxa tente outro nome de usúario.'});
            modal.classList.remove('hiddemdiv');
        }else{
            datauser.playnamber = datauser.status.playnamber;
            renderMessage({author:'',message:`Bem vindo ao jogo ${datauser.username}`});
            videoconect(datauser.playnamber);
            showdatauser(datauser);
        }
    }
});

socket.on('radduser', (datauser)=>{
    if (datauser.typeuser === "Guaxa"){
        if (datauser.status){
            datauser.playnamber = 0;
            datauser.caracteratrib = 0;
            datauser.caractername = "Guaxa";
        }
    }else{
        datauser.playnamber = datauser.status.playnamber;
        showdatauser(datauser);
    }
});

socket.on('roolresult',(result)=>{
    let str = [];
    for(let i=0; i<result.nums.length; i++){
        str.push(result.nums[i]+'-'+result.words[i]);
    }
    if(result.acertos || result.acertos==0)str.push("Acertos: "+result.acertos);
    renderMessage({author:result.user,message:`Rolagem: ${str.join(', ')}`})
});

function showdatauser(datauser){
    showusername[datauser.playnamber].innerHTML = datauser.username || "";
    atrr[datauser.playnamber].innerHTML = datauser.caracteratrib || "";
    caract[datauser.playnamber].innerHTML = datauser.caractername || "";
}

chat.addEventListener('submit',(ev)=>{
    ev.preventDefault();
    author = username.value;
    mess = message.value;

    if (author && mess){
        let messageObject = {
            'author': author,
            'message': mess
        }
        //renderMessage(messageObject);
        socket.emit('sendMessage', messageObject);
    }
    message.value = '';
});

for (let i=0; i<mediabt.length; i++){
    mediabt[i].addEventListener('click',()=>{
        mediabt[i].classList.toggle('borderoff');
    });
}


//daqui pra baixo diz respeito ao streamer


const myPeer = new Peer(undefined, {
  host: '/',
  port: PORT
});
const myVideo = document.getElementsByTagName('video')
for(let i=0; i<myVideo.length; i++){
    myVideo[i].muted = true
}
const peers = {}

function videoconect(playnamber){
    navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
    }).then(stream => {
    stream.usernumber = playnamber;
    addVideoStream(myVideo[playnamber], stream)

    myPeer.on('call', call => {
        call.answer(stream)
        call.on('stream', userVideoStream => {
        addVideoStream(myVideo[stream.usernumber], userVideoStream)
        });
    });

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    });
    });
}
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
});

myPeer.on('open', id => {
  let ROOM_ID = datauser.guaxaname+'V';
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  call.on('stream', userVideoStream => {
    addVideoStream(myVideo[stream.usernumber], userVideoStream)
  });
  call.on('close', () => {
    console.log('teste');
    myVideo[stream.usernumber].remove();
  });

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
}