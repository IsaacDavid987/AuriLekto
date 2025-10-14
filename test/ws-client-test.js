const WebSocket = require('ws');

const url = 'ws://127.0.0.1:8080';

function createClient(name) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    ws.on('open', () => { console.log(`${name}: connected`); resolve(ws); });
    ws.on('error', (e) => { console.error(`${name}: error`, e.message); });
  });
}

(async () => {
  console.log('Starting test: connecting two clients to', url);
  const a = await createClient('ClientA');
  const b = await createClient('ClientB');

  b.on('message', (msg) => {
    console.log('ClientB received:', msg.toString());
  });
  a.on('message', (msg) => {
    console.log('ClientA received:', msg.toString());
  });

  // send a message from A
  const payload = { type: 'message', content: 'Hola desde ClientA', id: Date.now() };
  console.log('ClientA sending message...');
  a.send(JSON.stringify(payload));

  // wait a bit to observe
  setTimeout(() => {
    console.log('Closing clients and finishing test');
    a.close(); b.close();
    process.exit(0);
  }, 1200);
})();
