

import React from 'react';
import { Z80_MNEMONICS, Z80_REGISTERS, Z80_CONDITIONS, Z80_DIRECTIVES } from '../../constants';

interface Z80SyntaxHighlighterProps {
  code: string;
  editorFontSize: number;
  editorLineHeight: number;
}

const commentsRegex = /(;.+)/g;
const labelsRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):/gm;

const lookaheadToPreventHtmlMatch = "(?![^<]*>|[^<>]*<\\/span>)";
const stringsRegex = new RegExp(`(".*?"|'.*?')${lookaheadToPreventHtmlMatch}`, 'g');
const hexRegex = new RegExp(`#[0-9A-Fa-f]+${lookaheadToPreventHtmlMatch}`, 'g');
const binaryRegex = new RegExp(`%[01]+${lookaheadToPreventHtmlMatch}`, 'g');

const mnemonicsRegex = new RegExp(`\\b(${Z80_MNEMONICS.join('|')})\\b`, 'gi');
const registersRegexStr = Z80_REGISTERS.join('|').replace("'", "\\'");
const registersRegex = new RegExp(`\\b(${registersRegexStr})\\b`, 'gi');
const conditionsRegex = new RegExp(`\\b(${Z80_CONDITIONS.join('|')})\\b`, 'gi');
const directivesRegex = new RegExp(`\\b(${Z80_DIRECTIVES.join('|')})\\b`, 'gi');

const portValueRegexPart = "(?:#[0-9A-Fa-f]+|\\b0x[0-9A-Fa-f]+\\b|\\b[0-9A-Fa-f]+[Hh]\\b|%[01]+|\\b\\d+\\b|C)";
const registerOrAccumulatorRegexPart = `(?:${registersRegexStr}|A)`;

const ioPattern1Regex = new RegExp(`\\b(OUT|IN)\\s*\\(\\s*(${portValueRegexPart})\\s*\\)\\s*,\\s*(${registerOrAccumulatorRegexPart})\\b`, 'gi');
const ioPattern2Regex = new RegExp(`\\b(OUT|IN)\\s*(${registerOrAccumulatorRegexPart})\\s*,\\s*\\(\\s*(${portValueRegexPart})\\s*\\)\\b`, 'gi');

