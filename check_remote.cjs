const { Client } = require('ssh2');
const HOST = '217.154.175.96', USER = 'root', PASS = '3qA9lQnA';
function exec(conn, cmd) {
  return new Promise((r, j) => conn.exec(cmd, (e, s) => {
    if (e) return j(e);
    let o = ''; s.on('data', d => o += d); s.stderr.on('data', d => o += d);
    s.on('close', c => r({ o: o.trim(), c }));
  }));
}
(async () => {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j); conn.connect({ host: HOST, username: USER, password: PASS }); });
  for (const cmd of [
    'cd /tmp/webptm && git log --oneline -3',
    'ls -la /opt/research-portal/webptm/data/RTI3/rti_raking_N.jpg',
    'sha256sum /opt/research-portal/webptm/data/RTI3/rti_raking_N.jpg',
    'ls -la /tmp/webptm/public/data/RTI3/rti_raking_N.jpg',
    'sha256sum /tmp/webptm/public/data/RTI3/rti_raking_N.jpg',
    'ls -la /tmp/webptm/dist/data/RTI3/rti_raking_N.jpg 2>&1 || echo no dist file',
    'docker exec server-deployment-nginx-1 sha256sum /usr/share/nginx/webptm/data/RTI3/rti_raking_N.jpg',
  ]) {
    console.log('> ' + cmd);
    const r = await exec(conn, cmd);
    console.log(r.o + '\n');
  }
  conn.end();
})().catch(e => { console.error(e); process.exit(1); });
