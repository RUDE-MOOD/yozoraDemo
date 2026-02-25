const fs = require('fs');

const draft = JSON.parse(fs.readFileSync('src/data/draftConstellationData.json', 'utf8'));
const toAdd = draft.slice(1, 10);

const shapeData = {
    monoceros: {
        starPositions: [
            { x: 0.20, y: 0.50 }, { x: 0.35, y: 0.40 }, { x: 0.50, y: 0.45 }, { x: 0.70, y: 0.50 },
            { x: 0.85, y: 0.65 }, { x: 0.40, y: 0.65 }, { x: 0.60, y: 0.70 }, { x: 0.35, y: 0.30 }
        ],
        lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [3, 6], [1, 7], [7, 2]]
    },
    sagittarius: {
        starPositions: [
            { x: 0.50, y: 0.40 }, { x: 0.30, y: 0.40 }, { x: 0.30, y: 0.60 }, { x: 0.45, y: 0.70 },
            { x: 0.60, y: 0.70 }, { x: 0.65, y: 0.55 }, { x: 0.80, y: 0.50 }, { x: 0.60, y: 0.20 },
            { x: 0.70, y: 0.35 }, { x: 0.75, y: 0.85 }, { x: 0.90, y: 0.30 }, { x: 0.40, y: 0.20 },
            { x: 0.20, y: 0.25 }, { x: 0.20, y: 0.80 }, { x: 0.40, y: 0.90 }
        ],
        lines: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [5, 0], [4, 0],
            [7, 8], [8, 9], [10, 8], [8, 11], [11, 12], [2, 13], [3, 14]
        ]
    },
    delphinus: {
        starPositions: [
            { x: 0.20, y: 0.80 }, { x: 0.45, y: 0.50 }, { x: 0.60, y: 0.35 }, { x: 0.80, y: 0.50 }, { x: 0.60, y: 0.70 }
        ],
        lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]]
    },
    indus: {
        starPositions: [
            { x: 0.50, y: 0.20 }, { x: 0.50, y: 0.50 }, { x: 0.30, y: 0.80 }, { x: 0.70, y: 0.80 }, { x: 0.80, y: 0.40 }
        ],
        lines: [[0, 1], [1, 2], [1, 3], [1, 4]]
    },
    pisces: {
        starPositions: [
            { x: 0.75, y: 0.20 }, { x: 0.85, y: 0.15 }, { x: 0.95, y: 0.25 }, { x: 0.90, y: 0.35 }, { x: 0.80, y: 0.30 },
            { x: 0.70, y: 0.35 }, { x: 0.65, y: 0.45 }, { x: 0.60, y: 0.55 }, { x: 0.55, y: 0.65 }, { x: 0.50, y: 0.75 },
            { x: 0.40, y: 0.70 }, { x: 0.30, y: 0.65 }, { x: 0.25, y: 0.55 }, { x: 0.20, y: 0.45 }, { x: 0.15, y: 0.35 },
            { x: 0.10, y: 0.30 }, { x: 0.05, y: 0.20 }, { x: 0.15, y: 0.10 }, { x: 0.25, y: 0.20 }, { x: 0.20, y: 0.30 }
        ],
        lines: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
            [0, 5], [5, 6], [6, 7], [7, 8], [8, 9],
            [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
            [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 15]
        ]
    },
    lepus: {
        starPositions: [
            { x: 0.60, y: 0.40 }, { x: 0.40, y: 0.45 }, { x: 0.30, y: 0.60 }, { x: 0.50, y: 0.65 },
            { x: 0.70, y: 0.20 }, { x: 0.40, y: 0.80 }, { x: 0.20, y: 0.85 }, { x: 0.20, y: 0.50 }
        ],
        lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [3, 5], [2, 6], [2, 7]]
    },
    bootes: {
        starPositions: [
            { x: 0.50, y: 0.80 }, { x: 0.35, y: 0.60 }, { x: 0.65, y: 0.55 }, { x: 0.30, y: 0.40 },
            { x: 0.70, y: 0.35 }, { x: 0.50, y: 0.20 }, { x: 0.50, y: 0.05 }, { x: 0.15, y: 0.30 },
            { x: 0.85, y: 0.25 }, { x: 0.60, y: 0.95 }, { x: 0.40, y: 0.95 }, { x: 0.20, y: 0.50 }
        ],
        lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [5, 6], [3, 7], [4, 8], [0, 9], [0, 10], [1, 11]]
    },
    hydra: {
        starPositions: [
            { x: 0.85, y: 0.20 }, { x: 0.95, y: 0.25 }, { x: 0.90, y: 0.35 }, { x: 0.80, y: 0.30 },
            { x: 0.70, y: 0.40 }, { x: 0.60, y: 0.50 }, { x: 0.50, y: 0.45 }, { x: 0.40, y: 0.55 },
            { x: 0.30, y: 0.65 }, { x: 0.20, y: 0.60 }, { x: 0.15, y: 0.70 }, { x: 0.10, y: 0.80 },
            { x: 0.20, y: 0.90 }, { x: 0.05, y: 0.95 }
        ],
        lines: [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13]
        ]
    },
    eridanus: {
        starPositions: [
            { x: 0.10, y: 0.10 }, { x: 0.20, y: 0.15 }, { x: 0.25, y: 0.25 }, { x: 0.15, y: 0.35 }, { x: 0.10, y: 0.45 },
            { x: 0.20, y: 0.55 }, { x: 0.30, y: 0.50 }, { x: 0.40, y: 0.45 }, { x: 0.50, y: 0.55 }, { x: 0.45, y: 0.65 },
            { x: 0.35, y: 0.70 }, { x: 0.25, y: 0.75 }, { x: 0.30, y: 0.85 }, { x: 0.40, y: 0.90 }, { x: 0.50, y: 0.85 },
            { x: 0.60, y: 0.80 }, { x: 0.70, y: 0.75 }, { x: 0.80, y: 0.85 }, { x: 0.90, y: 0.90 }, { x: 0.95, y: 0.80 },
            { x: 0.85, y: 0.70 }, { x: 0.75, y: 0.65 }, { x: 0.80, y: 0.55 }, { x: 0.90, y: 0.45 }, { x: 0.85, y: 0.35 },
            { x: 0.75, y: 0.25 }
        ],
        lines: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
            [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20],
            [20, 21], [21, 22], [22, 23], [23, 24], [24, 25]
        ]
    }
};

let newJsCode = '';

for (const c of toAdd) {
    const data = shapeData[c.id];
    let pStr = '';
    let lStr = '';

    if (data) {
        pStr = data.starPositions.map(p => `{ x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)} }`).join(',\n            ');
        lStr = data.lines.map(l => `[${l[0]}, ${l[1]}]`).join(', ');
    } else {
        // Fallback to circle
        const pos = [];
        for (let i = 0; i < c.starCount; i++) {
            const angle = (Math.PI * 2 * i) / c.starCount;
            pos.push({ x: 0.5 + Math.cos(angle) * 0.3, y: 0.5 + Math.sin(angle) * 0.3 });
        }
        pStr = pos.map(p => `{ x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)} }`).join(',\n            ');
        const lines = [];
        for (let i = 0; i < c.starCount - 1; i++) lines.push(`[${i}, ${i + 1}]`);
        lStr = lines.join(', ');
    }

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

console.log("Successfully generated real shapes for 9 constellations!");
