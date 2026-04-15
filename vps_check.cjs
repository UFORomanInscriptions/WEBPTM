const { Client } = require('ssh2');
const HOST = '217.154.175.96', USER = 'root', PASS = '3qA9lQnA';
function exec(conn, cmd, timeout=1800000) {
  return new Promise((r, j) => conn.exec(cmd, (e, s) => {
    if (e) return j(e);
    let o = ''; const t = setTimeout(() => { s.close(); r({o, c: -1}); }, timeout);
    s.on('data', d => { o += d; process.stdout.write(d); });
    s.stderr.on('data', d => { o += d; process.stderr.write(d); });
    s.on('close', c => { clearTimeout(t); r({ o: o.trim(), c }); });
  }));
}
(async () => {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j); conn.connect({ host: HOST, username: USER, password: PASS, readyTimeout: 120000, keepaliveInterval: 30000 }); });
  const cmds = process.argv.slice(2).length ? [process.argv.slice(2).join(' ')] : [
    'cat /etc/os-release | head -3',
    'which cmake make g++ git qmake 2>&1',
    'apt list --installed 2>/dev/null | grep -iE "libjpeg|libtiff|libpng|qt|eigen" | head',
    'relight-cli --help 2>&1 | head -3 || echo "not installed"',
    'df -h / | tail -1',
    'nproc',
  ];
  for (const cmd of cmds) {
    console.log(`\n> ${cmd}`);
    await exec(conn, cmd);
  }
  conn.end();
})().catch(e => { console.error(e); process.exit(1); });
