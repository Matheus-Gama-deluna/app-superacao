#!/usr/bin/env node
/**
 * scripts/create_pr.cjs
 * Cria automaticamente uma Pull Request no GitHub para a branch atual.
 *
 * Uso:
 *   node scripts/create_pr.cjs "Titulo da PR" "Descricao da PR" [baseBranch]
 */

const https = require('https');
const { execSync } = require('child_process');

function getGitToken() {
  try {
    const credOutput = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8'
    });
    for (const line of credOutput.split('\n')) {
      if (line.startsWith('password=')) {
        return line.substring('password='.length).trim();
      }
    }
  } catch (err) {
    console.error('Erro ao consultar Git Credential Manager:', err.message);
  }
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
}

function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
}

const headBranch = getCurrentBranch();
const baseBranch = process.argv[4] || 'main';
const title = process.argv[2] || `feat: melhorias na branch ${headBranch}`;
const body = process.argv[3] || 'Pull Request criada automaticamente pelo fluxo de integridade do Superacao.';

if (headBranch === baseBranch) {
  console.error(`Erro: A branch atual (${headBranch}) e igual a branch base (${baseBranch}). Crie uma feature branch primeiro.`);
  process.exit(1);
}

const token = getGitToken();
if (!token) {
  console.error('Erro: Nao foi possivel obter o token de autenticacao do GitHub.');
  process.exit(1);
}

const payload = JSON.stringify({
  title,
  body,
  head: headBranch,
  base: baseBranch
});

const req = https.request({
  hostname: 'api.github.com',
  path: '/repos/Matheus-Gama-deluna/app-superacao/pulls',
  method: 'POST',
  headers: {
    'User-Agent': 'Superacao-Automation-Script',
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      if (res.statusCode === 201) {
        console.log('\n========================================');
        console.log('✅ Pull Request criada com sucesso!');
        console.log(`🔗 URL: ${parsed.html_url}`);
        console.log(`📌 Numero: #${parsed.number}`);
        console.log('========================================\n');
      } else {
        console.error(`\n❌ Falha ao criar PR (Status ${res.statusCode}):`);
        console.error(JSON.stringify(parsed, null, 2));
      }
    } catch {
      console.log('Resposta:', responseData);
    }
  });
});

req.on('error', (err) => {
  console.error('Erro de conexao HTTP:', err.message);
});

req.write(payload);
req.end();
