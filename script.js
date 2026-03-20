// ---------- CONFIGURACIÓN ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreValue');
const livesSpan = document.getElementById('livesValue');

// Mapeo de colores
const keyColorMap = {
    'c': '#FF4D4D', // rojo
    'v': '#4DFF4D', // verde
    'b': '#4DA6FF', // azul
    'n': '#FFE64D'  // amarillo
};
const keys = ['c', 'v', 'b', 'n'];

// ZONA DE ACIERTO GRANDE
const HIT_ZONE_Y = canvas.height - 100;
const HIT_ZONE_HEIGHT = 100;

// Estado del juego
let score = 0;
let lives = 5;
let gameActive = true;

// Notas activas
let notes = [];

// Generación de notas
let spawnInterval;
const SPAWN_RATE = 600; // ms

// ---------- INICIALIZAR ----------
function initGame() {
    score = 0;
    lives = 5;
    notes = [];
    gameActive = true;
    updateInfo();

    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnNote, SPAWN_RATE);

    setTimeout(() => { if (gameActive) spawnNote(); }, 100);
    setTimeout(() => { if (gameActive) spawnNote(); }, 300);
}

// Crear nueva nota
function spawnNote() {
    if (!gameActive) return;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    notes.push({
        key: randomKey,
        color: keyColorMap[randomKey],
        y: 30,
        speed: 2.2,
        active: true,
    });
}

// Actualizar UI
function updateInfo() {
    scoreSpan.innerText = score;
    livesSpan.innerText = lives;
}

// ---------- DIBUJAR ----------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ZONA DE ACIERTO MUY VISIBLE
    ctx.fillStyle = '#ffffff40'; // Más visible
    ctx.fillRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    ctx.strokeStyle = '#ffffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, HIT_ZONE_Y, canvas.width, HIT_ZONE_HEIGHT);
    
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    ctx.fillText('👆 TOCA AQUÍ 👆', 60, HIT_ZONE_Y + 38);
    ctx.shadowBlur = 0;

    // Dibujar notas
    notes.forEach(note => {
        if (!note.active) return;

        const keyIndex = keys.indexOf(note.key);
        const laneWidth = canvas.width / 4;
        const x = keyIndex * laneWidth + 5;
        const width = laneWidth - 10;

        note.x = x;
        note.width = width;
        note.height = 60;

        const gradient = ctx.createLinearGradient(x, note.y, x + width, note.y + 35);
        gradient.addColorStop(0, note.color);
        gradient.addColorStop(1, '#ffffff80');
        ctx.fillStyle = gradient;
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, note.y, width, 60);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, note.y, width, 60);
    });
}

// ---------- ACTUALIZAR POSICIONES ----------
function update() {
    if (!gameActive) return;

    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (!note.active) continue;

        note.y += note.speed;

        if (note.y > canvas.height + 20) {
            notes.splice(i, 1);
            if (gameActive) {
                lives--;
                updateInfo();
                if (lives <= 0) gameOver();
            }
        }
    }
}

// ---------- DETECCIÓN TÁCTIL INSTANTÁNEA (VERSIÓN MEGA RÁPIDA) ----------
function handleTouchStart(e) {
    // PREVENIR TODO: scroll, zoom, selección, etc.
    e.preventDefault();
    e.stopPropagation();
    
    if (!gameActive) return;

    // Tomar TODOS los toques (por si acaso)
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Procesar CADA toque (por si el usuario usa varios dedos)
    for (let t = 0; t < touches.length; t++) {
        const touch = touches[t];
        
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;

        // Verificar si el toque está dentro del canvas
        if (touchX < 0 || touchX > canvas.width || touchY < 0 || touchY > canvas.height) continue;

        let hit = false;

        // Buscar si tocó alguna nota
        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            if (!note.active) continue;

            // Verificar si el toque está DENTRO del rectángulo de la nota
            if (touchX >= note.x && 
                touchX <= note.x + note.width &&
                touchY >= note.y && 
                touchY <= note.y + note.height) {
                
                // Verificar que la nota esté en la zona de acierto
                const noteBottom = note.y + note.height;
                const noteTop = note.y;

                if (noteBottom >= HIT_ZONE_Y && noteTop <= HIT_ZONE_Y + HIT_ZONE_HEIGHT) {
                    // ¡ACERTÓ INSTANTÁNEAMENTE!
                    score += 10;
                    notes.splice(i, 1);
                    hit = true;

                    // Feedback visual INMEDIATO
                    canvas.style.boxShadow = '0 0 40px lime';
                    canvas.style.transition = 'box-shadow 0.05s';
                    setTimeout(() => {
                        canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black';
                    }, 100);

                    updateInfo();
                    break; // Salir del bucle de notas
                }
            }
        }

        // Si no acertó en ninguna nota (tocó zona vacía)
        if (!hit) {
            score = Math.max(0, score - 5);
            
            // Feedback visual INMEDIATO
            canvas.style.boxShadow = '0 0 40px red';
            canvas.style.transition = 'box-shadow 0.05s';
            setTimeout(() => {
                canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black';
            }, 100);
            
            updateInfo();
        }

        // Verificar game after each touch
        if (lives <= 0) {
            gameOver();
            break;
        }
    }
}

// ---------- GAME OVER ----------
function gameOver() {
    gameActive = false;
    clearInterval(spawnInterval);

    ctx.fillStyle = '#000000aa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 15;
    ctx.fillText('GAME OVER', 30, canvas.height / 2);
    ctx.shadowBlur = 0;
}

// ---------- REINICIAR ----------
function restartGame() {
    if (spawnInterval) clearInterval(spawnInterval);
    initGame();
    
    // Resetear sombra
    canvas.style.boxShadow = 'inset 0 0 20px #00000055, 0 10px 20px black';
}

// ---------- EVENTOS TÁCTILES 100% OPTIMIZADOS ----------
// Eliminar cualquier evento de ratón, SOLO táctil
canvas.removeEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchstart', handleTouchStart, { 
    passive: false,  // Importante: permite prevenir default
    capture: true    // Capturar antes que otros eventos
});

// Bloquear ABSOLUTAMENTE todos los demás eventos táctiles que puedan interferir
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, { passive: false, capture: true });

// Bloquear también eventos de ratón para evitar mezcla
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    return false;
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    return false;
});

// Botón reiniciar optimizado para táctil
const restartBtn = document.getElementById('restartButton');
restartBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    restartGame();
}, { passive: false });

restartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    restartGame();
});

// Prevenir gestos de zoom en toda la página
document.body.addEventListener('touchmove', (e) => {
    if (e.target === canvas || e.target === restartBtn) {
        e.preventDefault();
    }
}, { passive: false });

// ---------- BUCLE PRINCIPAL ----------
function gameLoop() {
    if (gameActive) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Arrancar
initGame();
gameLoop();
