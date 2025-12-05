const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(rootDir, 'temp-vsix');
const outVsix = path.join(rootDir, `DirectoryDigest-${require(path.join(rootDir, 'package.json')).version}.vsix`);

function cleanTemp() {
    if (fs.existsSync(tempDir)) {
        try {
            execSync(`rmdir /s /q "${tempDir}"`, { shell: true });
        } catch (err) {
            // best effort
        }
    }
}

function copyFileIfExists(srcRel, destRel) {
    const src = path.join(rootDir, srcRel);
    const dest = path.join(tempDir, destRel);
    if (fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

try {
    cleanTemp();
    fs.mkdirSync(tempDir, { recursive: true });

    // Build a minimal package.json with runtime metadata only (no devDependencies)
    const pkg = require(path.join(rootDir, 'package.json'));
    const cleanPkg = {
        name: pkg.name,
        displayName: pkg.displayName,
        publisher: pkg.publisher,
        version: pkg.version,
        description: pkg.description,
        engines: pkg.engines,
        categories: pkg.categories,
        main: pkg.main,
        icon: pkg.icon,
        repository: pkg.repository,
        contributes: pkg.contributes,
        dependencies: pkg.dependencies || {}
    };

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(cleanPkg, null, 2), 'utf8');

    // Copy files needed in the package
    const filesToCopy = [
        'dist',
        'assets',
        'README.md',
        'CHANGELOG.md',
        'LICENSE',
        '.vscodeignore'
    ];

    function copyFolderRecursiveSync(src, dest) {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            // Avoid copying into our temp dir recursively
            if (path.resolve(srcPath) === path.resolve(tempDir)) continue;
            if (entry.isDirectory()) {
                copyFolderRecursiveSync(srcPath, destPath);
            } else if (entry.isFile()) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    filesToCopy.forEach((rel) => {
        const src = path.join(rootDir, rel);
        const dest = path.join(tempDir, rel);
        if (fs.existsSync(src)) {
            const stat = fs.statSync(src);
            if (stat.isDirectory()) {
                copyFolderRecursiveSync(src, dest);
            } else if (stat.isFile()) {
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
            }
        }
    });

    // Install only production dependencies in the temp dir and then package
    console.log('Installing production dependencies in temp directory (npm install)...');
    execSync(`cd "${tempDir}" && npm install --only=production --silent`, { stdio: 'inherit', shell: true });
    console.log('Packaging to VSIX in temp directory...');
    execSync(`cd "${tempDir}" && pnpm exec vsce package -o "${outVsix}"`, { stdio: 'inherit', shell: true });
    console.log('VSIX created at:', outVsix);
    
    // Clean up temporary dir
    cleanTemp();
    process.exit(0);
} catch (err) {
    console.error('Failed to create VSIX:', err);
    cleanTemp();
    process.exit(2);
}
