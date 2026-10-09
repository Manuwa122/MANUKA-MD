import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
for (const file of readdirSync('src').filter(x => x.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', `src/${file}`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('All source files passed syntax checks.');
