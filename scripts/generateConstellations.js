const fs = require('fs');
const draft = JSON.parse(fs.readFileSync('src/data/draftConstellationData.json', 'utf8'));

// Take 9
const toAdd = draft.slice(1, 10);

function generatePositions(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const x = 0.5 + Math.cos(angle) * 0.3; // 0.2 to 0.8
        const y = 0.5 + Math.sin(angle) * 0.3;
        positions.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    }
    return positions;
}

function generateLines(count) {
    const lines = [];
    for (let i = 0; i < count - 1; i++) {
        lines.push([i, i + 1]);
    }
    return lines;
}

let newJsCode = '';

for (const c of toAdd) {
    const pos = generatePositions(c.starCount);
    let pStr = pos.map(p => `{ x: ${p.x}, y: ${p.y} }`).join(',\n            ');

    let lines = generateLines(c.starCount);
    let lStr = lines.map(l => `[${l[0]}, ${l[1]}]`).join(', ');

    newJsCode += `
    {
        id: "${c.id}",
        name: "${c.name}",
        starCount: ${c.starCount},
        completedDate: null,
        filledStars: 0,
        description:
            "${c.description.replace(/\n/g, '\\n')}",

        features:
            "${c.features.replace(/\n/g, '\\n')}",

        history:
            "${c.history.replace(/\n/g, '\\n')}",

        starPositions: [
            ${pStr}
        ],

        lines: [
            ${lStr}
        ],
    },`;
}

let originalCode = fs.readFileSync('src/data/constellationData.js', 'utf8');

// remove ]; at the end
originalCode = originalCode.replace(/];\s*$/, '');

const finalCode = originalCode + newJsCode + '\n];\n';

fs.writeFileSync('src/data/constellationData.js', finalCode);

console.log("Successfully added 9 new constellations to constellationData.js");
