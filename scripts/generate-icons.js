import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = 'C:/Users/Dell/.gemini/antigravity-ide/brain/9e8c6e65-27f1-456f-bd28-80d53be0a406/.user_uploaded/media_1788602643618.jpg';
const publicDir = path.join(__dirname, '..', 'public');

async function run() {
  console.log('Reading input image from:', inputPath);

  // 1. Generate icon-512.png
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created public/icon-512.png');

  // 2. Generate icon-192.png
  await sharp(inputPath)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created public/icon-192.png');

  // 3. Generate favicon.png
  await sharp(inputPath)
    .resize(64, 64, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created public/favicon.png');

  // 4. Generate logo.png
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ Created public/logo.png');

  // 5. Generate SVG wrappers (logo.svg, favicon.svg)
  const png512Buffer = await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();
  const base64Png = png512Buffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,${base64Png}" xlink:href="data:image/png;base64,${base64Png}"/>
</svg>
`;

  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf8');
  console.log('✓ Created public/logo.svg');

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('✓ Created public/favicon.svg');

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
