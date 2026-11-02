import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const managedFile = path.join(project, '.shared-state.json');
const permitted = name => ['common.css', 'shell.css', '_data/university.json', 'assets/site.js', 'assets/bluesky-feed.js', '_media/other/contour-lines.svg'].includes(name) || ['_includes/components/', '_includes/layouts/', '_includes/icons/', '_media/branding/'].some(prefix => name.startsWith(prefix));

export function sharedSettings() {
const config = JSON.parse(fs.readFileSync(path.join(project, 'shared.config.json'), 'utf8'));
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository) || !/^[A-Za-z0-9][A-Za-z0-9_./-]*$/.test(config.ref) || typeof config.localPath !== 'string') throw new Error('Invalid shared.config.json settings.');
return config;
}

export function sharedSource() {
const config = sharedSettings();
return path.resolve(project, process.env.SHARED_SOURCE || config.localPath);
}

function safeRelative(name) {
return typeof name === 'string' && !name.includes('\\') && !path.posix.isAbsolute(name) && name.split('/').every(part => part && part !== '.' && part !== '..') && permitted(name);
}

function assertRealPath(target) {
let current = project;
for (const part of path.relative(project, target).split(path.sep)) {
current = path.join(current, part);
if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`Shared destination cannot be a symbolic link: ${current}`);
}
}

export function syncShared() {
const source = sharedSource();
if (source === project || source.startsWith(project + path.sep + 'src' + path.sep)) throw new Error('Shared source must be a separate repository directory.');
const descriptor = path.join(source, 'shared.json');
if (!fs.existsSync(descriptor)) throw new Error(`Shared repository not found at ${source}. Clone css-shared beside this GEO project, or set SHARED_SOURCE to its folder. Your unit files have not been changed.`);
const definition = JSON.parse(fs.readFileSync(descriptor, 'utf8'));
if (definition.schemaVersion !== 1 || definition.sourceDirectory !== 'src') throw new Error('Unsupported shared repository format.');
const sourceDir = path.join(source, 'src');
const files = [];
function scan(dir, prefix = '') {
for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue;
const name = prefix + entry.name;
if (entry.isSymbolicLink()) throw new Error(`Shared files cannot be symbolic links: ${name}`);
if (entry.isDirectory()) scan(path.join(dir, entry.name), name + '/');
else if (entry.isFile()) {
if (!safeRelative(name)) throw new Error(`Shared repository cannot overwrite this unit-owned path: ${name}`);
files.push({ name, bytes: fs.readFileSync(path.join(dir, entry.name)) });
}
}
}
scan(sourceDir);
for (const required of ['common.css', 'shell.css', '_data/university.json', '_includes/layouts/base.njk', '_includes/components/footer.njk']) if (!files.some(file => file.name === required)) throw new Error(`Shared repository is incomplete: ${required}`);
const previous = fs.existsSync(managedFile) ? JSON.parse(fs.readFileSync(managedFile, 'utf8')) : { files: [] };
if (!Array.isArray(previous.files) || previous.files.some(name => !safeRelative(name))) throw new Error('Invalid shared-file state.');
const previousNames = new Set(previous.files);
const nextNames = new Set(files.map(file => file.name));
// Check every path before copying anything. Never replace a new local component silently.
for (const file of files) {
const destination = path.join(project, 'src', file.name);
assertRealPath(destination);
if (fs.existsSync(destination) && !previousNames.has(file.name) && !fs.readFileSync(destination).equals(file.bytes)) throw new Error(`Local/shared name collision: src/${file.name}. Move the local component to components/local, or review it before adopting the shared version.`);
}
for (const name of previous.files) assertRealPath(path.join(project, 'src', name));
let changed = 0;
for (const file of files) {
const destination = path.join(project, 'src', file.name);
if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(file.bytes)) {
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, file.bytes);
changed++;
}
}
for (const name of previous.files) if (!nextNames.has(name)) fs.rmSync(path.join(project, 'src', name), { force: true });
// Regenerate ignores so newly added shared components cannot become unit-owned copies.
const ignoreFile = path.join(project, '.gitignore');
const start = '# BEGIN GENERATED SHARED FILES';
const end = '# END GENERATED SHARED FILES';
let ignore = fs.existsSync(ignoreFile) ? fs.readFileSync(ignoreFile, 'utf8') : '';
const block = [start, ...files.map(file => '/src/' + file.name), end].join('\n');
if (ignore.includes(start)) ignore = ignore.slice(0, ignore.indexOf(start)) + block + ignore.slice(ignore.indexOf(end) + end.length);
else ignore = ignore.trimEnd() + '\n\n' + block + '\n';
if (!fs.existsSync(ignoreFile) || fs.readFileSync(ignoreFile, 'utf8') !== ignore) fs.writeFileSync(ignoreFile, ignore);
const hash = crypto.createHash('sha256');
for (const file of files) { hash.update(file.name); hash.update('\0'); hash.update(file.bytes); hash.update('\0'); }
let commit = null;
try { commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
const state = JSON.stringify({ schemaVersion: 1, repository: sharedSettings().repository, commit, contentHash: hash.digest('hex'), files: [...nextNames] }, null, 2) + '\n';
if (!fs.existsSync(managedFile) || fs.readFileSync(managedFile, 'utf8') !== state) fs.writeFileSync(managedFile, state);
if (changed) console.log(`[shared] Loaded ${files.length} shared files (${changed} changed).`);
return source;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
try { syncShared(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
