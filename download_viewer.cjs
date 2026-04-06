const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err.message);
    });
  });
};

(async () => {
  const dir = path.join(__dirname, 'public', 'js');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  console.log("Downloading spidergl.js...");
  await download('https://raw.githubusercontent.com/jcupitt/webRTIViewer/master/spidergl.js', path.join(dir, 'spidergl.js'));
  
  console.log("Downloading webrtiviewer.js...");
  await download('https://raw.githubusercontent.com/jcupitt/webRTIViewer/master/webrtiviewer.js', path.join(dir, 'webrtiviewer.js'));
  
  console.log("Done!");
})();