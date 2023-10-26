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
const mainusers = document.getElementById('mainusers');
const showuserdiv = document.getElementsByClassName('showuserdiv');
const PORT = location.protocol==='https:' ? 443: location.port ? location.port: 3000;
const mediaopt = {video: true,audio: true};

let userdata = {};
let users = {};
let usernumber = 0;
let localstream;
let streamer;

caracteratrib.value = Math.ceil(Math.random()*4)+1;
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

//evento de liga/desliga audio
mediabt[0].addEventListener('click',()=>{
  const enabled = myVideoStream[usernumber].getAudioTracks()[0].enabled;//propriedade de audio ligado/desligado
  if (enabled) {//se audio ligado
    myVideoStream[usernumber].getAudioTracks()[0].enabled = false;//desliga audio
    mediabt[0].classList.remove('borderoff');//altera botão
  } else {//se audio desligado
    myVideoStream[usernumber].getAudioTracks()[0].enabled = true;//liga audio
    mediabt[0].classList.add('borderoff');//altera botão
  }
    //if (mediabt[0].classList.contains('borderoff'))stopmedias();
    //else starmedia();
});
//evento de liga/desliga video
mediabt[1].addEventListener('click',()=>{
  const enabled = myVideoStream[usernumber].getVideoTracks()[0].enabled;//propriedade de audio ligado/desligado
  if (enabled) {//se audio ligado
      myVideoStream[usernumber].getVideoTracks()[0].enabled = false;//desliga audio
      mediabt[1].classList.remove('borderoff');//altera botão
  } else {//se audio desligado
      myVideoStream[usernumber].getVideoTracks()[0].enabled = true;//liga audio
      mediabt[1].classList.add('borderoff');//altera botão
  }
    //if (mediabt[1].classList.contains('borderoff'))stopmedias();
    //else starmedia();
});

modalform.addEventListener('submit',(ev)=>{
    ev.preventDefault();
    let data = new FormData(modalform);
    userdata = Object.fromEntries(data);
    modal.classList.add('hiddemdiv');
    username.value = data.get('username');
    if (data.get('typeuser')==="Guaxa"){
        usernumber = 0;
        userdata.guaxaname = userdata.username;
    }else if (data.get('typeuser')==="Jogador"){
        usernumber = 1;
    }
    renderMessage({author:"", message:"Bem Vindo ao Guaxinins e Gambiarras"});
    socket.emit('sendUser', userdata);
    console.log(userdata);
    //starmedia();
});

