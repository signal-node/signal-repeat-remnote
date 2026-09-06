#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const bestzip = require('bestzip');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));
const archiveBaseName = 'signal-repeat-remnote';
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function getArchiveName() {
  if (typeof packageJson.version !== 'string' || !semverPattern.test(packageJson.version)) {
    throw new Error(`Invalid package version: ${String(packageJson.version)}`);
  }

  return `${archiveBaseName}-v${packageJson.version}.zip`;
}

async function packagePlugin() {
  const distDirectory = path.join(projectRoot, 'dist');
  const archiveName = getArchiveName();
  const archivePath = path.join(projectRoot, archiveName);

  if (!fs.existsSync(distDirectory) || !fs.statSync(distDirectory).isDirectory()) {
    throw new Error('dist directory does not exist; run the production build first.');
  }

  fs.rmSync(archivePath, { force: true });
  fs.rmSync(path.join(projectRoot, 'PluginZip.zip'), { force: true });

  await bestzip({
    cwd: distDirectory,
    source: ['*'],
    destination: archivePath,
  });

  console.log(`Created ${archiveName}`);
}

if (process.argv.includes('--print-name')) {
  console.log(getArchiveName());
} else {
  packagePlugin().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

