// Referencias a elementos del DOM (Document Object Model)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shootButton = document.getElementById('shootButton');
const powerBar = document.getElementById('powerBar');
const golesMarcadosEl = document.getElementById('golesMarcados');
const consumoTotalEl = document.getElementById('consumoTotal');
const eficienciaEl = document.getElementById('eficiencia');

// Variables del juego
let isShooting = false;
let power = 0;
let goles = 0;
let consumoTotal = 0;

// Variables de la animación de la pelota
let isShotActive = false;
let isGoal = false;
let shotProgress = 0;
const shotDuration = 0.5;
let goalEffectActive = false;

// Variables para el mensaje flotante
let messageText = "";
let messageColor = "";
let messageActive = false;
let messageAlpha = 1.0;
const messageDuration = 1500;
let restartButton = null;

// Referencias a los archivos de sonido
const sonidoDisparo = new Audio('sounds/disparo.mp3');
const sonidoGol = new Audio('sounds/gol.mp3');
const sonidoFallo = new Audio('sounds/fallo.mp3');

// --- Estructura y Lógica de Niveles ---
const niveles = [
    { nombre: "Entrenamiento Básico", tirosTotales: 5, velocidadBarra: 2.5, zonaOptimaWidth: 25, consumoOptimo: 10, consumoAlto: 30 },
    { nombre: "Velocidad y Precisión", tirosTotales: 5, velocidadBarra: 4, zonaOptimaWidth: 20, consumoOptimo: 10, consumoAlto: 30 },
    { nombre: "Gestión de Consumo", tirosTotales: 7, velocidadBarra: 3.5, zonaOptimaWidth: 20, consumoOptimo: 15, consumoAlto: 40 },
    { nombre: "Torneo de Maestros", tirosTotales: 10, velocidadBarra: 4.5, zonaOptimaWidth: 15, consumoOptimo: 10, consumoAlto: 30 },
    { nombre: "La Final Global", tirosTotales: 5, velocidadBarra: 5, zonaOptimaWidth: 10, consumoOptimo: 20, consumoAlto: 50 }
];

let nivelActual = 0;
let tirosRestantes;
let golesNivel;

// Evento para el botón de chutar
shootButton.addEventListener('mousedown', startShot);
function startShot() {
    if (!isShooting && tirosRestantes > 0 && !messageActive) {
        isShooting = true;
        power = 0;
        powerBar.style.width = '0%';
        shootButton.textContent = '¡Chutando!';
        requestAnimationFrame(updatePowerBar);
    }
}

// Evento para soltar el botón
shootButton.addEventListener('mouseup', endShot);
function endShot() {
    if (isShooting) {
        isShooting = false;
        shootButton.textContent = '¡Chutar!';
        sonidoDisparo.play();

        let consumo = 0;
        const nivel = niveles[nivelActual];
        const zonaOptimaStart = 40;
        const zonaOptimaEnd = zonaOptimaStart + nivel.zonaOptimaWidth;

        if (power >= zonaOptimaStart && power <= zonaOptimaEnd) {
            consumo = nivel.consumoOptimo;
            isGoal = true;
        } else {
            consumo = nivel.consumoAlto;
            isGoal = Math.random() < 0.3;
        }

        isShotActive = true;
        shotProgress = 0;

        setTimeout(() => {
            if (isGoal) {
                goles++;
                golesNivel++;
                golesMarcadosEl.textContent = goles;
                goalEffectActive = true;
                setTimeout(() => { goalEffectActive = false; }, 1000);
                showGameMessage("¡GOLAZO!", "#00FF00");
                sonidoGol.play();
            } else {
                showGameMessage("¡FALLASTE!", "#FF0000");
                sonidoFallo.play();
            }

            consumoTotal += consumo;
            const eficiencia = (consumoTotal > 0) ? (goles / (consumoTotal / 100)) : 0;
            consumoTotalEl.textContent = consumoTotal;
            eficienciaEl.textContent = eficiencia.toFixed(2);

            tirosRestantes--;
            checkLevelCompletion();

            isShotActive = false;
            isGoal = false;
            power = 0;
        }, shotDuration * 1000);
    }
}