for(let i=0; i<dicebt.length; i++){
    let rolldices = {};
    rolldices.nroll = i%3 + 1;
    if (i<3) {rolldices.typetest = 'o'}
    else if (i<6) {rolldices.typetest = 'f'}
    else {rolldices.typetest = 'i'}
    dicebt[i].addEventListener('click',()=>{
        rolldices.user = userdata.username;
        rolldices.room = userdata.guaxaname || userdata.username;
        rolldices.attr = userdata.caracteratrib;
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
    for(let i=0; i<showuserdiv.length; i++){
        if (datauser.username === showuserdiv[i].querySelector('.showusername').innerHTML){
            showuserdiv[i].remove();
        }
    }
    if (datauser.typeuser === "Guaxa"){
        if (datauser.status){
            datauser.playnamber = 0;
            datauser.caracteratrib = 0;
            datauser.caractername = "Guaxa";
            datauser.guaxaname = datauser.username;
            showdatauser(datauser);
            users[datauser.sid]=datauser.playnamber;
            if (datauser.username === userdata.username && datauser.status.playnamber === 0){
                usernumber = datauser.status.playnamber;
            }
            if(datauser.playnamber === usernumber)
                renderMessage({author:'',message:`Você está conectado como ${datauser.username}, convide três amigos`});
            videoinit(showuserdiv.length - 1);
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
            if (datauser.username === userdata.username && datauser.status.playnamber){
                usernumber = datauser.status.playnamber;
            }
            datauser.playnamber = datauser.status.playnamber;
            renderMessage({author:'',message:`Bem vindo ao jogo ${datauser.username}`});
            showdatauser(datauser);
            users[datauser.sid]=datauser.playnamber;
            videoinit(showuserdiv.length - 1);
            //videoinit(datauser.status.playnamber);
            //videoconect(datauser.playnamber);
        }
    }
});

socket.on('removeuser', (numberuser)=>{
    showuserdiv[numberuser].remove();
});
/*
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
*/
socket.on('roolresult',(result)=>{
    let str = [];
    for(let i=0; i<result.nums.length; i++){
        str.push(result.nums[i]+'-'+result.words[i]);
    }
    if(result.acertos || result.acertos==0)str.push("Acertos: "+result.acertos);
    renderMessage({author:result.user,message:`Rolagem: ${str.join(', ')}`})
});

function showdatauser(datauser){
    const newuser = `<div class="showuserdiv ${(datauser.typeuser === "Guaxa")?'divguaxa':''}">
            <span class="showusername">${datauser.username || ""}</span>
            <label class="caracterinfo ${(datauser.typeuser === "Guaxa")?'hiddemdiv':''}">
                <strong class="atrr">${datauser.caracteratrib || ""}</strong>
                <span class="caract">${datauser.caractername || ""}</span>
            </label>
            <video></video>
        </div>`
    mainusers.innerHTML += newuser;
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


const peer = new Peer(undefined, {
  host: '/',
  port: PORT,
  path: '/peerjs',
  debug: 3
});
let myVideoStream = [,,,];
const myVideo = document.getElementsByTagName('video');
let stream;
function videoinit(vidnumber){
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
}).then((strea) => {
    console.log(vidnumber)
    if (vidnumber === usernumber){
        stream = strea;
        myVideoStream[vidnumber] = stream;
        addVideoStream(myVideo[vidnumber], myVideoStream[vidnumber]);//adciona video proprio local na tela
    }else{
        console.log(vidnumber);

/*



enviar ligação p2p



*/

    }
    /*
    peer.on("call", (call) => {//prepara para receber ligação
      console.log('someone call me');
      stream.usernumber = usernumber;
      console.log(stream);
      call.answer(stream);//responde enviando a transmissão
      //const video = document.createElement("video");//criar novo elemento de video
      call.on("stream", (userVideoStream) => {//prepara para receber video
        console.log(userVideoStream);
        addVideoStream(myVideo[userVideoStream.usernumber], userVideoStream);//ao receber video insere no elemento criado
      });
    });

    socket.on("user-connected", (userId) => {//recebe aviso de novo usuario
      console.log('someone call me');
      connectToNewUser(userId, stream);//conecta ao novo usuario
    });
    */
  });
}
//adciona video
const addVideoStream = (video, stream) => {
    video.srcObject = stream;//sinal de video associado ao elemento
    video.addEventListener("loadedmetadata", () => {//evento de carregar meta dados
      video.play();//inicia reprodução
    });
};

peer.on("call", (call) => {//prepara para receber ligação
    console.log('someone call me');
    stream.usernumber = usernumber;
    console.log(stream);
    call.answer(stream);//responde enviando a transmissão
    //const video = document.createElement("video");//criar novo elemento de video
    call.on("stream", (userVideoStream) => {//prepara para receber video
      console.log(userVideoStream);
      addVideoStream(myVideo[userVideoStream.usernumber], userVideoStream);//ao receber video insere no elemento criado
    });
  });

socket.on("user-connected", (userId) => {//recebe aviso de novo usuario
    console.log('someone call me');
    connectToNewUser(userId, stream);//conecta ao novo usuario
  });

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    call.on('stream', userVideoStream => {
      addVideoStream(myVideo[stream.usernumber], userVideoStream)
    });
    call.on('close', () => {
      myVideo[users[userId]].remove();
    });
  
    peers[userId] = call
  }

/*
const myVideo = document.getElementsByTagName('video')
for(let i=0; i<myVideo.length; i++){
    myVideo[i].muted = true
}
const peers = {}

async function starmedia(userlocal=true){
    let streamer
    await navigator.mediaDevices.getUserMedia(mediaopt).then(stream => {
        streamer = stream;
    });
    if(userlocal) {
        localstream = streamer;
        addVideoStream(myVideo[usernumber], localstream);
    }
    return streamer;
}
function stopmedias(){
    localstream.getTracks().forEach(el=>el.stop());
}
async function videoconect(playnamber){
    streamer = await starmedia(false);
    streamer.usernumber = playnamber;
    if (playnamber === usernumber) localstream = streamer;
    addVideoStream(myVideo[playnamber], streamer);

    myPeer.on('call', call => {
        call.answer(streamer);
        call.on('stream', userVideoStream => {
        addVideoStream(myVideo[streamer.usernumber], userVideoStream);
        console.log(userVideoStream);
        });
    });

    socket.on('user-connected', userId => {
        connectToNewUser(userId, streamer)
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
  const call = myPeer.call(userId, stream);
  call.on('stream', userVideoStream => {
    addVideoStream(myVideo[stream.usernumber], userVideoStream)
  });
  call.on('close', () => {
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
*/