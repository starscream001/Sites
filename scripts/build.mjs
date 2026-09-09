import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'schedule.js', 'schedule-data.js', 'favicon.svg']) {
  await copyFile(name, `dist/${name}`);
}
console.log('Static build ready.');
