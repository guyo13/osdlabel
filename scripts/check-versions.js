#!/usr/bin/env node

/**
 * Validates that all @osdlabel/* packages and the root osdlabel package
 * share the same version number (lockstep versioning).
 *
 * Run: node scripts/check-versions.js
 * Exits non-zero if versions don't match.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const packagesDir = join(__dirname, '..', 'packages');

const entries = readdirSync(packagesDir).filter((name) => {
  const fullPath = join(packagesDir, name);
  return statSync(fullPath).isDirectory();
});

/** @type {Array<{ name: string; version: string; path: string }>} */
const packages = [];

for (const entry of entries) {
  const pkgPath = join(packagesDir, entry, 'package.json');
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (pkg.name && pkg.version) {
      packages.push({ name: pkg.name, version: pkg.version, path: pkgPath });
    }
  } catch {
    // skip directories without package.json
  }
}

if (packages.length === 0) {
  console.error('No packages found in packages/');
  process.exit(1);
}

const versions = new Set(packages.map((p) => p.version));

if (versions.size === 1) {
  const version = [...versions][0];
  console.log(`All ${packages.length} packages are at version ${version}:`);
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version}`);
  }
  process.exit(0);
} else {
  console.error('Version mismatch detected across packages:');
  for (const pkg of packages) {
    console.error(`  ${pkg.name}@${pkg.version}  (${pkg.path})`);
  }
  process.exit(1);
}
