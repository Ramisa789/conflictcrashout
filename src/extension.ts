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

async function openGameWebview(
    context: vscode.ExtensionContext,
    doc: vscode.TextDocument
) {
    const panel = vscode.window.createWebviewPanel(
        "mergeGame",
        "Conflict Crash-out",
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,

            // Allow the webview to load local files from /media
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, "media")
            ]
        }
    );

    // Load external HTML/CSS/JS
    panel.webview.html = await getHtmlForWebview(context, panel.webview);

    // Handle messages FROM the webview
    panel.webview.onDidReceiveMessage(
        async (message) => {
            switch (message.command) {
                case "resolve":
                    vscode.window.showInformationMessage(
                        `Player selected: ${message.option}`
                    );

                    // Tell the webview to move to the wheel screen
                    panel.webview.postMessage({
                        command: "showWheel",
                        option: message.option
                    });

                    break;

                case "finishResult":
                    vscode.window.showInformationMessage(
                        `Game result: ${message.result}`
                    );
                    break;
                case "closeExtension":
                    panel.dispose(); // This will close the webview panel
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

async function getHtmlForWebview(
    context: vscode.ExtensionContext,
    webview: vscode.Webview
) {
    // Path to /media/index.html
    const htmlPath = vscode.Uri.joinPath(context.extensionUri, "media", "index.html");

    // Read file content asynchronously
    const htmlBytes = await vscode.workspace.fs.readFile(htmlPath);
    let html = Buffer.from(htmlBytes).toString("utf8");

    // URIs for JS + CSS files
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "script.js")
    );

    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "styles.css")
    );

    // Example icons (optional)
    const iconIncoming = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "incoming.svg")
    );

    const iconCurrent = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "current.svg")
    );

    const iconCombination = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "combination.svg")
    );

    const iconBomb = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "bomb.svg")
    );

    const iconYou = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "you.svg")
    );

    const iconOpponent = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "opponent.svg")
    );

    const iconExit = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "exit.svg")
    );

    const iconSkull = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "icons", "skull.svg")
    );

    const jersey10Uri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "fonts", "Jersey10-Regular.ttf")
    );
    
    const jetBrainsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "media", "fonts", "JetBrainsMono-VariableFont_wght.ttf")
    );

    // Replace placeholders inside index.html
    html = html
        .replace("{{styleUri}}", styleUri.toString())
        .replace("{{scriptUri}}", scriptUri.toString())
        .replace("{{iconIncoming}}", iconIncoming.toString())
        .replace("{{iconCurrent}}", iconCurrent.toString())
        .replace("{{iconCombination}}", iconCombination.toString())
        .replace("{{iconBomb}}", iconBomb.toString())
        .replace(/{{iconYou}}/g, iconYou.toString())
        .replace(/{{iconOpponent}}/g, iconOpponent.toString())
        .replace("{{iconExit}}", iconExit.toString())
        .replace("{{iconSkull}}", iconSkull.toString())
        .replace("{{fontJersey10}}", jersey10Uri.toString())
        .replace("{{fontJetBrains}}", jetBrainsUri.toString());

    return html;
}


export function deactivate() {}
