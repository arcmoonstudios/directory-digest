const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a minimal package without the problematic dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create a clean package.json for packaging
const cleanPackageJson = {
  name: packageJson.name,
  displayName: packageJson.displayName,
  publisher: packageJson.publisher,
  author: packageJson.author,
  description: packageJson.description,
  version: packageJson.version,
  icon: packageJson.icon,
  repository: packageJson.repository,
  galleryBanner: packageJson.galleryBanner,
  engines: packageJson.engines,
  categories: packageJson.categories,
  keywords: packageJson.keywords,
  activationEvents: packageJson.activationEvents,
  main: packageJson.main,
  contributes: packageJson.contributes,
  dependencies: packageJson.dependencies
};

// Write clean package.json
fs.writeFileSync('package-clean.json', JSON.stringify(cleanPackageJson, null, 2));

console.log('Created clean package.json');