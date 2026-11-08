import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Scanlines with filter type 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0; // Filter None
    buffer.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);

  // PNG chunks helper
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const full = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(full), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC-32 table
  function crc32(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c = (c ^ buf[n]) >>> 0;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) >>> 0 : (c >>> 1) >>> 0;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Brand Red: #e30613 -> [227, 6, 19]
// Accent Yellow: #ffd500 -> [255, 213, 0]
// White: [255, 255, 255]

function drawBrandIcon(isMaskable = false) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2;
    const dist = Math.hypot(x - cx, y - cy);

    // Background: Vibrant Brand Red #e30613
    let bgR = 227, bgG = 6, bgB = 19;
    
    // Draw a subtle gradient or rounded card inside
    const normX = x / w;
    const normY = y / h;
    
    // Icon geometry: A stylized Prompt / Chat bubble with a lightning/pen or "P" letter
    // If not maskable, soften corners
    if (!isMaskable) {
      const cornerR = w * 0.22;
      // rounded rect distance
      const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
      const cornerDist = Math.hypot(dx, dy);
      if (cornerDist > cornerR) {
        return [0, 0, 0, 0]; // Transparent outside rounded rect
      }
    }

    // Inside the icon: draw a crisp white prompt chevron & prompt bubble
    // Scale coordinates to -1..1 relative to center
    const nx = (x - cx) / (w * 0.4);
    const ny = (y - cy) / (h * 0.4);

    // Draw chat bubble / prompt badge
    // Speech bubble oval: nx^2 / 1 + ny^2 / 0.8 < 1
    const inBubble = (nx * nx) / 1.0 + (ny * ny) / 0.75 < 0.85;
    // Bubble tail at bottom left
    const inTail = (nx > -0.65 && nx < -0.1 && ny > 0.4 && ny < 0.95 && (nx + ny * 0.5) < 0.15);

    if (inBubble || inTail) {
      // White speech bubble
      // Inside the bubble, draw the yellow prompt chevron `> _`
      // Chevron coordinates
      const isChevron1 = (nx > -0.45 && nx < -0.15 && Math.abs((ny + 0.05) - (nx + 0.3) * 1.2) < 0.12 && ny < 0.25);
      const isChevron2 = (nx > -0.45 && nx < -0.15 && Math.abs((ny + 0.05) + (nx + 0.3) * 1.2) < 0.12 && ny > -0.35);
      // Underscore cursor `_`
      const isCursor = (nx > 0.05 && nx < 0.45 && Math.abs(ny - 0.2) < 0.09);

      if (isChevron1 || isChevron2 || isCursor) {
        // Yellow #ffd500
        return [255, 213, 0, 255];
      }
      return [255, 255, 255, 255];
    }

    // Subtle yellow star / badge in top right
    const starDist = Math.hypot(nx - 0.75, ny + 0.75);
    if (starDist < 0.22) {
      return [255, 213, 0, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192, drawBrandIcon(false)));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512, drawBrandIcon(false)));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), createPng(512, 512, drawBrandIcon(true)));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPng(180, 180, drawBrandIcon(false)));
fs.writeFileSync(path.join('public', 'apple-touch-icon.png'), createPng(180, 180, drawBrandIcon(false)));

// Also create public/icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#e30613"/>
  <!-- Speech bubble -->
  <path d="M120 220 C120 140 180 90 260 90 C340 90 400 140 400 220 C400 300 340 350 260 350 C235 350 210 342 190 330 L135 365 C125 372 115 362 120 350 L128 318 C122 300 120 282 120 260 Z" fill="#ffffff"/>
  <!-- Prompt chevron > -->
  <path d="M185 180 L235 220 L185 260" stroke="#e30613" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Terminal cursor _ -->
  <path d="M260 260 L325 260" stroke="#ffd500" stroke-width="24" stroke-linecap="round" fill="none"/>
  <!-- Small spark -->
  <circle cx="395" cy="115" r="32" fill="#ffd500"/>
</svg>`;
fs.writeFileSync(path.join('public', 'icon.svg'), svg.trim());
console.log('Icons generated successfully.');
