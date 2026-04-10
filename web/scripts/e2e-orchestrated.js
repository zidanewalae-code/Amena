// Orchestrates end-to-end execution: seed backend, start services, run Playwright, print summary.
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const rootDir = path.resolve(__dirname, '..', '..');
const backendDir = path.join(rootDir, 'backend');
const webDir = path.join(rootDir, 'web');

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      shell: true,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });

    let stdout = '';
    let stderr = '';

    if (options.capture) {
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        process.stdout.write(text);
      });
      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        process.stderr.write(text);
      });
    }

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function startService(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    shell: true,
    stdio: 'inherit'
  });
  return child;
}

function waitForUrl(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    function ping() {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}`));
          return;
        }

        setTimeout(ping, 1000);
      });

      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}`));
          return;
        }
        setTimeout(ping, 1000);
      });
    }

    ping();
  });
}

async function main() {
  const summary = {
    seed: 'pending',
    backend: 'pending',
    web: 'pending',
    playwright: 'pending',
    passed: 0,
    failed: 0,
    errors: []
  };

  let backendProc = null;
  let webProc = null;

  try {
    console.log('\n[1/5] Seed reset backend...');
    const seedResult = await runCommand('npm', ['run', 'seed:reset'], { cwd: backendDir, capture: true });
    if (seedResult.code !== 0) {
      summary.seed = 'failed';
      summary.errors.push('Seed reset failed');
      throw new Error('Seed reset failed');
    }
    summary.seed = 'ok';

    console.log('\n[2/5] Start backend server...');
    backendProc = startService('npm', ['start'], {
      cwd: backendDir,
      env: {
        ...process.env,
        APP_ENV: process.env.APP_ENV || 'e2e'
      }
    });
    await waitForUrl('http://localhost:5000/api/health', 90000);
    summary.backend = 'ok';

    console.log('\n[3/5] Start web server...');
    webProc = startService('npm', ['start'], {
      cwd: webDir,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
      }
    });
    await waitForUrl('http://localhost:3000', 90000);
    summary.web = 'ok';

    console.log('\n[4/5] Run Playwright tests...');
    const pwResult = await runCommand('npx', ['playwright', 'test', '--reporter=json'], {
      cwd: webDir,
      env: {
        ...process.env,
        E2E_API_BASE_URL: process.env.E2E_API_BASE_URL || 'http://localhost:5000',
        E2E_PAYMENT_WEBHOOK_SECRET: process.env.E2E_PAYMENT_WEBHOOK_SECRET || 'change_me'
      },
      capture: true
    });

    if (pwResult.code !== 0) {
      summary.playwright = 'failed';
    } else {
      summary.playwright = 'ok';
    }

    try {
      const jsonStart = pwResult.stdout.indexOf('{');
      const json = jsonStart >= 0 ? JSON.parse(pwResult.stdout.slice(jsonStart)) : null;
      if (json?.stats) {
        summary.passed = Number(json.stats.expected || 0);
        summary.failed = Number(json.stats.unexpected || 0);
        if (Number(json.stats.flaky || 0) > 0) {
          summary.errors.push(`Flaky tests: ${json.stats.flaky}`);
        }
      }
    } catch (error) {
      summary.errors.push(`Playwright summary parse failed: ${error.message}`);
    }

    if (pwResult.code !== 0) {
      summary.errors.push('Playwright returned non-zero exit code');
      throw new Error('Playwright failed');
    }

    console.log('\n[5/5] E2E orchestration completed.');
  } catch (error) {
    summary.errors.push(error.message);
  } finally {
    if (webProc && !webProc.killed) webProc.kill();
    if (backendProc && !backendProc.killed) backendProc.kill();

    console.log('\n=== E2E Orchestrated Summary ===');
    console.log(`Seed: ${summary.seed}`);
    console.log(`Backend: ${summary.backend}`);
    console.log(`Web: ${summary.web}`);
    console.log(`Playwright: ${summary.playwright}`);
    console.log(`Tests passed: ${summary.passed}`);
    console.log(`Tests failed: ${summary.failed}`);

    if (summary.errors.length) {
      console.log('Errors:');
      summary.errors.forEach((err) => console.log(`- ${err}`));
      process.exit(1);
    }

    console.log('No errors detected.');
    process.exit(0);
  }
}

main();
