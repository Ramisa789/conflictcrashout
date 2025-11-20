import { MergeOption } from './types';
import * as vscode from 'vscode';

// Resolves all merge conflicts in a file with the given winner option
export async function resolveAllConflicts(doc: vscode.TextDocument, winner: MergeOption) {
    const edit = new vscode.WorkspaceEdit();
    const text = doc.getText();
    const lines = text.split(/\r?\n/);
    let inConflict = false;
    let conflictStart = 0;
    let currentContent: string[] = [];
    let incomingContent: string[] = [];
    let collecting = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('<<<<<<<')) {
            inConflict = true;
            conflictStart = i;
            currentContent = [];
            incomingContent = [];
            collecting = 'current';
            continue;
        }
        if (inConflict && line.startsWith('=======')) {
            collecting = 'incoming';
            continue;
        }
        if (inConflict && line.startsWith('>>>>>>>')) {
            // End of conflict, apply the winner's content
            let replacement: string[] = [];
            if (winner === MergeOption.Current) {
                replacement = currentContent;
            } else if (winner === MergeOption.Incoming) {
                replacement = incomingContent;
            } else if (winner === MergeOption.Combination) {
                replacement = currentContent.concat(incomingContent);
            }
            const start = new vscode.Position(conflictStart, 0);
            const end = new vscode.Position(i, lines[i].length);
            edit.replace(doc.uri, new vscode.Range(start, end), replacement.join('\n'));
            inConflict = false;
            continue;
        }
        if (inConflict) {
            if (collecting === 'current') {
                currentContent.push(line);
            } else if (collecting === 'incoming') {
                incomingContent.push(line);
            }
        }
    }
    await vscode.workspace.applyEdit(edit);
}