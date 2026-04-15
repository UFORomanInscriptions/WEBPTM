const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '217.154.175.96', USER = 'root', PASS = '3qA9lQnA';
const LOCAL_DIR = path.join(__dirname, 'public', 'data', 'RTI3', 'relight_altar');
const REMOTE_DIR = '/opt/research-portal/webptm/data/RTI3/relight_altar';

function exec(conn, cmd) {
  return new Promise((res, rej) => conn.exec(cmd, (e, s) => {
    if (e) return rej(e);
    let o = '';
    s.on('data', d => o += d);
    s.stderr.on('data', d => o += d);
    s.on('close', c => res({ o: o.trim(), c }));
  }));
}

async function main() {
  const files = fs.readdirSync(LOCAL_DIR);
  console.log(`Files to upload: ${files.length}`);

  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j); conn.connect({ host: HOST, username: USER, password: PASS, readyTimeout: 60000 }); });
  console.log('Connected.');

  await exec(conn, `mkdir -p ${REMOTE_DIR} && rm -f ${REMOTE_DIR}/*`);

  const sftp = await new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s)));

  for (const f of files) {
    const local = path.join(LOCAL_DIR, f);
    const remote = `${REMOTE_DIR}/${f}`;
    const size = fs.statSync(local).size;
    process.stdout.write(`  ${f} (${(size/1024/1024).toFixed(1)} MB)... `);
    const start = Date.now();
    await new Promise((r, j) => sftp.fastPut(local, remote, e => e ? j(e) : r()));
    console.log(`${((Date.now()-start)/1000).toFixed(1)}s`);
  }

  const ls = await exec(conn, `ls -la ${REMOTE_DIR} | tail -10 && du -sh ${REMOTE_DIR}`);
  console.log(ls.o);

  conn.end();
}
main().catch(e => { console.error(e); process.exit(1); });
