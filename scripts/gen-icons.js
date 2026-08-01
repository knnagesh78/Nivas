import sharp from 'sharp';
import path from 'path';

const src = path.join(
  'C:', 'Users', 'Dell', '.gemini', 'antigravity-ide', 'brain',
  '4dce7dd0-108f-49cb-a1ba-d686d13862eb',
  'nivas_pwa_icon_1785603460627.png'
);

async function generate() {
  const info192 = await sharp(src).resize(192, 192).toFile('public/icon-192.png');
  console.log('icon-192.png:', info192.width + 'x' + info192.height, info192.size + ' bytes');

  const info512 = await sharp(src).resize(512, 512).toFile('public/icon-512.png');
  console.log('icon-512.png:', info512.width + 'x' + info512.height, info512.size + ' bytes');

  console.log('Done! Icons generated successfully.');
}

generate().catch(console.error);
