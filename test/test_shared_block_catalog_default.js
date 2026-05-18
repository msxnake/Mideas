/**
 * Regression coverage for optimized screen block catalogs.
 *
 * blocks2x2/blocks4x4 screens must opt into shared catalogs by default,
 * with sharedCatalogEnabled: false as the only per-screen opt-out.
 */

import fs from 'fs';

const source = fs.readFileSync('utils/msxGenerator/generators/screensGenerator.ts', 'utf8');
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function extractFunction(name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) {
    throw new Error(`Missing ${name}`);
  }

  const typedBodyStart = source.indexOf('): boolean {', start);
  const bodyStart = typedBodyStart >= 0
    ? typedBodyStart + '): boolean '.length
    : source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }

  throw new Error(`Could not parse ${name}`);
}

function buildSharedCatalogPredicate() {
  const originalFunctionSource = extractFunction('shouldUseSharedScreenBlockCatalog');
  const bodyStart = originalFunctionSource.indexOf('): boolean {') + '): boolean '.length;
  const functionSource = `function shouldUseSharedScreenBlockCatalog(screen) ${originalFunctionSource.slice(
    bodyStart
  )}`;
  return new Function(`${functionSource}; return shouldUseSharedScreenBlockCatalog;`)();
}

const shouldUseSharedScreenBlockCatalog = buildSharedCatalogPredicate();

const cases = [
  {
    name: 'blocks2x2 defaults to shared catalog',
    screen: { blockOptimization: { backgroundMode: 'blocks2x2' } },
    expected: true,
  },
  {
    name: 'blocks4x4 defaults to shared catalog',
    screen: { blockOptimization: { backgroundMode: 'blocks4x4' } },
    expected: true,
  },
  {
    name: 'blocks2x2 can opt out explicitly',
    screen: { blockOptimization: { backgroundMode: 'blocks2x2', sharedCatalogEnabled: false } },
    expected: false,
  },
  {
    name: 'blocks4x4 can opt out explicitly',
    screen: { blockOptimization: { backgroundMode: 'blocks4x4', sharedCatalogEnabled: false } },
    expected: false,
  },
  {
    name: 'blocks2x2 remains enabled when explicitly true',
    screen: { blockOptimization: { backgroundMode: 'blocks2x2', sharedCatalogEnabled: true } },
    expected: true,
  },
  {
    name: 'raw mode does not use a shared block catalog',
    screen: { blockOptimization: { backgroundMode: 'raw' } },
    expected: false,
  },
  {
    name: 'missing block optimization does not use a shared block catalog',
    screen: {},
    expected: false,
  },
];

for (const testCase of cases) {
  assert(
    shouldUseSharedScreenBlockCatalog(testCase.screen) === testCase.expected,
    `${testCase.name}: expected ${testCase.expected}`
  );
}

const generateScreensFileSource = source.slice(
  source.indexOf('export function generateScreensFile'),
  source.indexOf('export function getScreensBank4Data')
);
const getScreensBank4DataSource = source.slice(source.indexOf('export function getScreensBank4Data'));

assert(
  generateScreensFileSource.includes('if (!shouldUseSharedScreenBlockCatalog(screenExport.screen)) continue;'),
  'generateScreensFile shared catalog grouping must use the shared-catalog predicate'
);
assert(
  getScreensBank4DataSource.includes('if (!shouldUseSharedScreenBlockCatalog(screenExport.screen)) continue;'),
  'getScreensBank4Data shared catalog grouping must use the shared-catalog predicate'
);
assert(
  !extractFunction('shouldUseSharedScreenBlockCatalog').includes('sharedCatalogEnabled === true'),
  'shared catalogs must not require sharedCatalogEnabled === true'
);

if (failures.length > 0) {
  console.error('Shared block catalog default regression failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Shared block catalog default regression passed');
