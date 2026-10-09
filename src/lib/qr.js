// Dependency-free QR code encoder (byte mode, error-correction level M, versions 1-10).
// Supports up to 213 bytes, plenty for a ticket code like "BASH-1A2B3C4D".
// Usage: const { size, modules } = makeQR("BASH-1A2B3C4D");  modules[y][x] === true means dark.

const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // level M, by version
const NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]; // level M, by version
const MAX_VERSION = 10;

const bit = (x, i) => ((x >>> i) & 1) !== 0;

function rawModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
        const n = Math.floor(ver / 7) + 2;
        r -= (25 * n - 10) * n - 55;
        if (ver >= 7) r -= 36;
    }
    return r;
}

const dataCapacity = (ver) =>
    Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];

/* ---------- Reed-Solomon over GF(256), polynomial 0x11D ---------- */
function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
    }
    return z;
}

function rsDivisor(degree) {
    const result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < degree; j++) {
            result[j] = gfMul(result[j], root);
            if (j + 1 < degree) result[j] ^= result[j + 1];
        }
        root = gfMul(root, 2);
    }
    return result;
}

function rsRemainder(data, divisor) {
    const result = divisor.map(() => 0);
    for (const b of data) {
        const factor = b ^ result.shift();
        result.push(0);
        divisor.forEach((coef, i) => (result[i] ^= gfMul(coef, factor)));
    }
    return result;
}

/* ---------- data codewords ---------- */
function encodeData(bytes, ver) {
    const bits = [];
    const push = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };
    push(0b0100, 4); // byte mode
    push(bytes.length, ver >= 10 ? 16 : 8);
    bytes.forEach((b) => push(b, 8));

    const capBits = dataCapacity(ver) * 8;
    push(0, Math.min(4, capBits - bits.length)); // terminator
    push(0, (8 - (bits.length % 8)) % 8); // byte align
    for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) push(pad, 8);

    const out = new Array(bits.length / 8).fill(0);
    bits.forEach((b, i) => (out[i >>> 3] |= b << (7 - (i & 7))));
    return out;
}

function addEccAndInterleave(data, ver) {
    const numBlocks = NUM_BLOCKS[ver];
    const eccLen = ECC_PER_BLOCK[ver];
    const rawCodewords = Math.floor(rawModules(ver) / 8);
    const numShort = numBlocks - (rawCodewords % numBlocks);
    const shortLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const divisor = rsDivisor(eccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
        const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
        k += dat.length;
        const ecc = rsRemainder(dat, divisor);
        if (i < numShort) dat.push(0);
        blocks.push(dat.concat(ecc));
    }
    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
        blocks.forEach((block, j) => {
            if (i !== shortLen - eccLen || j >= numShort) result.push(block[i]);
        });
    }
    return result;
}

/* ---------- matrix ---------- */
function alignmentPositions(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const result = [6];
    for (let pos = ver * 4 + 10; result.length < n; pos -= step) result.splice(1, 0, pos);
    return result;
}

