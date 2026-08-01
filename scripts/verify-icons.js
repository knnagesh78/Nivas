import fs from 'fs';
['public/icon-192.png', 'public/icon-512.png'].forEach(f => {
  const b = fs.readFileSync(f);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  console.log(f + ': ' + b.length + ' bytes, ' + w + 'x' + h + 'px');
});
