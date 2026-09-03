const fs = require('fs');

const source = 'assets/yfa-intro-mobile.webp';
const destination = 'assets/yfa-intro-mobile-fast.webp';
const speed = 1.45;
const data = fs.readFileSync(source);

if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
  throw new Error('The source is not a WebP file.');
}

let offset = 12;
let frames = 0;
while (offset + 8 <= data.length) {
  const chunk = data.toString('ascii', offset, offset + 4);
  const size = data.readUInt32LE(offset + 4);
  const payload = offset + 8;
  if (chunk === 'ANMF' && size >= 16) {
    const durationOffset = payload + 12;
    const duration = data[durationOffset] | (data[durationOffset + 1] << 8) | (data[durationOffset + 2] << 16);
    const faster = Math.max(20, Math.round(duration / speed));
    data[durationOffset] = faster & 0xff;
    data[durationOffset + 1] = (faster >> 8) & 0xff;
    data[durationOffset + 2] = (faster >> 16) & 0xff;
    frames += 1;
  }
  offset += 8 + size + (size % 2);
}

fs.writeFileSync(destination, data);
console.log(`Created ${destination}: ${frames} frames at ${speed}x speed`);
