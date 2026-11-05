import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8f6f1"/>
      <stop offset="1" stop-color="#f2eee5"/>
    </linearGradient>
    <radialGradient id="warm" cx="0.82" cy="0.02" r="0.7">
      <stop offset="0" stop-color="#f6e4d2" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#f6e4d2" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cool" cx="0.05" cy="1" r="0.7">
      <stop offset="0" stop-color="#dfe8e0" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#dfe8e0" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#161513" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#warm)"/>
  <rect width="1200" height="630" fill="url(#cool)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <text x="88" y="120" font-family="DejaVu Sans Mono, monospace" font-size="21" letter-spacing="7" fill="#8b887f">XULIN · NOTES</text>
  <text x="1112" y="126" text-anchor="end" font-family="Noto Sans CJK SC, Noto Sans SC, sans-serif" font-weight="bold" font-size="46" fill="#2c6a5d">徐淋</text>

  <text x="82" y="360" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="176" letter-spacing="6" fill="#161513">XULIN</text>

  <rect x="88" y="398" width="104" height="6" rx="3" fill="#2c6a5d"/>

  <text x="88" y="470" font-family="DejaVu Sans, sans-serif" font-size="33" fill="#55534d">Linux application · ZYNQ · Embedded Linux</text>
  <text x="88" y="524" font-family="DejaVu Sans Mono, monospace" font-size="19" letter-spacing="3" fill="#8b887f">NOTES · POSTS · REFERENCES</text>

  <text x="1112" y="552" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="17" letter-spacing="2" fill="#2c6a5d">XULIN · 2026</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('og.png written');
