let lastSelectedMember = null;
function mostrarModalMiembro(elOrName, nameOrRole, roleOrDesc, maybeDesc){
// soporta llamada con (element, name, role, desc) o (name, role, desc)
let el = null;
let name, role, desc;
if(typeof elOrName === 'object' && elOrName !== null && elOrName.classList){
el = elOrName;
name = nameOrRole;
role = roleOrDesc;
desc = maybeDesc;
} else {
name = elOrName;
role = nameOrRole;
desc = roleOrDesc;
}

// gestionar selección visual
if(lastSelectedMember && lastSelectedMember !== el){
lastSelectedMember.classList.remove('selected');
}
if(el){
el.classList.add('selected');
lastSelectedMember = el;
}

// mostrar en modal
document.getElementById('modalName').textContent = name;
document.getElementById('modalRole').textContent = role;
document.getElementById('modalDesc').textContent = desc;
const mb = document.getElementById('modalBackdrop');
mb.style.display = 'flex';
// además mostrar la función en la sección Equipo
const funcDiv = document.getElementById('funcionSeleccionada');
if(funcDiv) funcDiv.textContent = 'Función: ' + role;
}
function ocultarModal(){
document.getElementById('modalBackdrop').style.display = 'none';
const funcDiv = document.getElementById('funcionSeleccionada');
if(funcDiv) funcDiv.textContent = '';
if(lastSelectedMember){
lastSelectedMember.classList.remove('selected');
lastSelectedMember = null;
}
}
// Variables globales
let messageChannel = null;
let isChannelReady = false;
let mensajesSent = 0;

// Inicializar BroadcastChannel
function initChannel() {
try {
messageChannel = new BroadcastChannel('auri_lekto_channel');
isChannelReady = true;

document.getElementById('statusIndicator').innerHTML = '🟢 Conectado al Receptor';
document.getElementById('statusIndicator').style.background = '#28a745';

console.log('✅ Canal de mensajes iniciado correctamente');
showStatus('Canal iniciado correctamente', 'success');

// Listener para respuestas
messageChannel.onmessage = (event) => {
console.log('Respuesta recibida:', event.data);
if (event.data.type === 'pong') {
showStatus('Receptor está conectado y respondiendo', 'success');
}
};

} catch (error) {
console.error('Error al crear canal:', error);
showStatus('Error: ' + error.message, 'error');
document.getElementById('statusIndicator').innerHTML = '🔴 Error de conexión';
document.getElementById('statusIndicator').style.background = '#dc3545';
}
}

// Probar conexión
function testConnection() {
if (!isChannelReady) {
showStatus('Iniciando canal...', 'info');
initChannel();
return;
}

try {
messageChannel.postMessage({ type: 'ping', timestamp: new Date().toISOString() });
showStatus('Señal de prueba enviada. Revisa el receptor.', 'info');
console.log('Ping enviado');
} catch (error) {
showStatus('Error al enviar: ' + error.message, 'error');
console.error('Error:', error);
}
}

// Enviar mensaje de prueba
function sendTestMessage() {
enviarAlReceptor('🧪 Mensaje de prueba - ' + new Date().toLocaleTimeString());
}

// Enviar mensaje al receptor
function enviarAlReceptor(contenido) {
if (!isChannelReady) {
showStatus('Iniciando canal primero...', 'warning');
initChannel();
setTimeout(() => enviarAlReceptor(contenido), 500);
return;
}

try {
const ahora = new Date();
const timestamp = ahora.toLocaleTimeString('es-ES', { 
hour: '2-digit', 
minute: '2-digit', 
second: '2-digit' 
});

const mensaje = {
type: 'message',
sender: 'Auri Lekto',
content: contenido,
timestamp: timestamp,
id: Date.now()
};

console.log('Enviando mensaje:', mensaje);
// Si hay una conexión WebSocket activa, enviar por WS (cross-device).
if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
try {
ws.send(JSON.stringify(mensaje));
console.log('Enviado vía WS');
} catch (err) {
console.warn('Fallo al enviar por WS, usando BroadcastChannel', err);
if (messageChannel) messageChannel.postMessage(mensaje);
}
} else {
// Fallback: usar BroadcastChannel para comunicaciones locales
if (messageChannel) messageChannel.postMessage(mensaje);
}

mensajesSent++;
mostrarNotificacion(`✓ Mensaje #${mensajesSent} enviado al receptor`);
showStatus(`Mensaje enviado exitosamente (#${mensajesSent})`, 'success');

} catch (error) {
console.error('Error al enviar:', error);
showStatus('Error al enviar: ' + error.message, 'error');
}
}

// Mostrar estado en el panel de prueba
function showStatus(message, type) {
const statusDiv = document.getElementById('connectionStatus');
const colors = {
success: '#28a745',
error: '#dc3545',
warning: '#ffc107',
info: '#17a2b8'
};
statusDiv.textContent = message;
statusDiv.style.color = colors[type] || '#000';
}

