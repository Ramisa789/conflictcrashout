import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidOpenTextDocument((doc) => {
        if (hasMergeConflict(doc.getText())) {
            vscode.window.showInformationMessage(
                'Merge conflict detected! Play a game to resolve?',
                'Play'
            ).then(selection => {
                if (selection === 'Play') {
                    openGameWebview(context, doc);
                }
            });
        }
    });
}

function hasMergeConflict(text: string): boolean {
    return text.includes('<<<<<<<') && text.includes('=======');
}

function openGameWebview(context: vscode.ExtensionContext, doc: vscode.TextDocument) {
    const panel = vscode.window.createWebviewPanel(
        'mergeGame',
        'Merge Conflict Game',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = `
        <html>
        <head>
            <style>
                #main, #wheelScreen { display: none; }
                #main.active, #wheelScreen.active { display: block; }
                #choice { margin-top: 20px; font-weight: bold; }
                .wheel-container { margin: 40px auto; width: 300px; text-align: center; }
                #wheel { width: 300px; height: 300px; border-radius: 50%; border: 8px solid #333; position: relative; overflow: hidden; }
                #spinBtn { margin-top: 20px; padding: 10px 30px; font-size: 18px; }
                #pointer { position: absolute; left: 50%; top: -30px; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 30px solid #e11d48; z-index: 2; }
            </style>
        </head>
        <body>
            <div id="main" class="active">
                <h2>Conflict Crashout</h2>
                <button id="currentBtn">Current Changes</button>
                <button id="incomingBtn">Incoming Changes</button>
                <button id="combinationBtn">Combination</button>
            </div>
            <div id="wheelScreen">
                <h2 id="chosenOption"></h2>
                <div class="wheel-container">
                    <div id="pointer"></div>
                    <canvas id="wheel" width="300" height="300"></canvas>
                    <button id="spinBtn">Spin the Wheel!</button>
                    <div id="result"></div>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                // Option selection
                document.getElementById('currentBtn').onclick = () => {
                    vscode.postMessage({ command: 'resolve', option: 'Current Changes' });
                };
                document.getElementById('incomingBtn').onclick = () => {
                    vscode.postMessage({ command: 'resolve', option: 'Incoming Changes' });
                };
                document.getElementById('combinationBtn').onclick = () => {
                    vscode.postMessage({ command: 'resolve', option: 'Combination' });
                };
                // Listen for message from extension
                window.addEventListener('message', function(event) {
                    var message = event.data;
                    if (message.command === 'showWheel') {
                        document.getElementById('main').classList.remove('active');
                        document.getElementById('wheelScreen').classList.add('active');
                        document.getElementById('chosenOption').textContent = 'You chose: ' + message.option;
                        drawWheel();
                    }
                });
                // Simple spin-the-wheel logic
                const wheelOptions = ['Win!', 'Try Again', 'Bonus', 'Merge Success', 'Oops!'];
                let spinning = false;
                function drawWheel() {
                    const canvas = document.getElementById('wheel');
                    const ctx = canvas.getContext('2d');
                    const num = wheelOptions.length;
                    const arc = 2 * Math.PI / num;
                    for (let i = 0; i < num; i++) {
                        ctx.beginPath();
                        ctx.moveTo(150, 150);
                        ctx.arc(150, 150, 140, i * arc, (i + 1) * arc);
                        ctx.closePath();
                        ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#fbbf24';
                        ctx.fill();
                        ctx.save();
                        ctx.translate(150, 150);
                        ctx.rotate((i + 0.5) * arc);
                        ctx.textAlign = 'right';
                        ctx.fillStyle = '#fff';
                        ctx.font = '20px sans-serif';
                        ctx.fillText(wheelOptions[i], 120, 10);
                        ctx.restore();
                    }
                }
                document.getElementById('spinBtn').onclick = function() {
                    if (spinning) return;
                    spinning = true;
                    const canvas = document.getElementById('wheel');
                    let angle = 0;
                    let speed = Math.random() * 0.2 + 0.3;
                    let decel = 0.995;
                    let anim = setInterval(function() {
                        angle += speed;
                        speed *= decel;
                        canvas.style.transform = 'rotate(' + angle + 'rad)';
                        if (speed < 0.01) {
                            clearInterval(anim);
                            let idx = Math.floor(((2 * Math.PI - (angle % (2 * Math.PI))) / (2 * Math.PI)) * wheelOptions.length) % wheelOptions.length;
                            document.getElementById('result').textContent = 'Result: ' + wheelOptions[idx];
                            spinning = false;
                        }
                    }, 16);
                };
            </script>
        </body>
        </html>
    `;

    panel.webview.onDidReceiveMessage(
        async message => {
            if (message.command === 'resolve') {
                // Switch to wheel screen and show the chosen option
                panel.webview.postMessage({ command: 'showWheel', option: message.option });
                vscode.window.showInformationMessage(`Spin the wheel for: ${message.option}`);
                // TODO: Actually parse and apply the chosen resolution after the game
            }
        },
        undefined,
        context.subscriptions
    );
}

export function deactivate() {}
