const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/newgenes-ui/ngs-settlement/actions/runs/28631740800/jobs',
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
      for (const job of json.jobs) {
        console.log(`Job: ${job.name}, ID: ${job.id}, Conclusion: ${job.conclusion}`);
      }
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
