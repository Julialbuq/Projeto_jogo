/**
 * Breakout Bits — colisão bola/raquete/tijolos.
 * Conceitos: vetor velocidade, reflexão, grid de tijolos, níveis.
 */

//Passo 1 — Mundo contínuo
const canvas = document.getElementById("blocos");
const ctx = canvas.getContext("2d");

const paddle = { w: 86, h: 12, x: 197, y: 530, speed: 420 };
const ball = { x: 240, y: 500, r: 7, vx: 180, vy: -240, launched: false };
const keys = {};

let bricks = [];
let score = 0;
let lives = 3;
let running = false;

//Passo 2 — Construir os tijolos
function buildBricks() {
    bricks = [];
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            bricks.push({
                x: 16 + col * 58,
                y: 40 + row * 28,
                w: 52,
                h: 20,
                color: colors[row],
                alive: true,
            });
        }
    }
}

/* Passo 3 — Controle da raquete
Duas formas ao mesmo tempo: teclado (setas / A D)*/
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") {
        e.preventDefault();
        running = true;
        ball.launched = true;
    }
    if (e.key.toLowerCase() === "r") reset();
});
window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

/* ... e mouse sobre o canvas. O mouse costuma ser mais
preciso no Breakout.  */
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.w / 2;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));
});

function resetBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - 14;
    ball.vx = 180 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -540;
    ball.launched = false;
}

function reset() {
    score = 0;
    lives = 3;
    running = false;
    buildBricks();
    resetBall();
}

//Passo 7 — Colisão com tijolo
function collideBrick(b) {
    return (
        ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h
    );
}

function update(dt) {
    if (keys["arrowleft"] || keys["a"]) paddle.x -= paddle.speed * dt;
    if (keys["arrowright"] || keys["d"]) paddle.x += paddle.speed * dt;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));

    /*Passo 4 — Lançar a bola 
    Enquanto launched é false, a bola cola no centro da raquete. Espaço arma o disparo. Isso evita a bola cair antes
    de o jogador estar pronto. */
    if (!ball.launched) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - 14;
        return; // não integra física ainda
    }
    if (!running) return;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.vx *= -1;
    if (ball.y < ball.r) ball.vy *= -1;
    if (ball.y > canvas.height) {
        lives -= 1;
        if (lives <= 0) {
            running = false;
            return;
        }
        resetBall();
    }

    /* Passo 6 — Quicar na raquete com ângulo
    Se a bola bate no centro da raquete, sobe reta. Se bate na ponta, sai inclinada. Pode ser descrito como um
    fator hit entre −1 e 1. */
    if (
        ball.y + ball.r >= paddle.y &&
        ball.y + ball.r <= paddle.y + paddle.h &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.vy > 0 // só quando a bola ESTÁ DESCENDO
    ) {
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hit * 260;
        ball.vy = -Math.abs(ball.vy); // garante que sobe
    }

    ////Passo 7 — Colisão com tijolo
    bricks.forEach((b) => {
        if (b.alive && collideBrick(b)) {
            b.alive = false;
            ball.vy *= -1;
            score += 10;
        }
    });

    if (bricks.every((b) => !b.alive)) {
        buildBricks();
        resetBall();
    }
}

//Passo 8 — Desenhando os elementos a raquete e a bola
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.beginPath();
    ctx.fillStyle = "#f8fafc";
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "16px Arial";
    ctx.fillText("Pontos " + score + "   Vidas " + lives, 16, 24);
    if (!running && lives > 0) {
        ctx.textAlign = "center";
        ctx.fillText("ESPAÇO para lançar", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "left";
    }
    if (lives <= 0) {
        ctx.textAlign = "center";
        ctx.font = "bold 28px Arial";
        ctx.fillText(
            "GAME OVER — R reinicia",
            canvas.width / 2,
            canvas.height / 2,
        );
        ctx.textAlign = "left";
    }
}

let last = 0;
function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}
reset();
requestAnimationFrame(loop);
