import { parseInline, parseBlocks } from '../yambiTextParser';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Test failed: ${message}`);
    }
}

function deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function runYambiTextParserTests() {
    // 1. Plain text
    const t1 = parseInline('Hello world');
    assert(deepEqual(t1, [{ type: 'text', text: 'Hello world', style: {} }]), 'Plain text');

    // 2. Bold text
    const t2 = parseInline('Hello *world*!');
    assert(deepEqual(t2, [
        { type: 'text', text: 'Hello ', style: {} },
        { type: 'text', text: 'world', style: { bold: true } },
        { type: 'text', text: '!', style: {} },
    ]), 'Bold text *world*');

    // 3. Italic text
    const t3 = parseInline('This is _important_');
    assert(deepEqual(t3, [
        { type: 'text', text: 'This is ', style: {} },
        { type: 'text', text: 'important', style: { italic: true } },
    ]), 'Italic text _important_');

    // 4. Strikethrough text
    const t4 = parseInline('This is ~deprecated~');
    assert(deepEqual(t4, [
        { type: 'text', text: 'This is ', style: {} },
        { type: 'text', text: 'deprecated', style: { strikethrough: true } },
    ]), 'Strikethrough text ~deprecated~');

    // 5. Inline code
    const t5 = parseInline('Run `npm install` now');
    assert(deepEqual(t5, [
        { type: 'text', text: 'Run ', style: {} },
        { type: 'text', text: 'npm install', style: { code: true } },
        { type: 'text', text: ' now', style: {} },
    ]), 'Inline code `npm install`');

    // 6. Bold + Italic
    const t6a = parseInline('Hello *_world_*');
    assert(deepEqual(t6a, [
        { type: 'text', text: 'Hello ', style: {} },
        { type: 'text', text: 'world', style: { bold: true, italic: true } },
    ]), 'Bold + Italic *_world_*');

    const t6b = parseInline('Hello _*world*_');
    assert(deepEqual(t6b, [
        { type: 'text', text: 'Hello ', style: {} },
        { type: 'text', text: 'world', style: { bold: true, italic: true } },
    ]), 'Bold + Italic _*world*_');

    // 7. Bold + Strikethrough
    const t7 = parseInline('*~bold strike~*');
    assert(deepEqual(t7, [
        { type: 'text', text: 'bold strike', style: { bold: true, strikethrough: true } },
    ]), 'Bold + Strikethrough *~bold strike~*');

    // 8. Italic + Strikethrough
    const t8 = parseInline('_~italic strike~_');
    assert(deepEqual(t8, [
        { type: 'text', text: 'italic strike', style: { italic: true, strikethrough: true } },
    ]), 'Italic + Strikethrough _~italic strike~_');

    // 9. All three
    const t9 = parseInline('*_~all three~_*');
    assert(deepEqual(t9, [
        { type: 'text', text: 'all three', style: { bold: true, italic: true, strikethrough: true } },
    ]), 'All three *_~all three~_*');

    // 10. Nested
    const t10 = parseInline('Hello *this is _very important_*.');
    assert(deepEqual(t10, [
        { type: 'text', text: 'Hello ', style: {} },
        { type: 'text', text: 'this is ', style: { bold: true } },
        { type: 'text', text: 'very important', style: { bold: true, italic: true } },
        { type: 'text', text: '.', style: {} },
    ]), 'Nested formatting');

    // 11. Escaping
    const t11 = parseInline('\\*not bold\\*');
    assert(deepEqual(t11, [
        { type: 'text', text: '*not bold*', style: {} },
    ]), 'Escaping \\*not bold\\*');

    // 12. False positives
    const t12a = parseInline('2 * 3 = 6');
    assert(deepEqual(t12a, [{ type: 'text', text: '2 * 3 = 6', style: {} }]), 'Math 2 * 3 = 6');

    const t12b = parseInline('file_name');
    assert(deepEqual(t12b, [{ type: 'text', text: 'file_name', style: {} }]), 'Filename file_name');

    const t12c = parseInline('email@example.com');
    assert(deepEqual(t12c, [{ type: 'text', text: 'email@example.com', style: {} }]), 'Email email@example.com');

    // 13. Blocks
    const b1 = parseBlocks('```javascript\nconst msg = "Hello";\n```');
    assert(b1.length === 1 && b1[0].type === 'code_block' && b1[0].language === 'javascript' && b1[0].codeText === 'const msg = "Hello";', 'Code Block');

    const b2 = parseBlocks('> This is a quote');
    assert(b2.length === 1 && b2[0].type === 'quote' && b2[0].inlines && b2[0].inlines[0].text === 'This is a quote', 'Quote Block');

    const b3 = parseBlocks('- First item\n- Second item');
    assert(b3.length === 2 && b3[0].type === 'bullet_list' && b3[1].type === 'bullet_list', 'Bullet List Block');

    const b4 = parseBlocks('1. First item\n10. Tenth item');
    assert(b4.length === 2 && b4[0].number === '1' && b4[1].number === '10', 'Numbered List Block');
}
