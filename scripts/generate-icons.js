const fs = require('fs');
const path = require('path');

// Simple colored PNG generator (creates a valid minimal PNG)
function createPNG(size, outputPath) {
  // This creates a simple colored square PNG
  // For a production app, you'd want to use sharp or canvas

  // Gradient colors from our palette
  const color1 = [244, 198, 195]; // Fairy Tale Dream
  const color2 = [168, 216, 185]; // Sweet Mint

  // PNG file structure
  const png = [];

  // PNG signature
  png.push(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);

  // IHDR chunk
  const ihdr = [];
  ihdr.push(...intToBytes(size, 4)); // width
  ihdr.push(...intToBytes(size, 4)); // height
  ihdr.push(8); // bit depth
  ihdr.push(2); // color type (RGB)
  ihdr.push(0); // compression
  ihdr.push(0); // filter
  ihdr.push(0); // interlace

  png.push(...createChunk('IHDR', ihdr));

  // IDAT chunk (image data)
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      // Simple gradient effect
      const t = (x + y) / (2 * size);
      const r = Math.round(color1[0] * (1 - t) + color2[0] * t);
      const g = Math.round(color1[1] * (1 - t) + color2[1] * t);
      const b = Math.round(color1[2] * (1 - t) + color2[2] * t);
      rawData.push(r, g, b);
    }
  }

  // Compress with zlib (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  png.push(...createChunk('IDAT', [...compressed]));

  // IEND chunk
  png.push(...createChunk('IEND', []));

  fs.writeFileSync(outputPath, Buffer.from(png));
  console.log(`Created ${outputPath}`);
}

function intToBytes(num, bytes) {
  const result = [];
  for (let i = bytes - 1; i >= 0; i--) {
    result.push((num >> (i * 8)) & 0xFF);
  }
  return result;
}

function createChunk(type, data) {
  const chunk = [];

  // Length
  chunk.push(...intToBytes(data.length, 4));

  // Type
  for (let i = 0; i < 4; i++) {
    chunk.push(type.charCodeAt(i));
  }

  // Data
  chunk.push(...data);

  // CRC
  const crcData = [...type.split('').map(c => c.charCodeAt(0)), ...data];
  const crc = crc32(crcData);
  chunk.push(...intToBytes(crc >>> 0, 4));

  return chunk;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return crc ^ 0xFFFFFFFF;
}

// Generate icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  createPNG(size, path.join(iconsDir, `icon-${size}.png`));
});

// Create apple touch icon (same as 180px)
createPNG(180, path.join(iconsDir, 'apple-touch-icon.png'));

// Create favicon.ico (simple redirect, in practice you'd create a proper .ico)
createPNG(32, path.join(__dirname, '..', 'public', 'favicon.png'));

console.log('Icons generated successfully!');
