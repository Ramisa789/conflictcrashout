# Merge Conflict Game VS Code Extension

This extension detects merge conflicts in open files and prompts the user to play a game to resolve them. When a merge conflict is detected, a Webview is shown with merge options (Accept Current, Accept Incoming). You can expand the game logic and UI as needed.

## Features
- Detects merge conflicts in open files
- Prompts user to play a game to resolve conflicts
- Webview UI for merge options

## Getting Started
1. Run `npm install` to install dependencies.
2. Run `npm run compile` to build the extension.
3. Press `F5` in VS Code to launch the extension in a new Extension Development Host window.

## File Structure
- `src/extension.ts`: Main extension logic
- `package.json`: Extension manifest
- `tsconfig.json`: TypeScript configuration

## Next Steps
- Implement actual game logic in the Webview
- Parse and apply the chosen merge resolution to the file
- Polish the UI and add more merge options

---
