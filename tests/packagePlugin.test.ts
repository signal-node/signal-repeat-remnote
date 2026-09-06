import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('plugin package archive', () => {
  it('derives the archive name from the package version', () => {
    const projectRoot = process.cwd();
    const packageJson = JSON.parse(
      readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
    ) as { version: string };

    const archiveName = execFileSync(
      process.execPath,
      [path.join(projectRoot, 'scripts/package-plugin.cjs'), '--print-name'],
      { encoding: 'utf8' },
    ).trim();

    expect(archiveName).toBe(`signal-repeat-remnote-v${packageJson.version}.zip`);
  });
});
