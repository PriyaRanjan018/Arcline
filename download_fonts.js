const fs = require('fs');
const https = require('https');
const path = require('path');

const fonts = [
  {
    name: 'Outfit',
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400..800&display=swap'
  },
  {
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap'
  },
  {
    name: 'IBMPlexMono',
    url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap'
  }
];

const downloadWoff2 = (cssUrl, name) => {
  return new Promise((resolve, reject) => {
    https.get(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = [...data.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)];
        if (matches.length === 0) {
          console.log(`No woff2 found for ${name}`);
          resolve();
          return;
        }
        // Just take the first one (for variable fonts usually just 1 latin subset, or we can download all)
        // Let's find the latin one if possible, usually the last one in the file for google fonts is latin
        const latinMatch = data.split('/* latin */');
        let fontUrl = matches[0][1];
        if (latinMatch.length > 1) {
          const latinCss = latinMatch[1];
          const urlMatch = latinCss.match(/url\((https:\/\/[^)]+\.woff2)\)/);
          if (urlMatch) fontUrl = urlMatch[1];
        }

        const destPath = path.join(__dirname, 'public', 'fonts', `${name}.woff2`);
        const file = fs.createWriteStream(destPath);
        https.get(fontUrl, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${name}.woff2`);
            resolve();
          });
        }).on('error', reject);
      });
    }).on('error', reject);
  });
};

(async () => {
  if (!fs.existsSync('./public/fonts')) fs.mkdirSync('./public/fonts', { recursive: true });
  for (const font of fonts) {
    await downloadWoff2(font.url, font.name).catch(console.error);
  }
})();