// Bucle de animación de la barra de potencia
function updatePowerBar() {
    if (isShooting) {
        power += niveles[nivelActual].velocidadBarra;
        if (power > 100) power = 100;
        powerBar.style.width = power + '%';
        requestAnimationFrame(updatePowerBar);
    }
}

// --- Lógica del Canvas ---
function showGameMessage(text, color) {
    messageText = text;
    messageColor = color;
    messageActive = true;
    messageAlpha = 1.0;

    if (restartButton) {
        restartButton.remove();
        restartButton = null;
    }

    setTimeout(() => {
        let fadeInterval = setInterval(() => {
            messageAlpha -= 0.05;
            if (messageAlpha <= 0) {
                clearInterval(fadeInterval);
                messageActive = false;
            }
        }, 50);
    }, messageDuration - 500);
}

function drawPlayer() {
    ctx.fillStyle = '#f66';
    ctx.fillRect(canvas.width / 2 - 20, canvas.height - 100, 40, 40);
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 120, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f66';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 15, canvas.height - 60);
    ctx.lineTo(canvas.width / 2 - 30, canvas.height - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + 15, canvas.height - 60);
    ctx.lineTo(canvas.width / 2 + 30, canvas.height - 30);
    ctx.stroke();
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2e8b57';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.fillRect(canvas.width / 2 - 50, 50, 100, 20);
    ctx.fillRect(canvas.width / 2 - 50, 70, 10, 50);
    ctx.fillRect(canvas.width / 2 + 40, 70, 10, 50);

    if (goalEffectActive) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect(canvas.width / 2 - 55, 45, 110, 80);
    }

    drawPlayer();

    if (isShotActive) {
        const initialPos = { x: canvas.width / 2, y: canvas.height - 50 };
        const finalPos = { x: canvas.width / 2, y: 70 };
        shotProgress += (1 / 60) / shotDuration;
        if (shotProgress > 1) shotProgress = 1;
        const currentPos = {
            x: initialPos.x + (finalPos.x - initialPos.x) * shotProgress,
            y: initialPos.y + (finalPos.y - initialPos.y) * shotProgress
        };
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height - 50, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }

    if (messageActive) {
        ctx.save();
        ctx.globalAlpha = messageAlpha;
        ctx.fillStyle = messageColor;
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.shadowBlur = 5;
        ctx.fillText(messageText, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }

    requestAnimationFrame(drawGame);
}

// --- NUEVA FUNCIÓN: Pregunta educativa al terminar cada nivel ---
const preguntas = [
  { texto: "¿Qué acción ayuda más a reducir el consumo energético?", opciones: ["Apagar luces innecesarias", "Dejar todo encendido"], correcta: 0 },
  { texto: "¿Qué dispositivo gasta más energía si se deja conectado?", opciones: ["Cargador de celular", "Televisor apagado"], correcta: 0 },
  { texto: "¿Cuál es la ventaja del monitoreo en tiempo real de energía?", opciones: ["Detectar consumos altos a tiempo", "Aumentar el consumo"], correcta: 0 },
  { texto: "¿Qué representa una eficiencia alta en tu consumo?", opciones: ["Menor energía usada por tarea", "Más aparatos encendidos"], correcta: 0 },
  { texto: "¿Por qué es importante conocer el consumo total?", opciones: ["Para optimizar el uso y ahorrar", "Solo por curiosidad"], correcta: 0 }
];

