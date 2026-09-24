const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

//x, y - posicionar o objeto
//w, h - definir o tamanho do personagem
//vx - define a velocidade do horizontal

const player = {
    x: 40, y: 160, w: 32, h: 32, vx: 120, vy: 120
};

let lasttime = 0; //marca a posição do último frame

function update(dt) {
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    //se ele bateu na parede esquerda o direita ele vai inerter o sinal do vx
    if (player.x < 0 || player.x + player.w > canvas.width) {
        player.vx *= -1;
    }
    if (player.y < 0 || player.y + player.h > canvas.height) {
        player.vy *= -1;
    }
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fb6f92";
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillText("o deltatime - dt independe da taxa de quadros", 12, 20);
}

function loop(ts) {
    if (!lasttime)
        lasttime = ts;

    const dt = Math.min(0.05, (ts - lasttime));//ms=segundo
    lasttime = ts;
    update(dt);
    draw();

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);