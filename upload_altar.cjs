const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '217.154.175.96';
const USER = 'root';
const PASS = '3qA9lQnA';
const LOCAL = path.join(__dirname, 'public', 'data', 'RTI3', 'rti_altar_ohne_inschrift.ptm');
const REMOTE = '/opt/research-portal/webptm/data/RTI3/rti_altar_ohne_inschrift.ptm';

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', code => resolve({ out: out.trim(), code }));
    });
  });
}

async function main() {
  const size = fs.statSync(LOCAL).size;
  console.log(`Local: ${LOCAL}`);
  console.log(`Size: ${(size / 1024 / 1024).toFixed(1)} MB`);

  const conn = new Client();
  await new Promise((res, rej) => {
    conn.on('ready', res).on('error', rej);
    conn.connect({ host: HOST, username: USER, password: PASS });
  });
  console.log('Connected.');

  await exec(conn, `mkdir -p ${path.posix.dirname(REMOTE)}`);

  const sftp = await new Promise((res, rej) => {
    conn.sftp((err, s) => err ? rej(err) : res(s));
  });

  console.log('Uploading...');
  const start = Date.now();
  let lastPct = -1;
  await new Promise((res, rej) => {
    sftp.fastPut(LOCAL, REMOTE, {
      step: (transferred, _chunk, total) => {
        const pct = Math.floor((transferred / total) * 100);
        if (pct !== lastPct && pct % 5 === 0) {
          lastPct = pct;
          process.stdout.write(`  ${pct}% (${(transferred / 1024 / 1024).toFixed(1)} MB)\n`);
        }
      }
    }, err => err ? rej(err) : res());
  });
  const dur = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Upload done in ${dur}s.`);

  const verify = await exec(conn, `ls -la ${REMOTE} && sha256sum ${REMOTE}`);
  console.log(verify.out);

  const httpCheck = await exec(conn, `curl -s -o /dev/null -w "%{http_code} %{size_download}" -r 0-0 http://localhost/rti/data/RTI3/rti_altar_ohne_inschrift.ptm`);
  console.log(`HTTP check: ${httpCheck.out}`);

  conn.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
