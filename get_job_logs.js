const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'api.github.com',
  path: '/repos/newgenes-ui/ngs-settlement/actions/jobs/84909943507/logs',
  headers: {
    'User-Agent': 'NodeJS-Agent'
  }
};

https.get(options, (res) => {
  if (res.statusCode === 302) {
    // Redirect
    const redirectUrl = res.headers.location;
    console.log(`Redirecting to: ${redirectUrl}`);
    https.get(redirectUrl, (res2) => {
      let logData = '';
      res2.on('data', (chunk) => { logData += chunk; });
      res2.on('end', () => {
        fs.writeFileSync('job_logs.txt', logData, 'utf8');
        console.log('Saved job logs to job_logs.txt');
      });
    });
  } else {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`Failed to get logs. Status code: ${res.statusCode}`);
      console.log(data);
    });
  }
}).on('error', (e) => {
  console.error(e);
});
