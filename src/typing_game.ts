import { MergeOption } from './types';

const QUOTES = [
    "You don`t lose when the scoreboard says so, you lose when you give up.",
    "You only fail when you stop believing in yourself.",
    "A bad game doesn`t make you a bad player.",
    "Losing doesn`t define you, it only proves you`re still trying.",
    "Defeat is not an end, it`s a new beginning.",
    "One defeat doesn NOT take away the effort and heart you put in."
];

/**
 * Returns a random quote from the list.
 */
export function getRandomQuote(): string {
    const idx = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[idx];
}

/**
 * Calculates words per minute (WPM) given the number of characters typed and elapsed time in milliseconds.
 * @param charsTyped Number of characters typed
 * @param elapsedMs Elapsed time in milliseconds
 * @returns Words per minute
 */
export function calculateWPM(charsTyped: number, elapsedMs: number): number {
    if (elapsedMs === 0) return 0;
    const words = charsTyped / 5; // Standard: 1 word = 5 chars
    const minutes = elapsedMs / 60000;
    return Math.round(words / minutes);
}


export function getOpponentWPM(userWPM: number, winner: MergeOption, userChoice: MergeOption, opponentChoice: MergeOption): number {
    if (winner === userChoice) {
        // Opponent is just 1 WPM slower than user
        return Math.max(1, userWPM - 1);
    } else {
        // Opponent won and is double the user's WPM
        return Math.max(1, userWPM * 2);
    }
}