const vscode = acquireVsCodeApi();
const wheelOptions = ['Coding Craze', 'Quick Math', 'Typing Race'];
const segmentColors = ['#FFFFFF', '#FCD8CC', '#E2817B']; // 3 different colors
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

// Listen for messages from extension (optional)
window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'showWheel') {
        console.log('Option chosen:', message.option);
        // Could update diff page dynamically
    }
});

// Draw the wheel
function drawWheel() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const num = wheelOptions.length;
    const arc = 2 * Math.PI / num;
    const center = 150; // center of the canvas
    const radius = 140; // wheel radius

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    for (let i = 0; i < num; i++) {
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, i * arc, (i + 1) * arc);
        ctx.closePath();
        // Use distinct color for each segment
        ctx.fillStyle = segmentColors[i];
        ctx.fill();

        // Draw text on each segment
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((i + 0.5) * arc);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1E1E1E';
        ctx.font = '20px "Jersey 10"';
        ctx.fillText(wheelOptions[i], radius - 20, 10);
        ctx.restore();
    }

    // Draw outer outline around the entire wheel
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;           // thickness of the outline
    ctx.strokeStyle = '#1E1E1E'; // color of the outline
    ctx.stroke();
}


// Spin logic
document.getElementById('spinBtn').addEventListener('click', () => {
    if (spinning) return;
    spinning = true;

    const canvas = document.getElementById('wheel');
    let angle = 0;
    let speed = Math.random() * 0.2 + 0.3;
    let decel = 0.995;

    const anim = setInterval(() => {
        angle += speed;
        speed *= decel;
        canvas.style.transform = 'rotate(' + angle + 'rad)';

        if (speed < 0.01) {
            clearInterval(anim);
            const idx = Math.floor(((2 * Math.PI - (angle % (2 * Math.PI))) / (2 * Math.PI)) * wheelOptions.length) % wheelOptions.length;
            document.getElementById('result').textContent = 'Result: ' + wheelOptions[idx];
            vscode.postMessage({ command: 'finishResult', result: wheelOptions[idx] });
            spinning = false;
        }
    }, 16);
});
