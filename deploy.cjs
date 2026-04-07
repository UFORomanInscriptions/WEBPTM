const { Client } = require('ssh2');

const HOST = '217.154.175.96';
const USER = 'root';
const PASS = '3qA9lQnA';

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

  // Install Node.js if needed, clone repo, build, deploy
  const commands = [
    // Install git-lfs and Node if missing
    'apt-get update -qq && apt-get install -y -qq git git-lfs curl > /dev/null 2>&1 && echo "packages ok"',
    'which node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1 && apt-get install -y nodejs > /dev/null 2>&1) && node --version',
    // Clone repo
    'rm -rf /tmp/webptm && git clone https://github.com/UFORomanInscriptions/WEBPTM.git /tmp/webptm 2>&1',
    // Install & build
    'cd /tmp/webptm && npm install 2>&1 | tail -3',
    'cd /tmp/webptm && npm run build 2>&1',
    // Deploy to nginx webroot (skip huge PTM/RTI/PLY files)
    'rm -rf /var/www/html/*',
    'cd /tmp/webptm/dist && find . -name "*.ptm" -o -name "*.rti" -o -name "*.ply" | xargs rm -f 2>/dev/null; cp -r . /var/www/html/ && echo "Files deployed"',
    'ls -la /var/www/html/',
    // Configure nginx
    `cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html;
    server_name _;
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
    location ~* \\.(jpg|jpeg|png|gif|ico|svg|css|js|woff2?|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;
}
EOF`,
    'nginx -t 2>&1',
    'systemctl reload nginx 2>&1 && echo "nginx reloaded"',
    // Cleanup
    'rm -rf /tmp/webptm && echo "cleanup done"',
  ];

  for (const cmd of commands) {
    const result = await exec(conn, cmd);
    console.log('');
    if (result.code !== 0 && !cmd.includes('which node')) {
      console.error(`Command failed with code ${result.code}`);
    }
  }

  conn.end();
  console.log(`\nDone! Site is live at http://${HOST}/`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
