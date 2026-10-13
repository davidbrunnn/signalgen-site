// Sobe um arquivo para o Vercel Blob com o SDK oficial (o mesmo do site). Uso:
//   BLOB_READ_WRITE_TOKEN=... node scripts/blob-put.mjs <arquivo> <pathname> <random:1|0> [content-type]
// Imprime a url na última linha. Arquivos > 20 MB vão em multipart.
import { put } from '@vercel/blob';
import fs from 'fs';
const [file, pathname, random = '1', ct] = process.argv.slice(2);
const size = fs.statSync(file).size;
const body = size > 20 * 1048576 ? fs.createReadStream(file) : fs.readFileSync(file);
try {
  const r = await put(pathname, body, {
    access: 'public', addRandomSuffix: random === '1', allowOverwrite: random !== '1', contentType: ct || undefined,
    cacheControlMaxAge: random === '1' ? 31536000 : 60, multipart: size > 20 * 1048576,
  });
  console.log(r.url);
} catch (e) { console.error('BLOB_ERRO', e?.message || e); process.exit(1); }
