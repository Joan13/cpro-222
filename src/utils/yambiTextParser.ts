export interface InlineStyle {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
}

export interface InlineToken {
    type: 'text';
    text: string;
    style: InlineStyle;
}

export interface BlockNode {
    type: 'paragraph' | 'code_block' | 'quote' | 'bullet_list' | 'numbered_list';
    inlines?: InlineToken[];
    language?: string;
    codeText?: string;
    number?: string;
}

// Unicode private placeholders for escaped characters
const ESC_BACKSLASH = '\uE000';
const ESC_ASTERISK  = '\uE001';
const ESC_UNDERSCORE = '\uE002';
const ESC_TILDE      = '\uE003';
const ESC_BACKTICK   = '\uE004';

function escapePlaceholders(str: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '\\' && i + 1 < str.length) {
            const next = str[i + 1];
            if (next === '\\') { result += ESC_BACKSLASH; i++; }
            else if (next === '*') { result += ESC_ASTERISK; i++; }
            else if (next === '_') { result += ESC_UNDERSCORE; i++; }
            else if (next === '~') { result += ESC_TILDE; i++; }
            else if (next === '`') { result += ESC_BACKTICK; i++; }
            else { result += str[i]; }
        } else {
            result += str[i];
        }
    }
    return result;
}

function restoreEscapedPlaceholders(str: string): string {
    return str
        .replace(/\uE000/g, '\\')
        .replace(/\uE001/g, '*')
        .replace(/\uE002/g, '_')
        .replace(/\uE003/g, '~')
        .replace(/\uE004/g, '`');
}

/**
 * Checks if a character at index is a valid opening delimiter for *, _, ~ or `
 */
