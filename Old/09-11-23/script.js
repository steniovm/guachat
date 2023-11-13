//elementos html
const chat = document.getElementById("chat");
const submitbt = document.getElementById("submitbt");
const username = document.getElementById("username");
const message = document.getElementById("message");
const messages = document.getElementById("messages");
const modal = document.getElementById("modal");
const modalform = document.getElementById("modalform");
const inusername = document.getElementById("inusername");
const typeguaxa = document.getElementById("typeguaxa");
const typeplayer = document.getElementById("typeplayer");
const caracterinfos = document.getElementById("caracterinfos");
const guaxaname = document.getElementById("guaxaname");
const caractername = document.getElementById("caractername");
const attrlabel = document.getElementById("attrlabel");
const caracteratrib = document.getElementById("caracteratrib");
const submituser = document.getElementById("submituser");
const showusername = document.getElementsByClassName("showusername");
const caracterinfo = document.getElementsByClassName("caracterinfo");
const atrr = document.getElementsByClassName("atrr");
const caract = document.getElementsByClassName("caract");
const dicebt = document.getElementsByClassName("dicebt");
const mediabt = document.getElementsByClassName("mediabt");
const mainusers = document.getElementById("mainusers");
const showuserdiv = document.getElementsByClassName("showuserdiv");
const instruct = document.getElementById("instruct");
const framehelp = document.getElementById("framehelp");
//encontra porta de comunicação
const PORT =
  location.protocol === "https:" ? 443 : location.port ? location.port : 3000;
//configura audio e video
const mediaopt = { video: true, audio: true };
//variaveis globais
let userdata = {};//dados do usuario
let users = {};//lista de usuarios
let peersids = {}//lista de conexões p2p
let usernumber = 0;//numero do usuario
let peer = new Peer();
/*let peer = new Peer(undefined, {
  host: "/",
  port: PORT,
  path: "/peerjs",
  debug: 3,
});*/ //id de comunicação p2p
peer.on('open', function (id) {
  userdata.peerid = id;
  console.log('My peer ID is:', id);
});
let localstream;//streamer de video
let streamer;//stramer de videos
let author = "";//autor das menssagens
let mess = "";//mensagens
let socket;
try {
  socket = io();//conexão de socket
} catch (error) {
  console.log(error);
}

//atribui um valor aleatório para sugerir para o atributo do personagem
caracteratrib.value = Math.ceil(Math.random() * 4) + 1;
attrlabel.innerHTML = caracteratrib.value;

//mostra/esconde tutorial de uso
instruct.addEventListener("click", function () {
  framehelp.classList.toggle("displaynone");
});

//atualiza label que mostra o valor do atributo
caracteratrib.addEventListener("change", () => {
  attrlabel.innerHTML = caracteratrib.value;
});

//mostra/esconde o campos do personagem de acordo com o tipo de usuario (jogador/guaxa)
typeguaxa.addEventListener("click", () => {
  caracterinfos.classList.add("hiddemdiv");
  guaxaname.required = false;
  caractername.required = false;
  caracteratrib.required = false;
});
typeplayer.addEventListener("click", () => {
  caracterinfos.classList.remove("hiddemdiv");
  guaxaname.required = true;
  caractername.required = true;
  caracteratrib.required = true;
});

//evento de liga/desliga audio
mediabt[0].addEventListener("click", () => {
  try {
    const enabled = streams[userdata.peerid].getAudioTracks()[0].enabled; //propriedade de audio ligado/desligado
    if (enabled) {
      //se audio ligado
      streams[userdata.peerid].getAudioTracks()[0].enabled = false; //desliga audio
      mediabt[0].classList.add("borderoff"); //altera botão
    } else {
      //se audio desligado
      streams[userdata.peerid].getAudioTracks()[0].enabled = true; //liga audio
      mediabt[0].classList.remove("borderoff"); //altera botão
    }
  } catch (error) {
    console.log(error);
  }
});
//evento de liga/desliga video
mediabt[1].addEventListener("click", () => {
  try {
    const enabled = streams[userdata.peerid].getVideoTracks()[0].enabled; //propriedade de audio ligado/desligado
    if (enabled) {
      //se audio ligado
      streams[userdata.peerid].getVideoTracks()[0].enabled = false; //desliga audio
      mediabt[1].classList.add("borderoff"); //altera botão
    } else {
      //se audio desligado
      streams[userdata.peerid].getVideoTracks()[0].enabled = true; //liga audio
      mediabt[1].classList.remove("borderoff"); //altera botão
    }
  } catch (error) {
    console.log(error);
  }
});

