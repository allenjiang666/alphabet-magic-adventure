
export interface LetterInfo {
  char: string;
  word: string;
  color: string;
  imagePrompt: string;
}

export enum GameMode {
  EXPLORE = 'EXPLORE',
  QUIZ = 'QUIZ',
  MAGIC_DRAW = 'MAGIC_DRAW',
  SPEECH_CHALLENGE = 'SPEECH_CHALLENGE'
}

export enum LetterCase {
  UPPER = 'UPPER',
  LOWER = 'LOWER'
}

export interface GameState {
  currentLetter: LetterInfo | null;
  mode: GameMode;
  letterCase: LetterCase;
}