// Notificación flotante
function mostrarNotificacion(texto) {
const notif = document.createElement('div');
notif.className = 'notification';
notif.textContent = texto;
document.body.appendChild(notif);

setTimeout(() => {
notif.style.opacity = '0';
notif.style.transition = 'opacity 0.3s';
setTimeout(() => notif.remove(), 300);
}, 3000);
}

// Autocompletar mensaje
function autocompletarMensaje(texto) {
document.getElementById('mensajePersonalizado').value = texto;
document.getElementById('mensajePersonalizado').focus();
}

// Enviar mensaje personalizado
function enviarMensajePersonalizado(event) {
event.preventDefault();
const input = document.getElementById('mensajePersonalizado');
const texto = input.value.trim();

if (texto) {
mostrarEnPantalla(texto);
enviarAlReceptor(texto);
input.value = '';
}
}

// Mostrar en pantalla local
function mostrarEnPantalla(texto) {
const lista = document.getElementById('listaMensajes');
lista.innerHTML = '';
if (texto) {
const li = document.createElement('li');
li.textContent = texto;
lista.appendChild(li);
}
}

// Actualizar hora
function actualizarHoraLocal() {
const divHora = document.getElementById('hora-local');
if (divHora) {
const ahora = new Date();
const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
divHora.textContent = hora;
}
}
setInterval(actualizarHoraLocal, 1000);
actualizarHoraLocal();

// Iniciar canal al cargar
window.addEventListener('load', () => {
console.log('Página cargada, iniciando canal...');
setTimeout(initChannel, 500);
// auto-conectar WS si hay URL en el input
setTimeout(() => {
const maybe = document.getElementById('wsUrlInput');
if(maybe && maybe.value.trim()){
wsUrl = maybe.value.trim();
connectWS();
}
}, 700);
});

// --- WebSocket support with auto-reconnect/backoff ---
let ws = null;
let wsReady = false;
let wsUrl = '';
let reconnectAttempts = 0;
let reconnectTimer = null;
const maxReconnectDelay = 30000; // 30s

function initWSFromInput(){
const url = document.getElementById('wsUrlInput').value.trim();
if(!url) return alert('Introduce la URL del servidor WebSocket (p. ej. ws://192.168.1.10:8080)');
wsUrl = url;
connectWS();
}

