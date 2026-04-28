import { DialogueAsset } from '../types';

export type AutoEventToken =
  | { type: 'move'; axis: 'x' | 'y'; amount: number }
  | { type: 'delay'; ms: number }
  | { type: 'openDialog' }
  | { type: 'writeLine'; lineNumber: number }
  | { type: 'waitSpc' }
  | { type: 'waitText' }
  | { type: 'clearDialog' }
  | { type: 'closeDialog' };

export type AutoEventValidationIssue = {
  message: string;
  index: number;
};

export type AutoEventParseResult = {
  tokens: AutoEventToken[];
  issues: AutoEventValidationIssue[];
};

const TOKEN_PATTERN = /([xXyYdw])(\d+)|[ostkc]/g;

const getDialogueLineText = (dialogue: DialogueAsset | undefined, lineIndex: number): string => {
  const line = dialogue?.lines?.[lineIndex];
  if (!line) return '';
  return `${line.speaker?.trim() ? `${line.speaker.trim()}: ` : ''}${line.text || ''}`.trim();
};

export const parseAutoEventString = (
  eventString: string,
  dialogue?: DialogueAsset
): AutoEventParseResult => {
  const source = String(eventString || '').replace(/\s+/g, '');
  const tokens: AutoEventToken[] = [];
  const issues: AutoEventValidationIssue[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(source)) !== null) {
    if (match.index !== cursor) {
      issues.push({
        index: cursor,
        message: `Unsupported token near "${source.slice(cursor, Math.min(source.length, cursor + 8))}".`,
      });
      return { tokens, issues };
    }

    cursor = match.index + match[0].length;
    const command = match[0][0];
    const value = match[2] ? Number(match[2]) : 0;

    switch (command) {
      case 'x':
        tokens.push({ type: 'move', axis: 'x', amount: Math.max(0, value) });
        break;
      case 'X':
        tokens.push({ type: 'move', axis: 'x', amount: -Math.max(0, value) });
        break;
      case 'y':
        tokens.push({ type: 'move', axis: 'y', amount: Math.max(0, value) });
        break;
      case 'Y':
        tokens.push({ type: 'move', axis: 'y', amount: -Math.max(0, value) });
        break;
      case 'd':
        tokens.push({ type: 'delay', ms: Math.max(0, value) });
        break;
      case 'w': {
        const lineNumber = value;
        if (!Number.isFinite(lineNumber) || lineNumber < 1) {
          issues.push({ index: match.index, message: `w${match[2] || ''} must reference a 1-based Dialogue line.` });
        } else if (dialogue?.lines && lineNumber > dialogue.lines.length) {
          issues.push({ index: match.index, message: `w${lineNumber} is outside the selected Dialogue line range.` });
        } else if (dialogue?.lines?.[lineNumber - 1] && !getDialogueLineText(dialogue, lineNumber - 1)) {
          issues.push({ index: match.index, message: `w${lineNumber} targets an empty Dialogue line.` });
        }
        tokens.push({ type: 'writeLine', lineNumber });
        break;
      }
      case 'o':
        tokens.push({ type: 'openDialog' });
        break;
      case 's':
        tokens.push({ type: 'waitSpc' });
        break;
      case 't':
        tokens.push({ type: 'waitText' });
        break;
      case 'k':
        tokens.push({ type: 'clearDialog' });
        break;
      case 'c':
        tokens.push({ type: 'closeDialog' });
        break;
      default:
        issues.push({ index: match.index, message: `Unsupported token "${command}".` });
        break;
    }
  }

  if (cursor < source.length) {
    issues.push({
      index: cursor,
      message: `Unsupported token near "${source.slice(cursor, Math.min(source.length, cursor + 8))}".`,
    });
  }

  return { tokens, issues };
};

export const autoEventStringUsesDialogue = (eventString: string): boolean =>
  parseAutoEventString(eventString).tokens.some(token => token.type === 'openDialog' || token.type === 'writeLine');
