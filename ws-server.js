// Pequeño servidor WebSocket para reenviar mensajes entre clientes.
// Uso: node ws-server.js [PORT]
const WebSocket = require('ws');
const port = process.env.PORT || process.argv[2] || 8080;
const wss = new WebSocket.Server({ port: Number(port) });
console.log(`WebSocket server listening on ws://0.0.0.0:${port}`);

wss.on('connection', function connection(ws, req) {
  const id = Date.now() + Math.floor(Math.random()*1000);
  console.log('Client connected', id, req.socket.remoteAddress);

  ws.on('message', function incoming(message) {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      console.log('Received:', data && data.type ? data.type : typeof data);
      // Reenviar a todos los clientes (incluye al emisor)
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error('Invalid message:', err);
    }
  });

  ws.on('close', () => console.log('Client disconnected', id));
});
