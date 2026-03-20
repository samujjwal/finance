const { execSync } = require('child_process'); try { execSync('npx playwright test --reporter=list', { stdio: 'inherit' }); } catch (e) { console.error('Tests failed'); process.exit(1); }
