import sharp from 'sharp'

const source = 'src/assets/gurukul.png'

await sharp(source)
  .resize(192, 192, { fit: 'contain', background: '#00000000' })
  .toFile('public/pwa-192x192.png')

await sharp(source)
  .resize(512, 512, { fit: 'contain', background: '#00000000' })
  .toFile('public/pwa-512x512.png')

await sharp(source)
  .resize(410, 410, { fit: 'contain', background: '#00000000' })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#9b001c' })
  .toFile('public/pwa-maskable-512x512.png')

await sharp(source)
  .resize(180, 180, { fit: 'contain', background: '#ffffff' })
  .toFile('public/apple-touch-icon.png')

console.log('Icons created in public/')