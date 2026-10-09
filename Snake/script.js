
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const stateEl = document.getElementById("state");

const CELL = 24;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
const TICK_MS = 190;

const STATES = { READY: "PRONTO", PLAYING: "JOGANDO", PAUSED: "PAUSA", OVER: "GAME OVER" };

let state = STATES.READY;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };

let food = { x: 10, y: 10 };

// --- COMIDA DOURADA ---
let goldenFood = null; // Guardará a posição { x, y } quando ativa
let goldenTimer = 0;   // Contador para controlar a duração
const GOLDEN_DURATION = 35; // Quantidade de ticks que a comida dourada permanece (aprox. 6.5s)
const GOLDEN_CHANCE = 0.2;   // 20% de chance de aparecer ao gerar comida normal

let score = 0;
let best = Number(localStorage.getItem("snake-best") || 0);
let acc = 0;
let last = 0;

bestEl.textContent = best;

function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = score;
    goldenFood = null;
    goldenTimer = 0;
    spawnFood();
    state = STATES.READY;
    stateEl.textContent = state;
}

function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
        };
    } while (
        snake.some((s) => s.x === food.x && s.y === food.y) ||
        (goldenFood && goldenFood.x === food.x && goldenFood.y === food.y)
    );

    // Tenta gerar a comida dourada se ela não estiver ativa
    if (!goldenFood && Math.random() < GOLDEN_CHANCE) {
        spawnGoldenFood();
    }
}

function spawnGoldenFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
        };
    } while (
        snake.some((s) => s.x === pos.x && s.y === pos.y) ||
        (food.x === pos.x && food.y === pos.y)
    );

    goldenFood = pos;
    goldenTimer = GOLDEN_DURATION;
}

function setDirection(x, y) {
    if (dir.x + x === 0 && dir.y + y === 0) return; // impede 180°
    nextDir = { x, y };
}

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key) ||
        key === " "
    ) {
        e.preventDefault();
    }
    if (key === "arrowup" || key === "w") setDirection(0, -1);
    if (key === "arrowdown" || key === "s") setDirection(0, 1);
    if (key === "arrowleft" || key === "a") setDirection(-1, 0);
    if (key === "arrowright" || key === "d") setDirection(1, 0);

    if (key === " ") {
        if (state === STATES.PLAYING) {
            state = STATES.PAUSED;
        } else if (state === STATES.PAUSED || state === STATES.READY) {
            state = STATES.PLAYING;
        }
        stateEl.textContent = state;
    }
    if (key === "r") reset();
    if (
        state === STATES.READY &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)
    ) {
        state = STATES.PLAYING;
        stateEl.textContent = state;
    }
});

function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
    const hitBody = snake.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitBody) {
        state = STATES.OVER;
        stateEl.textContent = state;
        if (score > best) {
            best = score;
            localStorage.setItem("snake-best", String(best));
            bestEl.textContent = best;
        }
        return;
    }

    snake.unshift(head);

    // Controle do tempo da comida dourada
    if (goldenFood) {
        goldenTimer--;
        if (goldenTimer <= 0) {
            goldenFood = null; // Desaparece se o tempo acabar
        }
    }

    // Checa colisão com comida normal
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        spawnFood();
    } 
    // Checa colisão com comida dourada
    else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
        score += 20; // Dobro de pontos
        scoreEl.textContent = score;
        goldenFood = null;
    } else {
        snake.pop();
    }
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function draw() {
    ctx.fillStyle = "#022c22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha comida normal
    drawCell(food.x, food.y, "#f12222ff");

    // Desenha comida dourada (pisca nos últimos 10 ticks para avisar que vai sumir)
    if (goldenFood) {
        if (goldenTimer > 10 || Math.floor(goldenTimer / 2) % 2 === 0) {
            drawCell(goldenFood.x, goldenFood.y, "#ffd700");
        }
    }

    // Desenha a cobra
    snake.forEach((s, i) => drawCell(s.x, s.y, i === 0 ? "#e33f5dff" : "#bc4749"));

    if (state !== STATES.PLAYING) {
        ctx.fillStyle = "rgba(15,23,42,0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "center";
        ctx.font = "bold 28px Segoe UI";
        ctx.fillText(state, canvas.width / 2, canvas.height / 2);

        ctx.font = "16px Segoe UI";
        ctx.fillText(
            state === STATES.OVER
                ? "Pressione R para reiniciar"
                : "Pressione ESPAÇO para jogar",
            canvas.width / 2,
            canvas.height / 2 + 32
        );
    }
}

function loop(ts) {
    const dt = ts - last;
    last = ts;
    if (state === STATES.PLAYING) {
        acc += dt;
        while (acc >= TICK_MS) {
            tick();
            acc -= TICK_MS;
        }
    }
    draw();
    requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);