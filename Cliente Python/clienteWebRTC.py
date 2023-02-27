import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription
import websockets

# URLS
urlWS = 'ws://api-rest-teleasistencia-p1.iesvjp.es:9999'
# Configurar el servidor TURN
turn_server = {
    'urls': 'teleasistencia.iesvjp.es:3478',
    'username': 'test',
    'credential': 'test'
}

# Escuchar los eventos de la conexión WebRTC
async def on_track(track):
    print(f"Reproduciendo {track.kind} {track.id}")
    pc.addTrack(track)
    await asyncio.gather(send_audio(pc),send_video(pc))

async def connect():
     print("---  Conexión  --- ")
     # Conectarse al servidor WebSocket
     async with websockets.connect(urlWS) as websocket:
         print("---  Conectado al WebSocket  --- ")
         # Crear un objeto RTCPeerConnection
         pc = RTCPeerConnection()
         pc.addIceServer(turn_server)
         # Crear y configurar el objeto RTCSessionDescription local
         await pc.setLocalDescription(await pc.createOffer())
         offer = {'type': pc.localDescription.type, 'sdp': pc.localDescription.sdp}
         # Enviar la oferta al servidor WebSocket
         await websocket.send(offer)
         # Esperar la respuesta del servidor WebSocket
         response = await websocket.recv()
         answer = {'type': RTCSessionDescription.ANSWER, 'sdp': response}
         # Configurar el objeto RTCSessionDescription remoto
         await pc.setRemoteDescription(RTCSessionDescription(answer['sdp'], answer['type']))
         # Agregar un evento de escucha para la pista
         pc.on("track", on_track)
         # Esperar a que se cierre la conexión WebRTC
         await pc.wait_closed()

async def send_audio(pc):
     # Obtener la pista de audio local
     audio = await pc.getUserMedia({"audio": True})
     pc.addTrack(audio.getAudioTracks()[0])

async def send_video(pc):
     # Obtener la pista de video local
     video = await pc.getUserMedia({"video": True})
     pc.addTrack(video.getVideoTracks()[0])

async def main():
    await connect()

if __name__ == '__main__':
 asyncio.run(main())