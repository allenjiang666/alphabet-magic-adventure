export interface LetterInfo {
  char: string;
  word: string;
  color: string;
  imagePrompt: string;
}

export interface NumberInfo {
  value: number;
  word: string;
  color: string;
  imagePrompt: string;
  sentence: string;
}

export enum GameMode {
  EXPLORE = 'EXPLORE',
  QUIZ = 'QUIZ',
  SPEECH_CHALLENGE = 'SPEECH_CHALLENGE',
  MATH = 'MATH'
}

export enum AppSection {
  HOME = 'HOME',
  ALPHABET = 'ALPHABET',
  MATH = 'MATH',
  ADDING_GAME = 'ADDING_GAME'
}

export enum LetterCase {
  UPPER = 'UPPER',
  LOWER = 'LOWER'
}

export interface GameState {
  currentLetter: LetterInfo | null;
  currentNumber: NumberInfo | null;
  mode: GameMode;
  letterCase: LetterCase;
  appSection: AppSection;
}
