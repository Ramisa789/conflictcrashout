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

    // Get the URI for typing_game.html for the webview
    const typingGameHtmlUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'typing_game.html')
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
            <div id="typingGameContainer" style="display:none; width:100%; height:400px;">
                <iframe id="typingGameFrame" src="${typingGameHtmlUri}" style="width:100%; height:100%; border:none;"></iframe>
            </div>
            <div id="typingGameContainer" style="display:none; width:100%; height:400px;">
                <iframe id="typingGameFrame" src="${typingGameHtmlUri}" style="width:100%; height:100%; border:none;"></iframe>
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
                // Option selection: immediately start typing game
                function startTypingGame(option) {
                    // Simulate backend logic for opponent and winner
                    const options = ['${MergeOption.Current}', '${MergeOption.Incoming}', '${MergeOption.Combination}'];
                    const opponents = options.filter(opt => opt !== option);
                    const opponent = opponents[Math.floor(Math.random() * opponents.length)];
                    const weighted = [option, opponent, opponent];
                    const winner = weighted[Math.floor(Math.random() * weighted.length)];
                    // Hide main, show typing game
                    document.getElementById('main').classList.remove('active');
                    document.getElementById('typingGameContainer').style.display = 'block';
                    // Pass values to the iframe
                    const frame = document.getElementById('typingGameFrame');
                    frame.contentWindow.postMessage({
                        command: 'initTypingGame',
                        winner: winner,
                        userChoice: option,
                        opponentChoice: opponent
                    }, '*');
                }
                document.getElementById('currentBtn').onclick = () => startTypingGame('${MergeOption.Current}');
                document.getElementById('incomingBtn').onclick = () => startTypingGame('${MergeOption.Incoming}');
                document.getElementById('combinationBtn').onclick = () => startTypingGame('${MergeOption.Combination}');
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
                            // const selectedGame = wheelOptions[idx];
                            selectedGame = GameOption.TypingSpeed;
                            document.getElementById('result').textContent = 'Game: ' + selectedGame + ' ... Winner: ' + winnerFromExtension;
                            // Call a function based on the selected game
                            if (selectedGame === GameOption.SurpriseEasy) {
                                // playSurpriseEasyGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
                            } else if (selectedGame === GameOption.MathFun) {
                                // playMathFunGame(userChoiceFromExtension, opponentFromExtension, winnerFromExtension);
                            } else if (selectedGame === GameOption.TypingSpeed) {
                                // Send message to start typing game with winner, userChoice, opponentChoice
                                vscode.postMessage({
                                    command: 'initTypingGame',
                                    winner: winnerFromExtension,
                                    userChoice: userChoiceFromExtension,
                                    opponentChoice: opponentFromExtension
                                });
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
