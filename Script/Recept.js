let channel = null;
  let ws = null;
  let wsReady = false;
  let wsUrl = '';
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  const maxReconnectDelay = 30000;
  const billboard = document.getElementById('billboard');
  const connectBtn = document.getElementById('connectBtn');
  const clearBtn = document.getElementById('clear');
  const voiceToggle = document.getElementById('voiceToggle');
  const rateInput = document.getElementById('rate');
  const volumeInput = document.getElementById('volume');
  const voiceSelect = document.getElementById('voiceSelect');

  // Speech synthesis state (activada por defecto)
  let voiceOn = true;
  let synth = window.speechSynthesis;
  let utter = null;
  let voices = [];

    function init() {
      try {
        channel = new BroadcastChannel('auri_lekto_channel');
        // Intentar conectar WebSocket si se proporcionó URL
        const urlEl = document.getElementById('wsUrlInput');
        const url = urlEl && urlEl.value.trim();
        if(url){ wsUrl = url; connectWS(); }
        // estado visual muy simple
        connectBtn.disabled = true;
        console.log('Receptor: canal iniciado');

        channel.onmessage = (ev) => {
          console.log('Receptor recibió:', ev.data);
          const data = ev.data;

          if (data && data.type === 'message') {
            // mostrar como letrero grande
            showBillboard(data.content);
            // leer en voz alta si está activada
            if (voiceOn) speakText(data.content);
            // enviar ack breve
            channel.postMessage({ type: 'ack', id: data.id, receivedAt: new Date().toISOString() });
          } else if (data && data.type === 'ping') {
            showBillboard('PING');
            channel.postMessage({ type: 'pong', timestamp: new Date().toISOString() });
          } else if (data && data.type === 'pong') {
            // mostrar feedback discreto
            showBillboard('PONG');
          } else {
            showBillboard(typeof data === 'string' ? data : JSON.stringify(data));
          }
        };
      } catch (err) {
        console.error('No se pudo crear BroadcastChannel:', err);
        statusEl.textContent = '🔴 Error al conectar canal';
      }
    }

    connectBtn.addEventListener('click', init);
    clearBtn.addEventListener('click', () => showBillboard('Esperando mensaje...'));

    // Mostrar texto grande en el letrero con animación
    function showBillboard(text) {
      // crear inner con span
      const inner = document.createElement('div');
      inner.className = 'inner';
      const span = document.createElement('span');
      span.textContent = text || '';
      inner.appendChild(span);

      // limpiar billboard
      billboard.innerHTML = '';
      billboard.appendChild(inner);

      // Forzar reflow y animación flash
      billboard.classList.remove('flash');
      void billboard.offsetWidth;
      billboard.classList.add('flash');

      // medir overflow: si el ancho del texto es mayor que el contenedor, aplicar marquee
      requestAnimationFrame(() => {
        const containerW = billboard.clientWidth;
        const textW = inner.scrollWidth;
        if (textW > containerW) {
          // duración proporcional (más largo -> más tiempo)
          const pxToMove = textW + containerW;
          const baseSpeed = 350; // px por segundo (aumentado para desplazamiento más rápido)
          const duration = Math.max(6, pxToMove / baseSpeed); // mínimo 6s
          inner.style.animation = `marquee ${duration}s linear infinite`;
          inner.classList.add('marquee');
        } else {
          inner.style.animation = '';
          inner.classList.remove('marquee');
        }
      });
    }

    function speakText(text){
      if (!synth) return;
      // cancelar anterior
      synth.cancel();
      utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      utter.rate = parseFloat(rateInput.value) || 1;
      utter.volume = parseFloat(volumeInput.value) || 1;
      // seleccionar voz si se eligió
      const sel = voiceSelect.value;
      if (sel && sel !== 'default'){
        const v = voices.find(vv => vv.name === sel);
        if (v) utter.voice = v;
      }
      // voice selection opcional: dejamos predeterminada
      synth.speak(utter);
    }

    // --- WebSocket client support with auto-reconnect ---
    function connectWS(){
      if(!wsUrl) return;
      if(ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
      try{
        console.log('Receptor: intentando conectar WS a', wsUrl);
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          reconnectAttempts = 0;
          wsReady = true;
          connectBtn.textContent = 'Conectado WS';
          console.log('Receptor: WS conectado a', wsUrl);
        };
        ws.onmessage = (ev) => {
          try{
            const data = JSON.parse(ev.data);
            console.log('WS recibido', data);
            if(data.type === 'message'){
              showBillboard(data.content);
              if(voiceOn) speakText(data.content);
            }
          }catch(err){ console.error('WS parse error', err); }
        };
        ws.onerror = (e) => { console.error('WS error', e); };
        ws.onclose = () => { wsReady = false; connectBtn.textContent = 'Conectar'; scheduleReconnect(); };
      }catch(err){ console.error('Error iniciando WS', err); scheduleReconnect(); }
    }

    function scheduleReconnect(){
      if(reconnectTimer) return;
      reconnectAttempts++;
      const base = Math.min(maxReconnectDelay, 1000 * Math.pow(2, reconnectAttempts));
      const jitter = Math.floor(Math.random() * 1000);
      const delay = Math.min(maxReconnectDelay, base + jitter);
      console.log(`Receptor: reconexión en ${delay}ms (intento ${reconnectAttempts})`);
      reconnectTimer = setTimeout(() => { reconnectTimer = null; connectWS(); }, delay);
    }

    const wsUrlInput = document.getElementById('wsUrlInput');
    if(wsUrlInput){
      wsUrlInput.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); wsUrl = wsUrlInput.value.trim(); if(wsUrl) connectWS(); } });
    }

    voiceToggle.addEventListener('click', () => {
      voiceOn = !voiceOn;
      voiceToggle.textContent = 'Voz: ' + (voiceOn ? 'On' : 'Off');
      if (!voiceOn) synth.cancel();
    });

    // Pantalla completa
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', () => {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        el.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    // Cargar voces disponibles
    function populateVoices(){
      voices = synth.getVoices() || [];
      voiceSelect.innerHTML = '<option value="default">Predeterminada</option>';
      voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = v.name + ' (' + v.lang + ')';
        voiceSelect.appendChild(opt);
      });
    }
    populateVoices();
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = populateVoices;

    // actualiza parámetros mientras se habla
    rateInput.addEventListener('input', () => { if (utter) utter.rate = parseFloat(rateInput.value); });
    volumeInput.addEventListener('input', () => { if (utter) utter.volume = parseFloat(volumeInput.value); });

    // Auto-conectar al cargar
    window.addEventListener('load', () => setTimeout(init, 300));