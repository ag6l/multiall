import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iconRaster } from './iconRaster.js';
import { searchGuideFor } from './searchGuides.js';
import { services } from './services.js';

assert.equal(services.length, 500, 'the catalog should contain 500 live, distinct services');

const names = new Set();
const bangs = new Set();
const validScopes = new Set(['Search', 'Questions', 'AI', 'Utilidades']);
const sprite = readFileSync(new URL('../../public/assets/icons.svg', import.meta.url), 'utf8');

for (const service of services) {
  assert.equal(typeof service.name, 'string', 'every service needs a name');
  assert.ok(service.name.trim(), 'service names cannot be empty');
  assert.match(service.bang, /^![a-z0-9]+$/i, `${service.name} has an invalid bang`);
  assert.equal(typeof service.category, 'string', `${service.name} needs a category`);
  assert.ok(Array.isArray(service.scope) && service.scope.length, `${service.name} needs at least one scope`);
  assert.ok(service.scope.every((scope) => validScopes.has(scope)), `${service.name} has an unknown scope`);
  assert.match(service.icon, /^[a-z0-9-]+$/, `${service.name} needs a bare sprite symbol id as its icon`);

  const normalizedName = service.name.toLocaleLowerCase('en');
  const normalizedBang = service.bang.toLowerCase();
  assert.ok(!names.has(normalizedName), `duplicate service name: ${service.name}`);
  assert.ok(!bangs.has(normalizedBang), `duplicate service bang: ${service.bang}`);
  names.add(normalizedName);
  bangs.add(normalizedBang);

  if (service.search !== null) {
    assert.doesNotThrow(() => new URL(service.search), `${service.name} has an invalid search URL`);
  } else {
    assert.ok(service.home, `${service.name} needs a home URL when search is null`);
  }
  if (service.home) assert.doesNotThrow(() => new URL(service.home), `${service.name} has an invalid home URL`);

  assert.ok(sprite.includes(`id="${service.icon}"`), `${service.name} icon is missing from icons.svg`);

  for (const locale of ['es', 'en']) {
    const guide = searchGuideFor(service, locale);
    assert.ok(guide?.summary, `${service.name} needs a ${locale} search-guide summary`);
    assert.ok(guide?.history && guide?.focus, `${service.name} needs ${locale} search-guide facts`);
  }
}

// Sprite invariants: ids carry no project prefix, no symbol outlives the service
// that needed it, and the generated raster set matches what the sprite actually
// holds — the CSS filter is keyed off it, so drift would show up as grey boxes.
const symbols = [...sprite.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)];
const spriteIds = symbols.map((match) => match[1]);
const used = new Set(services.map((service) => service.icon));

assert.ok(!/id="(?:multiall|aiforall|asktoall)-/.test(sprite), 'sprite ids must not carry a project prefix');
assert.deepEqual(
  spriteIds.filter((id) => !used.has(id)),
  [],
  'icons.svg contains symbols no service references'
);
assert.equal(new Set(spriteIds).size, spriteIds.length, 'duplicate symbol ids in icons.svg');

const actualRaster = symbols
  .filter((match) => match[0].includes('<image') || match[0].includes('data:image'))
  .map((match) => match[1])
  .sort();
assert.deepEqual([...iconRaster].sort(), actualRaster, 'iconRaster.js is out of step with icons.svg — run `pnpm icons`');

// Vector marks must stay the overwhelming majority; a regression here means the
// favicon fallback is being leaned on instead of a real brand mark being mapped.
const vector = spriteIds.length - actualRaster.length;
assert.ok(
  vector / spriteIds.length > 0.75,
  `only ${vector}/${spriteIds.length} symbols are vector; the fallback is being overused`
);

console.log(
  `services: ${services.length} entries, unique names and bangs, valid schema and URLs; ` +
  `${spriteIds.length} symbols (${vector} vector, ${actualRaster.length} raster), all referenced`
);
