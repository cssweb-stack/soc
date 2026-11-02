import { sharedSettings } from './sync-shared.mjs';
const settings = sharedSettings();
console.log(`repository=${settings.repository}`);
console.log(`ref=${settings.ref}`);
