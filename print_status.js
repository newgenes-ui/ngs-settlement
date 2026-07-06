const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/newgenes-ui/ngs-settlement/deployments/5293320643/statuses',
  headers: {
    'User-Agent': 'NodeJS-Agent'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error(e);
      console.log(data);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
