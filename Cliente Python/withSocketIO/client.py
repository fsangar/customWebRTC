import socketio
import requests
from aiortc import RTCPeerConnection, RTCSessionDescription

# URLS
SIGNALING_SERVER_URL = 'https://api-rest-teleasistencia-p1.iesvjp.es:9999';

urlWS = 'wss://api-rest-teleasistencia-p1.iesvjp.es:9999'
# Configurar el servidor TURN
turn_server = {
    'urls': 'teleasistencia.iesvjp.es:3478',
    'username': 'test',
    'credential': 'test'
}


# standard Python
http_session = requests.Session()
http_session.verify = False
sio = socketio.Client(http_session=http_session)

@sio.event
def message(data):
    print('I received a message!')

@sio.on('my message')
def on_message(data):
    print('I received a message!')

@sio.event
async def message(data):
    print('I received a message!')

@sio.on('*')
def catch_all(event, data):
    pass

@sio.on('*')
async def catch_all(event, data):
   pass

@sio.event
def connect():
     print("---  Conectado al WebSocket  --- ")
     # Crear un objeto RTCPeerConnection
     pc = RTCPeerConnection()
     pc.addIceServer(turn_server)
     # Crear y configurar el objeto RTCSessionDescription local
     await pc.setLocalDescription(await pc.createOffer())
     offer = {'type': pc.localDescription.type, 'sdp': pc.localDescription.sdp}
     # Enviar la oferta al servidor WebSocket
     await ws.send(offer)
     # Esperar la respuesta del servidor WebSocket
     response = await ws.recv()
     answer = {'type': RTCSessionDescription.ANSWER, 'sdp': response}
     # Configurar el objeto RTCSessionDescription remoto
     await pc.setRemoteDescription(RTCSessionDescription(answer['sdp'], answer['type']))
     # Agregar un evento de escucha para la pista
     pc.on("track", on_track)
     # Esperar a que se cierre la conexión WebRTC
     await pc.wait_closed()

@sio.event
def connect_error(data):
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")


# Escuchar los eventos de la conexión WebRTC
async def on_track(track):
    print(f"Reproduciendo {track.kind} {track.id}")
    pc.addTrack(track)
    await asyncio.gather(send_audio(pc),send_video(pc))

async def send_audio(pc):
     # Obtener la pista de audio local
     audio = await pc.getUserMedia({"audio": True})
     pc.addTrack(audio.getAudioTracks()[0])

async def send_video(pc):
     # Obtener la pista de video local
     video = await pc.getUserMedia({"video": True})
     pc.addTrack(video.getVideoTracks()[0])

async def main():
    sio.connect(SIGNALING_SERVER_URL)

if __name__ == '__main__':
    asyncio.run(main())
