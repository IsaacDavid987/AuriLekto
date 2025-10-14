# Prueba de Conexión Auri Lekto

Este pequeño proyecto contiene dos páginas:

- `index.html` - Emisor
- `page2.html` - Receptor

Objetivo: demostrar comunicación entre dos páginas abiertas en el mismo navegador (BroadcastChannel) y entre máquinas distintas usando un servidor WebSocket relay incluido.

Requisitos
- Node.js (para ejecutar el servidor WebSocket)
- Un servidor HTTP simple para servir los archivos (puede usarse Python, npx http-server, etc.)

Prueba rápida (misma máquina / mismo navegador)

1. Abrir PowerShell en la carpeta del proyecto.
2. Servir archivos estáticos; por ejemplo con Python:

```powershell
python -m http.server 8000
```

3. Abrir dos pestañas:

- http://localhost:8000/index.html
- http://localhost:8000/page2.html

4. Usa el panel de prueba en `index.html` para enviar mensajes — deberían aparecer en el receptor.

Comunicación entre dispositivos con WebSocket

1. Instala dependencias (en la carpeta del proyecto):

```powershell
npm install
```

2. Inicia el servidor WebSocket (ejemplo puerto 8080):

```powershell
npm start
# o
node ws-server.js 8080
```

3. Averigua la IP de la máquina donde corre el servidor (por ejemplo `192.168.1.10`) y asegúrate de que el puerto esté accesible en la red.

4. Sirve los archivos estáticos (como en la sección anterior) en las máquinas clientes si es necesario.

5. En ambas páginas (`index.html` y `page2.html`) introduce en el campo de conexión WS la URL del servidor, por ejemplo:

```
ws://192.168.1.10:8080
```

6. Pulsa "Conectar" en ambas páginas (o presiona Enter en el input). Ahora los mensajes enviados desde `index.html` llegarán a `page2.html` a través del servidor WebSocket.

Notas y seguridad
- El servidor `ws-server.js` es un relay simple que reenvía cualquier mensaje JSON que reciba a todos los clientes conectados. No implementa autenticación ni control de acceso.
- No lo expongas a Internet sin medidas de seguridad (TLS, autenticación, CORS/ORIGIN checks).
- Si las páginas están en diferentes redes, necesitarás configurar NAT/port-forwarding o usar un servidor accesible públicamente.

Problemas comunes
- Si no se conecta, revisa firewall/antivirus y asegúrate de que el puerto esté abierto.
- Asegúrate de usar `ws://` para conexiones no cifradas y `wss://` si usas TLS.

Si quieres que implemente cifrado (WSS), autenticación simple, o intercambio seguro con JWT, puedo añadirlo.
# Prueba de Conexión Auri Lekto

Este pequeño proyecto contiene dos páginas:

- `index.html` - Emisor
- `page2.html` - Receptor

Objetivo: demostrar comunicación entre dos páginas abiertas en el mismo navegador mediante BroadcastChannel.

Cómo probar (PowerShell en Windows):

1. Abrir PowerShell en la carpeta del proyecto.
2. Si tienes Python 3 instalado, ejecuta:

```powershell
python -m http.server 8000
```

3. Abrir dos pestañas en tu navegador:
- http://localhost:8000/index.html
- http://localhost:8000/page2.html

4. En el emisor (`index.html`) usa "Probar Conexión" o "Enviar Mensaje de Prueba". Verás los mensajes en el receptor y recibirás respuestas (pong/ack).

Notas:
- BroadcastChannel solo funciona entre contextos (pestañas/iframes) del mismo origen (misma URL/protocolo/puerto).
- Si no tienes Python, puedes usar `npx http-server` si tienes Node.js:

```powershell
npx http-server -p 8000
```

Si quieres que implemente paso de datos por query string, iframe postMessage o una versión con WebSocket para comunicación entre máquinas, dime cuál prefieres.