function isValidOpening(str: string, index: number): boolean {
    if (index + 1 >= str.length) return false;
    const nextChar = str[index + 1];
    if (/\s/.test(nextChar)) return false; // Must not be followed by whitespace/newline

    if (index === 0) return true;
    const prevChar = str[index - 1];
    // Must be preceded by start of string, whitespace, or punctuation
    return /[\s\t\n!?"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(prevChar);
}

/**
 * Checks if a character at index is a valid closing delimiter for *, _, ~ or `
 */
function isValidClosing(str: string, index: number): boolean {
    if (index <= 0) return false;
    const prevChar = str[index - 1];
    if (/\s/.test(prevChar)) return false; // Must not be preceded by whitespace/newline

    if (index === str.length - 1) return true;
    const nextChar = str[index + 1];
    // Must be followed by end of string, whitespace, or punctuation
    return /[\s\t\n!?"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(nextChar);
}

/**
 * Parses inline formatting (*bold*, _italic_, ~strikethrough~, `code`) for a single line or string.
 */
export function parseInline(text: string): InlineToken[] {
    if (!text) return [];

    // Step 1: Escape handling
    const escapedText = escapePlaceholders(text);
    const n = escapedText.length;

    // We track properties per character
    const charStyles: InlineStyle[] = Array.from({ length: n }, () => ({}));
    const consumed = new Array<boolean>(n).fill(false);

    // Step 2: Extract inline monospace code (`code`)
    // Find matching unescaped ` pairs
    let i = 0;
    while (i < n) {
        if (escapedText[i] === '`' && isValidOpening(escapedText, i)) {
            let j = i + 1;
            let closeIdx = -1;
            while (j < n) {
                if (escapedText[j] === '`' && isValidClosing(escapedText, j)) {
                    closeIdx = j;
                    break;
                }
                j++;
            }
            if (closeIdx > i + 1) {
                consumed[i] = true;
                consumed[closeIdx] = true;
                for (let k = i + 1; k < closeIdx; k++) {
                    charStyles[k].code = true;
                }
                i = closeIdx + 1;
                continue;
            }
        }
        i++;
    }

    // Step 3: Extract formatting markers (*, _, ~) for non-code characters
    const markers: Array<{ char: string; key: keyof InlineStyle }> = [
        { char: '*', key: 'bold' },
        { char: '_', key: 'italic' },
        { char: '~', key: 'strikethrough' },
    ];

    for (const { char, key } of markers) {
        // Find matching pairs for `char`
        let pos = 0;
        while (pos < n) {
            if (!charStyles[pos].code && !consumed[pos] && escapedText[pos] === char && isValidOpening(escapedText, pos)) {
                let closingPos = -1;
                let lookAhead = pos + 1;
                while (lookAhead < n) {
                    if (!charStyles[lookAhead].code && !consumed[lookAhead] && escapedText[lookAhead] === char && isValidClosing(escapedText, lookAhead)) {
                        closingPos = lookAhead;
                        break;
                    }
                    lookAhead++;
                }

                if (closingPos > pos + 1) {
                    consumed[pos] = true;
                    consumed[closingPos] = true;
                    for (let k = pos + 1; k < closingPos; k++) {
                        if (!charStyles[k].code) {
                            charStyles[k][key] = true;
                        }
                    }
                    // Continue scanning after the opening marker to allow nested tags
                    pos = pos + 1;
                    continue;
                }
            }
            pos++;
        }
    }

    // Step 4: Build tokens from charStyles & consumed
    const tokens: InlineToken[] = [];
    let currentText = '';
    let currentStyle: InlineStyle | null = null;

    const areStylesEqual = (s1: InlineStyle, s2: InlineStyle) => {
        return !!s1.bold === !!s2.bold &&
            !!s1.italic === !!s2.italic &&
            !!s1.strikethrough === !!s2.strikethrough &&
            !!s1.code === !!s2.code;
    };

    for (let idx = 0; idx < n; idx++) {
        if (consumed[idx]) {
            continue;
        }
        const style = charStyles[idx];
        if (currentStyle === null) {
            currentStyle = style;
            currentText = escapedText[idx];
        } else if (areStylesEqual(currentStyle, style)) {
            currentText += escapedText[idx];
        } else {
            if (currentText.length > 0) {
                tokens.push({
                    type: 'text',
                    text: restoreEscapedPlaceholders(currentText),
                    style: currentStyle,
                });
            }
            currentStyle = style;
            currentText = escapedText[idx];
        }
    }

    if (currentStyle !== null && currentText.length > 0) {
        tokens.push({
            type: 'text',
            text: restoreEscapedPlaceholders(currentText),
            style: currentStyle,
        });
    }

    return tokens;
}

/**
 * Parses full block structure including code blocks, block quotes, bullet lists, numbered lists, and paragraphs.
 */
export function parseBlocks(input: string): BlockNode[] {
    if (!input) return [];

    const blocks: BlockNode[] = [];

    // Step 1: Extract code blocks (``` [lang]\n code \n ```)
    const codeBlockRegex = /^```([a-zA-Z0-9_+-]*)\n([\s\S]*?)\n```$/gm;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Scan for fenced code blocks
    while ((match = codeBlockRegex.exec(input)) !== null) {
        const matchStart = match.index;
        const matchEnd = codeBlockRegex.lastIndex;

        // Process non-code-block text preceding this code block
        if (matchStart > lastIndex) {
            const precedingText = input.slice(lastIndex, matchStart);
            parseNonCodeBlocks(precedingText, blocks);
        }

        const language = match[1] ? match[1].trim() : undefined;
        const codeText = match[2];

        blocks.push({
            type: 'code_block',
            language,
            codeText,
        });

        lastIndex = matchEnd;
    }

    if (lastIndex < input.length) {
        const remainingText = input.slice(lastIndex);
        parseNonCodeBlocks(remainingText, blocks);
    }

    return blocks;
}

/**
 * Helper to process non-code-block chunks line by line for quotes, lists, and paragraphs.
 */
function parseNonCodeBlocks(textChunk: string, blocks: BlockNode[]) {
    const lines = textChunk.split(/\r?\n/);
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // 1. Block Quote: line starting with `> ` or `>`
        if (/^>\s?(.*)/.test(line)) {
            const quoteLines: string[] = [];
            while (i < lines.length && /^>\s?(.*)/.test(lines[i])) {
                const qMatch = /^>\s?(.*)/.exec(lines[i]);
                quoteLines.push(qMatch ? qMatch[1] : '');
                i++;
            }
            const quoteContent = quoteLines.join('\n');
            blocks.push({
                type: 'quote',
                inlines: parseInline(quoteContent),
            });
            continue;
        }

        // 2. Bullet List Item: line starting with `- `
        const bulletMatch = /^\s*-\s+(.+)$/.exec(line);
        if (bulletMatch) {
            blocks.push({
                type: 'bullet_list',
                inlines: parseInline(bulletMatch[1]),
            });
            i++;
            continue;
        }

        // 3. Numbered List Item: line starting with `1. `, `10. `, etc.
        const numberMatch = /^\s*(\d+)\.\s+(.+)$/.exec(line);
        if (numberMatch) {
            blocks.push({
                type: 'numbered_list',
                number: numberMatch[1],
                inlines: parseInline(numberMatch[2]),
            });
            i++;
            continue;
        }

        // 4. Regular Paragraph / Text Line
        blocks.push({
            type: 'paragraph',
            inlines: parseInline(line),
        });
        i++;
    }
}
