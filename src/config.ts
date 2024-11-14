// src/config.ts

export const excludedFileExtensions: string[] = [
  '.env', '.ini', '.cfg', '.config', '.lock', '.toml', '.yaml', '.yml',
  '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.pyo', '.pyd',
  '.obj', '.o', '.a', '.lib', '.out', '.rlib', '.rmeta',
  '.jar', '.war', '.ear', '.egg', '.wheel', '.whl', '.gem',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.swp', '.cache', '.tmp', '.temp', '.swo',
  '.bin', '.dat', '.db', '.sqlite', '.sqlite3', '.mdb',
  '.pdb', '.ilk', '.exp', '.map',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2',
  '.iml', '.idea', '.project', '.classpath', '.settings',
  '.vscode', '.vs', '.suo', '.user', '.sln', '.xcodeproj',
  '.xcworkspace', '.DS_Store'
];
  
export const excludedDirectories: string[] = [
  '0L', '.git', '.svn', '.hg', '.bzr', 'CVS',
  'node_modules', 'target', 'build', 'dist', 'bin', 'obj', 'out', 
  '__pycache__', '.pytest_cache', '.tox', '.venv', 'venv', 'env', 'Lib', 'Scripts', 'site-packages',
  'classes', 'META-INF', 'WEB-INF',
  'bower_components', 'jspm_packages', '.npm', '.yarn',
  'vendor/bundle', '.bundle',
  'packages', 'Debug', 'Release', 'x86', 'x64', 'AnyCPU',
  '.idea', '.vscode', '.vs', '.settings', '.project', '.classpath',
  'logs', 'log', 'tmp', 'temp', 'cache', '.cache',
  'docs', 'doc', 'documentation',
  'coverage', '.nyc_output', 'htmlcov',
  '.github', '.gitlab', '.circleci', '.jenkins',
  '.docker',
  '.history', '.grunt', '.sass-cache', 'bower_components', 'jspm_packages',
  'public/hot', 'storage', 'compiled', 'uploads', 'vendor',
  'Cargo.lock', 'Cargo.toml'
];