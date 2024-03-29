
/************************* Variables de configuración ******************/

// Config variables: change them to point to your own servers
/*
const SIGNALING_SERVER_URL = 'ws://192.168.0.15:8000/ws/webRTC/12345/';
*/
/*const SIGNALING_SERVER_URL = 'wss://teleasistencia-cpr.iesvjp.es/ws/webRTC/room01/';*/
// ws://192.168.0.15:8000/ws/webRTC/ Se añade más adelante la sala a la que se conecta
const SIGNALING_SERVER_URL = 'ws://192.168.0.15:8000/ws/webRTC/';
//const TURN_SERVER_URL = 'api-rest-teleasistencia-p1.iesvjp.es:3478';
//const TURN_SERVER_USERNAME = 'username';
//const TURN_SERVER_CREDENTIAL = 'credential';
const TURN_SERVER_URL = 'teleasistencia.iesvjp.es:3478';
const TURN_SERVER_USERNAME = 'test';
const TURN_SERVER_CREDENTIAL = 'test';

//const STUN_SERVER_URL = 'stun:stun.l.google.com:19302';
const STUN_SERVER_URL = 'stun:teleasistencia-iesvjp.es:3478';

const PC_CONFIG = {
    iceServers: [
        /*{
          urls: 'turn:' + TURN_SERVER_URL + '?transport=tcp',
          username: TURN_SERVER_USERNAME,
          credential: TURN_SERVER_CREDENTIAL
        },*/
        {
            urls: 'turn:' + TURN_SERVER_URL + '?transport=udp',
            username: TURN_SERVER_USERNAME,
            credential: TURN_SERVER_CREDENTIAL
        },
        {
            urls: STUN_SERVER_URL
        }
    ]
};



/************************* Socket ******************/

let socket;
let sendData = (data) => {
    //  Añadido JSON.stringify para poder usarlo con nuestra API-Rest
    socket.send(JSON.stringify(data));
};

/************************* WebRTC ******************/
let pc;
let localStream;
let localStreamElement = document.querySelector('#localStream');
let remoteStreamElement = document.querySelector('#remoteStream');

/************************* Video *******************/
let videoTransfer = document.querySelector("input[name=video]:checked");
let videoShowLocal = document.querySelector("input[name=showVideoLocal]:checked");
let videoShowRemote = document.querySelector("input[name=showVideoRemote]:checked");
let roomTransfer = document.querySelector("input[name=room]");

    /* Obtiene los datos de audio y video, si todo va bien se conecta al websocket */
let getLocalStream = () => {

    //Uso de audio y/o vídeo.
    let joinRoom = document.querySelector("#joinRoom");
    let videoValue = videoTransfer.value == "true";
    let videoShowLocalValue = videoShowLocal.value == "true";
    let room = roomTransfer.value;
    let audioVideo = { audio: true, video: videoValue }
    console.log(audioVideo);
    navigator.mediaDevices.getUserMedia(audioVideo)
        .then((stream) => {
            console.log('Stream found');
            localStream = stream;
            console.log('Stream ***************************************');
            console.log(videoShowLocalValue);
            if( videoShowLocalValue ){
                localStreamElement.srcObject = stream;
            }
            // Connect after making sure that local stream is availble
            socket = new WebSocket(SIGNALING_SERVER_URL+room+"/");

            socket.onopen = (data) => {
                console.log('Ready');
                createPeerConnection();
                sendOffer();
            }

            socket.onmessage =  (data) => {
                console.log('Data received: ',data);
                handleSignalingData(data);
            }

            socket.onclose = function(event) {
                if (event.wasClean) {
                    alert(`[close] Conexión cerrada limpiamente, código=${event.code} motivo=${event.reason}`);
                } else {
                    // ej. El proceso del servidor se detuvo o la red está caída
                    // event.code es usualmente 1006 en este caso
                    alert('[close] La conexión se cayó');
                }
            };

            socket.onerror = function(error) {
                alert(`[error]`);
                console.log(error);
            };
        })
        .catch(error => {
            console.log(error);
            alert('Stream not found:  Compruebe que tiene disponible la cámara y el audio');
        });
}

/* Creamos una conexión P2P */
let createPeerConnection = () => {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        pc.onaddstream = onAddStream;
        pc.addStream(localStream);
        console.log(pc);
        console.log('PeerConnection created');
    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
};

/** Recibimos respuestas y enviamos información por P2P*/
let sendOffer = () => {
    console.log('Send offer');
    pc.createOffer().then(
        setAndSendLocalDescription,
        (error) => { console.error('Send offer failed: ', error); }
    );
};

let sendAnswer = () => {
    console.log('Send answer');
    pc.createAnswer().then(
        setAndSendLocalDescription,
        (error) => { console.error('Send answer failed: ', error); }
    );
};

let setAndSendLocalDescription = (sessionDescription) => {
    pc.setLocalDescription(sessionDescription);
    console.log('Local description set');
    sendData(sessionDescription);
};

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log('ICE candidate');
        sendData({
            type: 'candidate',
            candidate: event.candidate
        });
    }
};

let onAddStream = (event) => {
    console.log('Add stream');
    if ( videoShowRemote.value == "true"){
        remoteStreamElement.srcObject = event.stream;
    }
};

let handleSignalingData = (data) => {

    //Añadimos esto para el ejemplo de WS creado en django
    /*
        console.log(data);
    */
    data = JSON.parse(data.data);
    /*
        console.log(data);
    */

    // Esto funcionaría usando el ejemplo que nos dan
    switch (data.type) {
        case 'offer':
            createPeerConnection();
            pc.setRemoteDescription(new RTCSessionDescription(data));
            sendAnswer();
            break;
        case 'answer':
            pc.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case 'candidate':
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
    }
}
// Comenzamos la conexión
/*getLocalStream();*/



joinRoom.addEventListener("click", getLocalStream);
