//completa e envia o fomulario para o servidor
modalform.addEventListener("submit", (ev) => {
  ev.preventDefault();//evita carregamento da pagina
  const peerid = userdata.peerid;
  console.log(peerid);
  let data = new FormData(modalform);//dados do formulario
  userdata = Object.fromEntries(data);//pega dados dos campos imput
  modal.classList.add("hiddemdiv");//apaga o modal do form da pagina
  username.value = data.get("username");//preenche o campo input type=hidden
  if (data.get("typeuser") === "Guaxa") {//se for selecionada a opção "guaxa" os campos de personagens serão preenchidos automaticamente
    usernumber = 0;
    userdata.guaxaname = userdata.username;
  } else if (data.get("typeuser") === "Jogador") {//se for tipo jogador apenas usernumber é associado
    usernumber = 1;
  }
  //renderiza mensagem de saudação
  renderMessage({ author: "", message: "Bem Vindo ao Guaxinins e Gambiarras" });
  userdata.peerid = peerid;
  //envia dados de usuário
  try {
    //await videoinit(userdata);
    socket.emit("sendUser", userdata);
  } catch (error) {
    console.log(error);
  }
  //console.log(userdata);
});

//botões de rolagem de dados
for (let i = 0; i < dicebt.length; i++) {
  let rolldices = {};
  rolldices.nroll = (i % 3) + 1;
  if (i < 3) {
    rolldices.typetest = "o";
  } else if (i < 6) {
    rolldices.typetest = "f";
  } else {
    rolldices.typetest = "i";
  }
  dicebt[i].addEventListener("click", () => {
    rolldices.user = userdata.username;
    rolldices.room = userdata.guaxaname || userdata.username;
    rolldices.attr = userdata.caracteratrib;
    socket.emit("rollDice", rolldices);//envia solicitação
    console.log(rolldices);
  });
}
//renderiza mensagem no campo de chat
function renderMessage(messag) {
  messages.innerHTML += `<div class="message"><strong>${messag.author}: </strong>${messag.message}</div>`;
  messages.scrollTo({
    top: Array.from(messages.childNodes).reduce(
      (acc, v) => acc + v.clientHeight,
      0
    ),
    behavior: "smooth",
  });
}
//recebe mensagens previas (desativado)
/*
socket.on("previousMessages", (arr) => {
  arr.forEach((el) => {
    renderMessage(el);
  });
});
*/
//recebe mensagens para o chat
try {
  socket.on("receivedMessage", (messag) => {
    renderMessage(messag);
  });
} catch (error) {
  console.log(error);
}
//recebe dados de novo usuário
try {
  socket.on("adduser", async (datauser) => {
    if (streams[userdata.peerid] === undefined) {
      await videoinit(userdata);
    };
    //varre usuarios na tela
    for (let i = 0; i < showuserdiv.length; i++) {
      //se o novo usuario for encontrado na tela ele é removido da tela
      if (
        datauser.username ===
        showuserdiv[i].querySelector(".showusername").textContent
      ) {
        showuserdiv[i].remove();
      }
    }
    //se o novo usuario for um Guaxa cria uma div destaque
    if (datauser.typeuser === "Guaxa") {
      if (datauser.status) {
        //completa dados de usuario com valores padrão
        datauser.playnamber = 0;
        datauser.caracteratrib = 0;
        datauser.caractername = "Guaxa";
        datauser.guaxaname = datauser.username;
        //renderiza dados
        showdatauser(datauser);//inclui usuario na tela
        //lista o usuario
        users[datauser.sid] = datauser.playnamber;
        //atualiza dados globais do usuario
        if (datauser.username === userdata.username) {
          if (datauser.sid) userdata.sid = datauser.sid;
          if (datauser.status.playnamber !== undefined) usernumber = datauser.status.playnamber;
        }
        //renderiza mensagem de saudação para o caso de usuário ser o guaxa
        if (datauser.playnamber === usernumber)
        //await videoinit(datauser);//inicia video do usuário
        console.log(streams);
        console.log(Object.entries(streams));
        console.log(userdata.peerid);
        console.log(streams[userdata.peerid]);
        addVideoStream(videos[usernumber], streams[userdata.peerid]);//adciona video local na tela
          renderMessage({
            author: "",
            message: `Você está conectado como ${datauser.username}, convide três amigos`,
          });
      } else {
        //caso já exista um guaxa com o nome
        //renderiza mensagem de falha
        renderMessage({
          author: "",
          message: "Já existe um guaxa online com este nome, tente outro.",
        });
        //reexibe formulário
        modal.classList.remove("hiddemdiv");
      }
    } else {
      //caso o usuario seja jogador
      //em caso de falha, exibe mensagem e reecibe formulário
      if (!datauser.status.guaxa) {
        renderMessage({
          author: "",
          message:
            "Não existe um guaxa com este nome online, confirme com seu guaxa o nome de usuário dele.",
        });
        modal.classList.remove("hiddemdiv");
      } else if (!datauser.status.vaga) {
        renderMessage({
          author: "",
          message:
            "As vagas para jogar com este guaxa já estão preenchidas, aguarde um jogador sair ou tente com outro guaxa.",
        });
        modal.classList.remove("hiddemdiv");
      } else if (!datauser.status.user) {
        renderMessage({
          author: "",
          message:
            "Já existe um jogador com este nome jogando com este guaxa tente outro nome de usúario.",
        });
        modal.classList.remove("hiddemdiv");
      } else {
        //caso usuário seja valido
        if (
          datauser.username === userdata.username &&
          datauser.status.playnamber
        ) {
          //atualiza variaveis globais do usuario
          userdata.sid = datauser.sid;
          usernumber = datauser.status.playnamber;
        }
        datauser.playnamber = datauser.status.playnamber;
        //exibe saudação
        renderMessage({
          author: "",
          message: `Bem vindo ao jogo ${datauser.username}`,
        });
        showdatauser(datauser);//exibe tela do usuário
        users[datauser.sid] = datauser.playnamber;//atualiza id do usuario
        if (datauser.username === userdata.username) {
          //await videoinit(datauser);//inicia video do usuário
          console.log(streams);
          console.log(userdata.peerid);
          addVideoStream(videos[usernumber], streams[userdata.peerid]);//adciona video local na tela
        }
      }
    }
  });
} catch (error) {
  console.log(error);
}