// --- Modal de preguntas ---
function mostrarPregunta(nivelIndex) {
  const pregunta = preguntas[nivelIndex % preguntas.length];
  const modal = document.createElement("div");
  modal.id = "preguntaModal";
  modal.innerHTML = `
    <div class="modal-contenido">
      <h3>${pregunta.texto}</h3>
      ${pregunta.opciones.map((op, i) => `<button data-i="${i}">${op}</button>`).join("")}
      <p id="mensaje"></p>
    </div>`;
  document.body.appendChild(modal);

  // --- Estilos del modal (actualizados con mejor contraste) ---
  const estiloModal = document.createElement("style");
  estiloModal.textContent = `
    #preguntaModal {
      display: flex;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      justify-content: center; align-items: center;
      z-index: 1000;
    }
    .modal-contenido {
      background: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      color: #222; /* ✅ texto principal */
    }
    .modal-contenido h3 {
      color: #00a86b; /* ✅ verde energía */
      margin-bottom: 15px;
    }
    .modal-contenido #mensaje {
      color: #333; /* ✅ contraste fuerte */
      font-weight: bold;
      margin-top: 10px;
    }
    .modal-contenido button {
      margin-top: 10px;
      padding: 8px 15px;
      border: none;
      border-radius: 8px;
      background-color: #4caf50;
      color: white;
      cursor: pointer;
      display: block;
      width: 100%;
    }
    .modal-contenido button:hover { background-color: #43a047; }
  `;
  document.head.appendChild(estiloModal);

  modal.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const seleccion = parseInt(btn.getAttribute("data-i"));
      const mensaje = modal.querySelector("#mensaje");
      if (seleccion === pregunta.correcta) {
        mensaje.textContent = "✅ ¡Correcto! Has aprendido algo nuevo.";
        mensaje.style.color = "#00a86b";
        setTimeout(() => {
          modal.remove();
          continuarNivel();
        }, 1000);
      } else {
        mensaje.textContent = "❌ Respuesta incorrecta. Inténtalo en el siguiente nivel.";
        mensaje.style.color = "#d32f2f";
        setTimeout(() => {
          modal.remove();
          continuarNivel();
        }, 1000);
      }
    });
  });
}

// --- Ajuste en checkLevelCompletion para incluir la pregunta ---
function checkLevelCompletion() {
    if (tirosRestantes <= 0) {
        if (golesNivel >= niveles[nivelActual].tirosTotales * 0.5) {
            showGameMessage("¡NIVEL COMPLETO!", "#00FF00");
            setTimeout(() => { mostrarPregunta(nivelActual); }, messageDuration);
        } else {
            showGameMessage("NIVEL FALLIDO", "#FF0000");
            setTimeout(() => { mostrarPregunta(nivelActual); }, messageDuration);
        }
    }
}

function continuarNivel() {
    nivelActual++;
    if (nivelActual < niveles.length) iniciarNivel();
    else mostrarMensajeFinal();
}

function mostrarMensajeFinal() {
    messageText = "¡HAS GANADO EL TORNEO!";
    messageColor = "#00FF00";
    messageActive = true;
    messageAlpha = 1.0;

    restartButton = document.createElement('button');
    restartButton.textContent = "Reiniciar Juego";
    restartButton.className = "restart-button";
    document.querySelector('.controls').appendChild(restartButton);
    restartButton.addEventListener('click', reiniciarJuego);
}

function reiniciarJuego() {
    nivelActual = 0;
    goles = 0;
    consumoTotal = 0;
    if (restartButton) {
        restartButton.remove();
        restartButton = null;
    }
    iniciarNivel();
}

function iniciarNivel() {
    const nivel = niveles[nivelActual];
    tirosRestantes = nivel.tirosTotales;
    golesNivel = 0;

    golesMarcadosEl.textContent = goles;
    consumoTotalEl.textContent = consumoTotal;
    eficienciaEl.textContent = '0.00';
    document.querySelector('h1').textContent = `Nivel ${nivelActual + 1}: ${nivel.nombre}`;
    document.getElementById('optimumZone').style.width = nivel.zonaOptimaWidth + '%';
    document.getElementById('optimumZone').style.left = 40 + '%';
    console.log(`Iniciando Nivel ${nivelActual + 1}: ${nivel.nombre}`);
}

// Iniciar el juego en el primer nivel
iniciarNivel();
requestAnimationFrame(drawGame);
