const { Client } = require('ssh2');

const HOST = '217.154.175.96';
const USER = 'root';
const PASS = '3qA9lQnA';
const WEBPTM_DIR = '/opt/research-portal/webptm';
const NGINX_CONF = '/opt/research-portal/server-deployment/nginx/default.conf';

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d); });
      stream.stderr.on('data', d => { out += d; process.stderr.write(d); });
      stream.on('close', (code) => resolve({ out: out.trim(), code }));
    });
  });
}

async function main() {
  console.log('Connecting to VPS...');
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject);
    conn.connect({ host: HOST, username: USER, password: PASS });
  });
  console.log('Connected!\n');

  const commands = [
    // Preserve any large PTMs previously scp'd to the VPS (e.g. rti_altar_ohne_inschrift.ptm)
    `mkdir -p /tmp/webptm-preserve && (cd ${WEBPTM_DIR} 2>/dev/null && find . -name "rti_altar_ohne_inschrift.ptm" -exec cp --parents {} /tmp/webptm-preserve/ \\;) 2>/dev/null; echo "preserve done"`,
    // 1. Wipe webptm dir and fresh clone+build (force latest main, include LFS objects)
    `rm -rf ${WEBPTM_DIR} /tmp/webptm && mkdir -p ${WEBPTM_DIR}`,
    `git clone --branch main https://github.com/UFORomanInscriptions/WEBPTM.git /tmp/webptm 2>&1 && cd /tmp/webptm && (git lfs pull 2>&1 || true) && npm install 2>&1 && npm run build 2>&1`,
    // Copy built dist (keep ptm/rti in the build output)
    `cp -r /tmp/webptm/dist/. ${WEBPTM_DIR}/ && echo "Files copied to ${WEBPTM_DIR}"`,
    // Restore preserved large PTM(s)
    `if [ -d /tmp/webptm-preserve/. ]; then cp -rvn /tmp/webptm-preserve/. ${WEBPTM_DIR}/ 2>&1 || true; fi; rm -rf /tmp/webptm-preserve`,
    `ls ${WEBPTM_DIR}/`,
    `du -sh ${WEBPTM_DIR}/`,

    // 2. Add volume mount to docker-compose for nginx
    // First check current docker-compose
    `cat /opt/research-portal/server-deployment/docker-compose.yml | grep -A 20 'nginx:'`,

    // 3. Add volume mount for webptm to nginx container
    `grep -q 'webptm' /opt/research-portal/server-deployment/docker-compose.yml || sed -i '/default.conf:ro/a\\      - /opt/research-portal/webptm:/usr/share/nginx/webptm:ro' /opt/research-portal/server-deployment/docker-compose.yml`,

    // 4. Add location block to nginx config (before the catch-all "/" location)
    `grep -q '/rti' ${NGINX_CONF} || sed -i '/# Portal: Landing page/i\\    # WEBPTM RTI Viewer\\n    location /rti/ {\\n        alias /usr/share/nginx/webptm/;\\n        index index.html;\\n        try_files \\$uri \\$uri/ /rti/index.html;\\n    }\\n\\n    location /rti {\\n        return 301 /rti/;\\n    }\\n' ${NGINX_CONF}`,

    // 5. Verify nginx config
    `cat ${NGINX_CONF} | grep -A 8 'WEBPTM'`,

    // 6. Restart nginx container to pick up new config and volume
    `cd /opt/research-portal/server-deployment && docker compose down nginx 2>&1 && docker compose up -d nginx 2>&1`,

    // 7. Verify
    `docker exec server-deployment-nginx-1 ls /usr/share/nginx/webptm/ 2>/dev/null || echo "volume not mounted yet"`,
    `docker exec server-deployment-nginx-1 nginx -t 2>&1`,
    `curl -s -o /dev/null -w "%{http_code}" http://localhost/rti/`,
  ];

  for (const cmd of commands) {
    const result = await exec(conn, cmd);
    console.log('\n');
    if (result.code !== 0) {
      console.error(`  (exit code: ${result.code})\n`);
    }
  }

  conn.end();
  console.log(`\nDone! Site should be live at http://${HOST}/rti/`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