//escuta remoção de usuários
try {
  socket.on("removeuser", (numberuser) => {
    showuserdiv[numberuser].remove();
  });
} catch (error) {
  console.log(error);
}
//escuta resultado de rolagem de dados
try {
  socket.on("roolresult", (result) => {
    let str = [];
    for (let i = 0; i < result.nums.length; i++) {
      str.push(result.nums[i] + "-" + result.words[i]);
    }
    if (result.acertos || result.acertos == 0)
      str.push("Acertos: " + result.acertos);
    renderMessage({ author: result.user, message: `Rolagem: ${str.join(", ")}` });
  });
} catch (error) {
  console.log(error);
}

try {
  socket.on("addvideos", async(allpeers) => {
    console.log(allpeers);
    console.log(peersids);
    await allpeers.forEach(async(el,ind) => {
      if (peersids[el.peerid] === undefined){
        peersids[el.peerid] = ind;
      }
      if (ind > usernumber){//ligar só para quem tem numero de usuario maior
        peersids[el.peerid]=el.usernumber;
          console.log(el.peerid);
          await calltouser(el.peerid, ind);
          //faz adição de video pela resposta
      }
    });
  });
} catch (error) {
  console.log(error);
}

//renderiza tela de usuário
function showdatauser(datauser) {
  const newuser = `<div class="showuserdiv ${
    datauser.typeuser === "Guaxa" ? "divguaxa" : ""
  }">
            <span class="showusername">${datauser.username || ""}</span>
            <label class="caracterinfo ${
              datauser.typeuser === "Guaxa" ? "hiddemdiv" : ""
            }">
                <strong class="atrr">${datauser.caracteratrib || ""}</strong>
                <span class="caract">${datauser.caractername || ""}</span>
            </label>
            <video></video>
        </div>`;
  mainusers.innerHTML += newuser;
}
//submissão de mensagens do chat
chat.addEventListener("submit", (ev) => {
  ev.preventDefault();
  author = username.value;
  mess = message.value;

  if (author && mess) {
    let messageObject = {
      author: author,
      message: mess,
    };
    //renderMessage(messageObject);
    socket.emit("sendMessage", messageObject);
  }
  message.value = "";
});

//daqui pra baixo diz respeito ao streamer
const videos = document.getElementsByTagName("video");
let streams = {};

function addVideoStream (video, stream) {
  console.log(stream);
  try {
    video.srcObject = stream; //sinal de video associado ao elemento
    video.addEventListener("loadedmetadata", () => {
      //evento de carregar meta dados
      video.play(); //inicia reprodução
    });
  } catch (error) {
    console.log(error);
  }
};

async function videoinit(user) {
  await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      streams[user.peerid] = stream;
      console.log(streams);
      //addVideoStream(videos[users[user.sid]], streams[user.peerid]);//adciona video local na tela
    }).catch(error => {
      console.log(error);
    })
}

//realiza ligação enviando stream
async function calltouser(peerid, unumber){
  peersids[peerid] = unumber;
  const call = await peer.call(peerid,streams[userdata.peerid]);
  console.log(call);
  console.log(call.peer);
  call.on('stream',remoteStream => {
    streams[call.peer] = remoteStream;
    console.log(call.peer);//verificar
    console.log(remoteStream);//verificar
    addVideoStream(videos[unumber], streams[call.peer]);
  });
}
//recebe ligação com stream
peer.on('call', function(call){
  if (call.peer === userdata.peerid) return;//gabiarra
  console.log(call);
  call.answer(streams[userdata.peerid]);
  console.log(call.peer);
  call.on('stream', function(stream){
    console.log(stream)
    console.log(peersids)
    console.log(call.peer)
    console.log(peersids[call.peer])
    streams[call.peer] = stream;
    console.log(call.peer,peersids[call.peer])
      addVideoStream(videos[peersids[call.peer]], streams[call.peer]);
  });
});