function connectWS(){
if(!wsUrl) return;
// si ya hay una conexión en progreso/abierta, no hacemos nada
if(ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

try{
console.log('Intentando conectar WS a', wsUrl);
showStatus('Intentando conectar WS...', 'info');
ws = new WebSocket(wsUrl);

ws.onopen = () => {
reconnectAttempts = 0;
wsReady = true;
console.log('WS conectado a', wsUrl);
mostrarNotificacion('WS conectado');
showStatus('WS conectado', 'success');
// actualizar indicador global
document.getElementById('statusIndicator').innerHTML = '🟢 Conectado al Receptor (WS)';
document.getElementById('statusIndicator').style.background = '#28a745';
};

ws.onmessage = (ev) => {
try{
const data = JSON.parse(ev.data);
console.log('WS recibido', data);
if(data.type === 'message'){
mostrarEnPantalla(data.content);
}
}catch(err){ console.error('WS parse error', err); }
};

ws.onerror = (e) => { console.error('WS error', e); mostrarNotificacion('Error WS'); };

ws.onclose = (ev) => {
wsReady = false;
console.log('WS cerrado', ev);
mostrarNotificacion('WS desconectado');
showStatus('WS desconectado', 'warning');
document.getElementById('statusIndicator').innerHTML = '🔴 WS desconectado';
document.getElementById('statusIndicator').style.background = '#ffc107';
scheduleReconnect();
};

}catch(err){ console.error('Error iniciando WS', err); mostrarNotificacion('Error al conectar WS'); scheduleReconnect(); }
}

function scheduleReconnect(){
if(reconnectTimer) return; // ya programado
reconnectAttempts++;
// exponencial con jitter
const base = Math.min(maxReconnectDelay, 1000 * Math.pow(2, reconnectAttempts));
const jitter = Math.floor(Math.random() * 1000);
const delay = Math.min(maxReconnectDelay, base + jitter);
console.log(`Reconexión en ${delay}ms (intento ${reconnectAttempts})`);
reconnectTimer = setTimeout(() => {
reconnectTimer = null;
connectWS();
}, delay);
}

function stopReconnect(){ if(reconnectTimer){ clearTimeout(reconnectTimer); reconnectTimer = null; reconnectAttempts = 0; } }

// Auto-conectar si hay una URL en el input al cargar

// Scroll suave
document.addEventListener('DOMContentLoaded', function() {
document.querySelectorAll('nav a[href^="#"]').forEach(function(enlace) {
enlace.addEventListener('click', function(e) {
const destino = document.querySelector(this.getAttribute('href'));
if (destino) {
e.preventDefault();
destino.scrollIntoView({ behavior: 'smooth' });
}
});
});
});

// Centralizar listeners para Main.html (evitar handlers inline)
function registerMainListeners(){
	const testBtn = document.getElementById('testConnectionBtn');
	const sendBtn = document.getElementById('sendTestBtn');
	const connectWSBtn = document.getElementById('connectWSFromInputBtn');
	const autofillBtns = document.querySelectorAll('.autofill-btn');
	const form = document.getElementById('customMessageForm');
	const modalClose = document.querySelector('#modalBackdrop .close');

	if(testBtn) testBtn.addEventListener('click', testConnection);
	if(sendBtn) sendBtn.addEventListener('click', sendTestMessage);
	if(connectWSBtn) connectWSBtn.addEventListener('click', initWSFromInput);
  
		// Control Center: registro simple
		const controlLog = document.getElementById('controlLog');
		const preset = document.getElementById('presetSelect');
		function pushLog(msg){
			if(!controlLog) return;
			const li = document.createElement('li');
			li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
			controlLog.prepend(li);
		}
		if(testBtn) testBtn.addEventListener('click', () => pushLog('Ping enviado (BroadcastChannel)'));
		if(sendBtn) sendBtn.addEventListener('click', () => pushLog('Mensaje enviado desde Control Center'));
		if(preset){ preset.addEventListener('change', (e) => { const v = e.target.value; if(v && v !== 'default'){ document.getElementById('mensajePersonalizado').value = v; pushLog('Preset seleccionado: ' + v); } }); }

		// Navbar filter
		document.querySelectorAll('.main-nav .nav-item[data-filter]').forEach(nav => {
			nav.addEventListener('click', (e) => {
				e.preventDefault();
				const filter = nav.getAttribute('data-filter');
				document.querySelectorAll('.main-nav .nav-item').forEach(n => n.classList.remove('active'));
				nav.classList.add('active');
				applyFilter(filter);
				// scroll to target section if exists
				const target = document.querySelector(nav.getAttribute('href'));
				if(target) target.scrollIntoView({behavior: 'smooth'});
			});
		});

	autofillBtns.forEach(b => {
		b.addEventListener('click', (e) => {
			const text = e.currentTarget.getAttribute('data-autofill');
			if(text) autocompletarMensaje(text);
		});
	});

	if(form) form.addEventListener('submit', enviarMensajePersonalizado);

	if(modalClose) modalClose.addEventListener('click', ocultarModal);
		// miembros del equipo: usar data-attributes para abrir modal
		document.querySelectorAll('.member').forEach(member => {
			member.addEventListener('click', (e) => {
				const name = member.getAttribute('data-name') || member.querySelector('h3')?.textContent;
				const role = member.getAttribute('data-role') || member.querySelector('p')?.textContent;
				const desc = member.getAttribute('data-desc') || '';
				mostrarModalMiembro(member, name, role, desc);
			});
		});

		// backdrop: cerrar al hacer click fuera del modal
		const backdrop = document.getElementById('modalBackdrop');
		if(backdrop){
			backdrop.addEventListener('click', (e) => {
				if(e.target === backdrop) ocultarModal();
			});
		}
}

// Aplica filtro simple mostrando/ocultando secciones
function applyFilter(filter){
	const allSections = document.querySelectorAll('main .section');
	if(filter === 'all' || !filter){
		allSections.forEach(s => s.style.display = 'block');
		return;
	}
	allSections.forEach(s => {
		if(s.id === filter) s.style.display = 'block'; else s.style.display = 'none';
	});
}

// Registrar al cargar la página
window.addEventListener('load', () => {
	// Solo registrar si estamos en la página que contiene esos elementos
	if(document.getElementById('testConnectionBtn') || document.getElementById('customMessageForm')){
		registerMainListeners();
	}
});

document.addEventListener('DOMContentLoaded', function() {
  const images = [
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.15 AM (1).jpeg",
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.15 AM (2).jpeg",
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.15 AM (3).jpeg",
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.15 AM (4).jpeg",
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.15 AM.jpeg",
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.16 AM (1).jpeg",
    "../imagenes/WhatsApp Image 2025-10-15 at 8.03.16 AM.jpeg"
  ];

  let currentIndex = 0;
  const carousel = document.querySelector('#equipo .background-carousel');

  if (carousel) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      carousel.style.backgroundImage = `url('${images[currentIndex]}')`;
    }, 5000);

    // Set initial image
    carousel.style.backgroundImage = `url('${images[0]}')`;
  }
});
