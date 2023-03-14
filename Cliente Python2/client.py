from twisted.internet import ssl, reactor
from twisted.internet.protocol import ReconnectingClientFactory
from autobahn.twisted.websocket import WebSocketClientProtocol, \
    WebSocketClientFactory

protocolSSL = False
URLWS = u"ws://192.168.0.15:8000/ws/webRTC/12345/"

class MyClientProtocol(WebSocketClientProtocol):
    def onConnect(self, response):
        print(f"Connected to server: {response.peer}")

    def onOpen(self):
        print("WebSocket connection open.")
        self.sendMessage("Hello, world!".encode('utf8'))

    def onMessage(self, payload, isBinary):
        print(f"Received message: {payload.decode('utf8')}")

    def onClose(self, wasClean, code, reason):
        print(f"WebSocket connection closed: {reason}")


class MyClientFactory(WebSocketClientFactory, ReconnectingClientFactory):
    protocol = MyClientProtocol

    def __init__(self, url):
        WebSocketClientFactory.__init__(self, url)
        self.setProtocolOptions(autoPingInterval=10, autoPingTimeout=5)

    def clientConnectionFailed(self, connector, reason):
        print(f"Connection failed: {reason}")
        self.retry(connector)

    def clientConnectionLost(self, connector, reason):
        print(f"Connection lost: {reason}")
        self.retry(connector)


if __name__ == '__main__':
    factory = MyClientFactory(URLWS)
    if protocolSSL:
    	contextFactory = ssl.ClientContextFactory()
    	reactor.connectSSL(factory.host, factory.port, factory, contextFactory)
    else:
    	reactor.connectTCP(factory.host, factory.port, factory)

    reactor.run()