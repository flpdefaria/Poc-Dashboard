const { createRequire } = require('module');
const req = createRequire('/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/package.json');
const { PNG } = req('pngjs'); const fs = require('fs');
const [refP, actP, x, y, w, h, s, out] = process.argv.slice(2); const X=+x,Y=+y,W=+w,H=+h,S=+s;
const a = PNG.sync.read(fs.readFileSync(refP)), b = PNG.sync.read(fs.readFileSync(actP));
const o = new PNG({ width: W*S*2+10, height: H*S }); o.data.fill(255);
for (const [img, off] of [[a,0],[b,W*S+10]]) for (let j=0;j<H*S;j++) for (let i=0;i<W*S;i++){ const si=((Y+Math.floor(j/S))*img.width+(X+Math.floor(i/S)))*4, di=(j*o.width+off+i)*4; for(let k=0;k<4;k++) o.data[di+k]=img.data[si+k]; }
fs.writeFileSync(out, PNG.sync.write(o));