const highlightSegment = (segment: string): string => {
  let line = segment.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  line = line.replace(commentsRegex, '<span class="text-green-400 opacity-70">$1</span>');

  line = line.replace(stringsRegex, (match) => {
    return `<span class="text-yellow-400">${match}</span>`;
  });

  line = line.replace(labelsRegex, (match, labelName) => `<span class="text-msx-highlight">${labelName}</span>:`);

  line = line.replace(ioPattern1Regex, (match, instruction, port, register) =>
    `<span class="text-msx-accent">${instruction}</span> (<span class="text-msx-cyan">${port}</span>),<span class="text-orange-400">${register}</span>`
  );
  line = line.replace(ioPattern2Regex, (match, instruction, register, port) =>
    `<span class="text-msx-accent">${instruction}</span> <span class="text-orange-400">${register}</span>,(<span class="text-msx-cyan">${port}</span>)`
  );

  line = line.replace(mnemonicsRegex, (match, mnemonic) => {
    const alreadyStyled = line.includes(`<span class="text-msx-accent">${mnemonic}</span>`);
    if ( (mnemonic.toUpperCase() === 'IN' || mnemonic.toUpperCase() === 'OUT') && alreadyStyled) {
      return mnemonic;
    }
    return `<span class="text-msx-accent">${mnemonic}</span>`;
  });

  line = line.replace(directivesRegex, '<span class="text-purple-400">$1</span>');

  line = line.replace(new RegExp(`\\b(${registersRegexStr})${lookaheadToPreventHtmlMatch}\\b`, 'gi'), '<span class="text-orange-400">$1</span>');

  line = line.replace(new RegExp(`\\b(${Z80_CONDITIONS.join('|')})${lookaheadToPreventHtmlMatch}\\b`, 'gi'), '<span class="text-pink-400">$1</span>');

 // line = line.replace(hexRegex, '<span class="text-msx-cyan"></span>');
  //line = line.replace(binaryRegex, '<span class="text-msx-cyan">$0</span>');

  line = line.replace(/\b(\d+)\b(?![Hh])(?![^<]*>|[^<>]*<\/span>)/g, (match, decNum, offset, fullString) => {
      const twoCharsBefore = offset > 1 ? fullString.substring(offset - 2, offset) : "";
      const oneCharBefore = offset > 0 ? fullString[offset - 1] : '';
      
      let isPartOfStyledHex = false;
      if (twoCharsBefore.toLowerCase() === '0x') {
          const substrBeforePrefix = fullString.substring(0, offset - 2);
          if (substrBeforePrefix.endsWith('<span class="text-msx-cyan">')) {
              isPartOfStyledHex = true;
          }
      } 
      else if (oneCharBefore === '#') {
          const substrBeforePrefix = fullString.substring(0, offset - 1);
          if (substrBeforePrefix.endsWith('<span class="text-msx-cyan">')) {
              isPartOfStyledHex = true;
          }
      }
      
      if (isPartOfStyledHex) {
          return match;
      }
      
      let insideAttribute = false;
      const searchWindow = fullString.substring(Math.max(0, offset - 30), offset + match.length + 30);
      if (/(class|id|style|data-[\w-]+|width|height|min|max|step|value|size|cols|rows|minlength|maxlength|tabindex|cx|cy|r|x|y|dx|dy|fx|fy|x1|x2|y1|y2|offset|startoffset|spacing|padding|margin|border|font-size|line-height)=["']([^"']*\b\d+\b[^"']*)["']/gi.test(searchWindow)) {
           let openQuoteIndex = -1;
           let attrStartIndex = -1;
            for(let i = offset -1; i >=0; i--) {
                const char = fullString[i];
                const prevChar = i > 0 ? fullString[i-1] : '';
                if((char === '"' || char === "'") && prevChar === '=') {
                    openQuoteIndex = i;
                    attrStartIndex = i-1;
                    break;
                }
                if(char === '<' || char === ' ' || char === '\t') break;
            }
           if(openQuoteIndex !== -1 && attrStartIndex !== -1) {
                let closeQuoteIndex = -1;
                for(let i = offset + match.length; i < fullString.length; i++) {
                    if(fullString[i] === fullString[openQuoteIndex]) {closeQuoteIndex = i; break;}
                    if(fullString[i] === '>' || fullString[i] === ' ') break;
                }
                if(closeQuoteIndex !== -1 && offset > openQuoteIndex && offset + match.length <= closeQuoteIndex) {
                    const attrNameMatch = fullString.substring(Math.max(0, attrStartIndex - 20), attrStartIndex).match(/([\w-]+)=$/);
                    if (attrNameMatch) {
                       const commonNumericHtmlAttrs = /^(width|height|size|min|max|step|cols|rows|value|font-size|line-height|padding|margin|border|opacity|z-index|order|flex-grow|flex-shrink|cx|cy|r|x|y|dx|dy|fx|fy|x1|x2|y1|y2|offset|startoffset)$/i;
                       if (!commonNumericHtmlAttrs.test(attrNameMatch[1])) { 
                           insideAttribute = true;
                       }
                    }
                }
           }
      }

      if (insideAttribute) {
        return match;
      }

      const partBefore = fullString.substring(0, offset);
      if (partBefore.lastIndexOf('<span') > partBefore.lastIndexOf('</span>')) {
        return match;
      }

      const preChar = offset > 0 ? fullString[offset-1] : ' ';
      const postChar = offset + match.length < fullString.length ? fullString[offset+match.length] : ' ';
      
      if (preChar.match(/[a-zA-Z0-9_#%"']/) || postChar.match(/[a-zA-Z0-9_#%"']/)) {
          if ( !(preChar === ' ' || preChar === ',' || preChar === '(' || preChar === '\t' || preChar === '-' || preChar === '>' ) ) {
               return match;
          }
      }
      return `<span class="text-msx-cyan">${decNum}</span>`;
    });

  return line;
};


export const Z80SyntaxHighlighter = React.forwardRef<HTMLPreElement, Z80SyntaxHighlighterProps>(
  ({ code, editorFontSize, editorLineHeight }, ref) => {
    const lines = code.split('\n');
    const preStyle = {
      fontSize: `${editorFontSize}px`,
      lineHeight: `${editorLineHeight}px`,
    };
    const lineNumStyle = {
      fontSize: `${editorFontSize}px`,
      lineHeight: `${editorLineHeight}px`,
    };

    return (
      <pre
        ref={ref}
        className="font-mono whitespace-pre-wrap p-2 h-full overflow-auto bg-msx-bgcolor text-msx-textprimary border border-msx-border rounded"
        style={preStyle}
        aria-hidden="true"
      >
        {lines.map((line, index) => {
          const highlightedLine = highlightSegment(line);
          return (
            <div key={index} className="flex">
              <span
                  className="text-msx-textsecondary select-none pr-2 w-10 text-right flex-shrink-0"
                  style={lineNumStyle}
              >
                  {index + 1}
              </span>
              <code 
                dangerouslySetInnerHTML={{ __html: highlightedLine || ' ' }}
                className="flex-1 min-w-0"
                style={{ overflowWrap: 'break-word' }}
              />
            </div>
          );
        })}
      </pre>
    );
  }
);

Z80SyntaxHighlighter.displayName = 'Z80SyntaxHighlighter';
