#!/usr/bin/env node
import fs from 'fs/promises';
import { gunzipSync } from 'zlib';

function makeCrcTable(){
  const table = new Uint32Array(256);
  for(let i=0;i<256;i++){
    let c = i;
    for(let j=0;j<8;j++){
      if(c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();
function crc32OfBuffer(buf){
  let crc = 0xffffffff;
  for(let i=0;i<buf.length;i++){
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crc32HexOfString(s){
  const b = Buffer.from(s, 'utf8');
  return crc32OfBuffer(b).toString(16).padStart(8,'0');
}

async function main(){
  const argv = process.argv;
  if(argv.length < 3){
    console.error('Usage: node tools/decode-qr.mjs <scanned-lines-file>');
    process.exit(2);
  }
  const path = argv[2];
  const raw = await fs.readFile(path, 'utf8');
  const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const entries = new Map();
  const nSet = new Set();

  for(const line of lines){
    const parts = line.split('|');
    if(parts.length < 4){
      console.warn('Skipping malformed line:', line);
      continue;
    }

    const header = parts[0];
    const indexTotal = parts[1];
    const crc = parts[2].toLowerCase();
    const data = parts.slice(3).join('|');

    let i;
    let n;
    const slashMatch = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(indexTotal);
    if(slashMatch){
      i = Number(slashMatch[1]);
      n = Number(slashMatch[2]);
    } else {
      const iStr = parts[1];
      const nStr = parts[2];
      i = Number(iStr);
      n = Number(nStr);
      if(!Number.isInteger(i) || !Number.isInteger(n) || i<1 || n<1){
        console.warn('Skipping line with invalid indices:', line);
        continue;
      }
      if (header !== 'LQR1') {
        // old format with separate values in slots 1 and 2, but still validate
      }
    }

    if(!Number.isInteger(i) || !Number.isInteger(n) || i<1 || n<1){
      console.warn('Skipping line with invalid indices:', line);
      continue;
    }
    nSet.add(n);
    if(entries.has(i)){
      console.warn(`Duplicate chunk index ${i} - keeping first occurrence`);
      continue;
    }
    entries.set(i, {i,n,crc,data});
  }

  if(entries.size === 0){
    console.error('No valid QR lines parsed.');
    process.exit(2);
  }

  if(nSet.size > 1){
    console.error('Inconsistent total counts (n) across scanned lines:', Array.from(nSet).join(','));
    process.exit(2);
  }
  const n = Number(nSet.values().next().value);

  const missing = [];
  for(let k=1;k<=n;k++) if(!entries.has(k)) missing.push(k);
  if(missing.length > 0){
    console.error('Missing chunk indices:', missing.join(', '));
    process.exit(2);
  }

  // verify CRCs
  for(const [idx, entry] of entries){
    const computed = crc32HexOfString(entry.data);
    if(computed !== entry.crc.toLowerCase()){
      console.warn(`CRC mismatch for chunk ${idx}: expected ${entry.crc} computed ${computed} (bad scan?)`);
    }
  }

  const ordered = Array.from(entries.keys()).sort((a,b)=>a-b).map(k=>entries.get(k));
  const concatBase64 = ordered.map(e=>e.data).join('');

  let decodedBuf;
  try{
    decodedBuf = Buffer.from(concatBase64, 'base64');
  }catch(e){
    // If base64 decode fails, treat concatenated data as UTF-8 plain text
    decodedBuf = Buffer.from(concatBase64, 'utf8');
  }

  let outBuf;
  try{
    outBuf = gunzipSync(decodedBuf);
  }catch(e){
    // treat decodedBuf as already-plain UTF-8 text
    outBuf = decodedBuf;
  }

  await fs.writeFile('changes.patch', outBuf);
  const size = outBuf.length;
  console.log(`Wrote changes.patch (${size} bytes). Next: git apply --3way changes.patch`);
}

main().catch(err=>{
  console.error('Error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
