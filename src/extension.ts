import { resolveAllConflicts } from './utils';
import { MergeOption, GameOption } from './types';
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
                <button id="currentBtn">${MergeOption.Current}</button>
                <button id="incomingBtn">${MergeOption.Incoming}</button>
                <button id="combinationBtn">${MergeOption.Combination}</button>
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
                let winnerFromExtension = null;
                let userChoiceFromExtension = null;
                let opponentFromExtension = null;
                // Spinner game options as enum values
                const GameOption = {
                    SurpriseEasy: '${GameOption.SurpriseEasy}',
                    MathFun: '${GameOption.MathFun}',
                    TypingSpeed: '${GameOption.TypingSpeed}',
                    Matching: '${GameOption.Matching}'
                };
                // Option selection
                document.getElementById('currentBtn').onclick = () => {
                    vscode.postMessage({ command: 'resolve', option: '${MergeOption.Current}' });
                };
                document.getElementById('incomingBtn').onclick = () => {
                    vscode.postMessage({ command: 'resolve', option: '${MergeOption.Incoming}' });
                };
                document.getElementById('combinationBtn').onclick = () => {
                    vscode.postMessage({ command: 'resolve', option: '${MergeOption.Combination}' });
                };
                // Listen for message from extension
                window.addEventListener('message', function(event) {
                    var message = event.data;
                    if (message.command === 'showWheel') {
                        document.getElementById('main').classList.remove('active');
                        document.getElementById('wheelScreen').classList.add('active');
                        document.getElementById('chosenOption').textContent = 'You chose: ' + message.option;
                        winnerFromExtension = message.winner;
                        userChoiceFromExtension = message.option;
                        opponentFromExtension = message.opponent;
                        drawWheel();
                    }
                });
                // Spinner uses enum values
                const wheelOptions = [
                    GameOption.SurpriseEasy,
                    GameOption.MathFun,
                    GameOption.TypingSpeed,
                    GameOption.Matching
                ];
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
                        ctx.font = '18px sans-serif';
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
                            // Randomly select a game option
                            const idx = Math.floor(Math.random() * wheelOptions.length);
                            const selectedGame = wheelOptions[idx];
                            document.getElementById('result').textContent = 'Game: ' + selectedGame + ' ... Winner: ' + winnerFromExtension;
                            // Call a function based on the selected game
                            if (selectedGame === GameOption.SurpriseEasy) {
                                // playSurpriseEasyGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
                            } else if (selectedGame === GameOption.MathFun) {
                                // playMathFunGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
                            } else if (selectedGame === GameOption.TypingSpeed) {
                                // playTypingSpeedGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
                            } else if (selectedGame === GameOption.Matching) {
                                // playMatchingGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
                            }
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
                // Store user choice as enum
                const userChoice: MergeOption = message.option as MergeOption;
                const options = [MergeOption.Current, MergeOption.Incoming, MergeOption.Combination];
                const opponent = chooseRandomOpponent(options, userChoice);
                const winner = chooseWeightedWinner(userChoice, opponent);
                // Switch to wheel screen and show the chosen option, and send winner and opponent
                panel.webview.postMessage({ command: 'showWheel', option: userChoice, opponent, winner });
                // After the game, resolve all conflicts with the winner
                // Uncomment the next line to auto-resolve after the game:
                await resolveAllConflicts(doc, winner);
            }
        },
        undefined,
        context.subscriptions
    );
}


// Randomly choose one of the two options not picked by the user
function chooseRandomOpponent(options: MergeOption[], userChoice: MergeOption): MergeOption {
    const opponents = options.filter(opt => opt !== userChoice);
    const randomIndex = Math.floor(Math.random() * opponents.length);
    return opponents[randomIndex];
}

// Choose between user and opponent, with more weight on the opponent
function chooseWeightedWinner(userChoice: MergeOption, opponent: MergeOption): MergeOption {
    const weighted: MergeOption[] = [userChoice, opponent, opponent]; // 2x weight for opponent
    const randomIndex = Math.floor(Math.random() * weighted.length);
    return weighted[randomIndex];
}

export function deactivate() {}
