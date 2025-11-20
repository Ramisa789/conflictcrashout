const vscode = acquireVsCodeApi();
const wheelOptions = ['Quick Math', 'Typing Race', 'Coding Craze'];
const segmentColors = ['#FFFFFF', '#FCD8CC', '#E2817B']; // 3 colors
let spinning = false;

// Fighter selection
document.querySelectorAll('.fighter-option').forEach(fighter => {
    fighter.addEventListener('click', () => {
        const option = fighter.dataset.option;

        // Send message to extension
        vscode.postMessage({ command: 'resolve', option });

        const selectedFighterEl = document.getElementById('selected-fighter');
        selectedFighterEl.textContent = option;

        document.getElementById('main-page').style.display = 'none';
        document.getElementById('wheel-page').style.display = 'block';

        drawWheel();
    });
});

// Draw the wheel
function drawWheel(rotation = 0) {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const num = wheelOptions.length;
    const arc = 2 * Math.PI / num;
    const center = 150;
    const radius = 140;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < num; i++) {
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, i * arc + rotation, (i + 1) * arc + rotation);
        ctx.closePath();
        ctx.fillStyle = segmentColors[i];
        ctx.fill();

        // Text
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((i + 0.5) * arc + rotation);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1E1E1E';
        ctx.font = '20px "Jersey 10"';
        ctx.fillText(wheelOptions[i], radius - 20, 10);
        ctx.restore();
    }

    // Outer outline
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1E1E1E';
    ctx.stroke();
}

// Ease-out function for smooth spin
function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Spin button
document.getElementById('spinBtn').addEventListener('click', () => {
    if (spinning) return;
    spinning = true;

    const spins = Math.floor(Math.random() * 5) + 5; // full rotations
    const chosenIndex = Math.floor(Math.random() * wheelOptions.length);
    const arc = 2 * Math.PI / wheelOptions.length;
    const endRotation = spins * 2 * Math.PI + chosenIndex * arc + arc / 2;
    const duration = 3000;
    const startTime = performance.now();

    function animate(now) {
        const t = (now - startTime) / duration;
        if (t >= 1) {
            spinning = false;
            drawWheel(endRotation);
            showGamePage(chosenIndex);
            return;
        }
        const eased = easeOut(t) * endRotation;
        drawWheel(eased);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});

// Show game page based on chosen index
function showGamePage(index) {
    const pages = ['page-coding', 'page-typing', 'page-math'];
    pages.forEach((id, i) => {
        document.getElementById(id).style.display = i === index ? 'block' : 'none';
    });

    document.getElementById('wheel-page').style.display = 'none';

    // Update selected fighter
    const selectedFighter = document.getElementById('selected-fighter');
    if (selectedFighter) selectedFighter.textContent = wheelOptions[index];

    // Notify extension
    vscode.postMessage({ command: 'finishResult', result: wheelOptions[index] });
}

// Close extension buttons
document.getElementById('closeBtnWin').addEventListener('click', () => {
    vscode.postMessage({ command: 'closeExtension' });
});

document.getElementById('closeBtnLose').addEventListener('click', () => {
    vscode.postMessage({ command: 'closeExtension' });
});
