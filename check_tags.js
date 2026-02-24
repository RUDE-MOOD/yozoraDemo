const fs = require('fs');
const content = fs.readFileSync('src/components/ui/UI.jsx', 'utf8');

const stack = [];
const lines = content.split('\n');

const regex = /<\/?([a-zA-Z0-9_.-]+)([^>]*?)\/?>/g;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // ignore comments roughly
    if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;

    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];

        // ignore self closing
        if (fullTag.endsWith('/>')) continue;

        // ignore fragments
        if (fullTag === '<>' || fullTag === '</>') continue;

        if (fullTag.startsWith('</')) {
            if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
                stack.pop();
            } else {
                console.log(`Mismatch at line ${i + 1}: found closing </${tagName}>, but expected </${stack.length > 0 ? stack[stack.length - 1].name : 'none'}>. Stack: ${JSON.stringify(stack)}`);
            }
        } else {
            // It's an opening tag
            // Handle known self-closing HTML tags
            const selfClosing = ['input', 'img', 'br', 'hr', 'circle', 'path'].includes(tagName.toLowerCase());
            if (!selfClosing) {
                stack.push({ name: tagName, line: i + 1 });
            }
        }
    }
}

console.log('Unclosed tags:', stack);
