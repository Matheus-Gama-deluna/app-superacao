const https = require('https');
const { execSync } = require('child_process');

function getGitToken() {
  try {
    const credOutput = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8'
    });
    for (const line of credOutput.split('\n')) {
      if (line.startsWith('password=')) return line.substring('password='.length).trim();
    }
  } catch (e) {}
  return process.env.GITHUB_TOKEN || null;
}

const prNumber = process.argv[2] || '4';
const token = getGitToken();

const payload = JSON.stringify({
  commit_title: `Merge pull request #${prNumber} from Matheus-Gama-deluna/feat/visual-redesign-ritmo-natural`,
  commit_message: `Redesign visual 'Ritmo Natural' (Sprints 1 a 6) convergindo motivacao adaptativa, ergonomia mobile 390x844 e integridade de dados.`,
  merge_method: 'merge'
});

const req = https.request({
  hostname: 'api.github.com',
  path: `/repos/Matheus-Gama-deluna/app-superacao/pulls/${prNumber}/merge`,
  method: 'PUT',
  headers: {
    'User-Agent': 'Node-Agent',
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Merge response:', data);
    } catch (e) {
      console.error(e, body);
    }
  });
});
req.on('error', e => console.error(e));
req.write(payload);
req.end();
