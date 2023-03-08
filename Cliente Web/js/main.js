
/************************* Variables de configuración ******************/

// Config variables: change them to point to your own servers
/*
const SIGNALING_SERVER_URL = 'https://api-rest-teleasistencia-p1.iesvjp.es:9999';
*/
const SIGNALING_SERVER_URL = 'http://teleasistencia-cpr.iesvjp.es/ws/webRTC/room01/';
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

//Uso de audio y/o vídeo.
let audioVideo = { audio: true, video: true }
let joinRoom = document.querySelector("#joinRoom");
let video = document.querySelector("input[name=video]:checked").value;


/************************* Socket ******************/
let socket;
let sendData = (data) => {
    socket.send(data);
};
/*
let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });


socket.on('data', (data) => {
    console.log('Data received: ',data);
    handleSignalingData(data);
});

socket.on('ready', () => {
    console.log('Ready');
    createPeerConnection();
    sendOffer();
});


let sendData = (data) => {
    socket.emit('data', data);
};
*/

/************************* WebRTC ******************/
let pc;
let localStream;
let localStreamElement = document.querySelector('#localStream');
let remoteStreamElement = document.querySelector('#remoteStream');

/* Obtiene los datos de audio y video, si todo va bien se conecta al websocket */
let getLocalStream = () => {
    navigator.mediaDevices.getUserMedia(audioVideo)
        .then((stream) => {
            console.log('Stream found');
            localStream = stream;
            localStreamElement.srcObject = stream;
            // Connect after making sure that local stream is availble

            /*socket.connect();*/

            socket = new WebSocket("ws://localhost:8000/ws/webRTC/asdf/");
            socket.onopen = (data) => {
                console.log('Data received: ',data);
                handleSignalingData(data);
                createPeerConnection();
                sendOffer();
            }
/*

            socket.onmessage = function(event) {
                alert(`[message] Datos recibidos del servidor: ${event.data}`);
            };
*/

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
            };
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
}

/* Creamos una conexión P2P */
let createPeerConnection = () => {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        pc.onaddstream = onAddStream;
        pc.addStream(localStream);
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
    remoteStreamElement.srcObject = event.stream;
};

let handleSignalingData = (data) => {
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
