function buildMatrix(ver, codewords) {
    const size = ver * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFn = (x, y, dark) => {
        modules[y][x] = dark;
        isFn[y][x] = true;
    };

    // timing
    for (let i = 0; i < size; i++) {
        setFn(6, i, i % 2 === 0);
        setFn(i, 6, i % 2 === 0);
    }
    // finders (with separators)
    const finder = (cx, cy) => {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, dist !== 2 && dist !== 4);
            }
        }
    };
    finder(3, 3);
    finder(size - 4, 3);
    finder(3, size - 4);
    // alignment
    const pos = alignmentPositions(ver);
    pos.forEach((px, i) =>
        pos.forEach((py, j) => {
            if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return;
            for (let dy = -2; dy <= 2; dy++)
                for (let dx = -2; dx <= 2; dx++) setFn(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }),
    );

    const drawFormat = (mask) => {
        const data = (0 << 3) | mask; // level M = 0b00
        let rem = data;
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const bits = ((data << 10) | rem) ^ 0x5412;
        for (let i = 0; i <= 5; i++) setFn(8, i, bit(bits, i));
        setFn(8, 7, bit(bits, 6));
        setFn(8, 8, bit(bits, 7));
        setFn(7, 8, bit(bits, 8));
        for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(bits, i));
        for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(bits, i));
        for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(bits, i));
        setFn(8, size - 8, true); // always-dark module
    };
    drawFormat(0); // reserve the format area (rewritten once the mask is chosen)

    if (ver >= 7) {
        let rem = ver;
        for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
        const bits = (ver << 12) | rem;
        for (let i = 0; i < 18; i++) {
            const a = size - 11 + (i % 3);
            const b = Math.floor(i / 3);
            setFn(a, b, bit(bits, i));
            setFn(b, a, bit(bits, i));
        }
    }

    // place data bits in the zig-zag order
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
                const x = right - j;
                const upward = ((right + 1) & 2) === 0;
                const y = upward ? size - 1 - vert : vert;
                if (!isFn[y][x] && i < codewords.length * 8) {
                    modules[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
                    i++;
                }
            }
        }
    }
    return { size, modules, isFn, drawFormat };
}

const MASKS = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(m, mask) {
    for (let y = 0; y < m.size; y++)
        for (let x = 0; x < m.size; x++)
            if (!m.isFn[y][x] && MASKS[mask](x, y)) m.modules[y][x] = !m.modules[y][x];
}

function penalty(m) {
    const { size, modules } = m;
    let score = 0;
    const lines = [];
    for (let a = 0; a < size; a++) {
        lines.push(modules[a]);
        lines.push(modules.map((row) => row[a]));
    }
    const P1 = [true, false, true, true, true, false, true, false, false, false, false];
    const P2 = [false, false, false, false, true, false, true, true, true, false, true];
    for (const line of lines) {
        // rule 1: runs of 5+ same-colour modules
        let run = 1;
        for (let i = 1; i <= size; i++) {
            if (i < size && line[i] === line[i - 1]) run++;
            else {
                if (run >= 5) score += run - 2;
                run = 1;
            }
        }
        // rule 3: finder-like 1:1:3:1:1 patterns
        for (let i = 0; i + 11 <= size; i++) {
            if (P1.every((v, k) => line[i + k] === v) || P2.every((v, k) => line[i + k] === v)) score += 40;
        }
    }
    // rule 2: 2x2 blocks
    for (let y = 0; y < size - 1; y++)
        for (let x = 0; x < size - 1; x++) {
            const c = modules[y][x];
            if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
        }
    // rule 4: dark/light balance
    const dark = modules.reduce((s, row) => s + row.filter(Boolean).length, 0);
    const total = size * size;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
}

/** Encodes text (UTF-8) as a QR code. Throws if it does not fit in version 10. */
export function makeQR(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text)));
    let ver = 1;
    // byte mode needs 4 mode bits + count bits + 8 bits per byte
    while (ver <= MAX_VERSION) {
        const needBits = 4 + (ver >= 10 ? 16 : 8) + bytes.length * 8;
        if (needBits <= dataCapacity(ver) * 8) break;
        ver++;
    }
    if (ver > MAX_VERSION) throw new Error("Text is too long for the QR code");

    const codewords = addEccAndInterleave(encodeData(bytes, ver), ver);

    let best = null;
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
        const m = buildMatrix(ver, codewords);
        applyMask(m, mask);
        m.drawFormat(mask);
        const s = penalty(m);
        if (s < bestScore) {
            bestScore = s;
            best = m;
        }
    }
    return { size: best.size, modules: best.modules, version: ver };
}

/** SVG path for the dark modules, with a quiet-zone border. Returns { path, viewBox }. */
export function qrSvgPath(text, border = 2) {
    const { size, modules } = makeQR(text);
    let path = "";
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (modules[y][x]) path += `M${x + border},${y + border}h1v1h-1z`;
    const dim = size + border * 2;
    return { path, viewBox: `0 0 ${dim} ${dim}`, size: dim };
}
