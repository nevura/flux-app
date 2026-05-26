import sharp from 'sharp'
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.join(__dirname, '../public')

const BLUE = '#007AFF'

// Font Awesome fa-wallet path (512×512 viewBox)
const WALLET_PATH = `M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16H448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zm368 304a32 32 0 1 1 0-64 32 32 0 0 1 0 64z`

function iconSVG(size) {
  const rx = Math.round(size * 0.22)
  const iconSize = Math.round(size * 0.56)
  const pad = Math.round((size - iconSize) / 2)
  const scale = iconSize / 512

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${BLUE}"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">
    <path fill="white" d="${WALLET_PATH}"/>
  </g>
</svg>`
}

const sizes = [
  { file: 'icon-192.png',        size: 192 },
  { file: 'icon-512.png',        size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32.png',      size: 32  },
]

for (const { file, size } of sizes) {
  const svg = Buffer.from(iconSVG(size))
  await sharp(svg).png().toFile(path.join(PUBLIC, file))
  console.log(`✓ ${file} (${size}×${size})`)
}
