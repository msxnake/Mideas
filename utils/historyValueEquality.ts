/**
 * @fileoverview "Did this edit actually change anything?" for the undo history.
 *
 * `pushToHistory` must drop no-op edits, because many producers rebuild objects
 * with identical content (a palette normaliser, an atlas sync, a re-render that
 * re-derives a list). Comparing with `JSON.stringify(before) === JSON.stringify(after)`
 * answered that correctly but paid for it by serialising the whole payload twice.
 *
 * On a 13-room world (test/msx2-destroy/fixture_base.json, 356,352 atlas pixels
 * per room) one atlas edit fans out to all 13 rooms, and the stringify pair cost
 * ~115 ms of blocked main thread — about seven 60 Hz frames. A walk that bails
 * on the first difference costs ~0 ms in that case, because it hits a real
 * difference immediately; the full walk of 13 identical clones (the no-op case
 * this check exists for) costs ~21 ms instead of ~115 ms.
 *
 * Measure with `node scripts/perf_screen5_atlas_fanout.mjs`.
 *
 * ## Deliberate differences from the previous JSON.stringify comparison
 *
 * - **Key order is ignored.** `{a:1,b:2}` and `{b:2,a:1}` now compare EQUAL, so
 *   a reordering with identical content no longer lands on the undo stack. That
 *   is the intent — such an edit changes nothing a user can see or export.
 * - **`undefined` is treated as absent**, matching stringify: `{a: undefined}`
 *   equals `{}`. Without this the new walk would be stricter than the old one
 *   and would record spurious entries.
 * - **`NaN` / `±Infinity` compare equal to `null`**, again matching stringify,
 *   which serialises all three as `null`.
 *
 * Out of contract, because project state is plain JSON (it round-trips through
 * `JSON.parse` on load): `Date`, `Map`, `Set`, class instances, functions,
 * symbols, getters with side effects and cyclic references. Cycles would have
 * thrown in the stringify version too, so neither implementation guards them.
 */

/** Values that stringify collapses to `null`, so they must not read as differences. */
const isJsonNullish = (value: unknown): boolean =>
  value === null || (typeof value === 'number' && !Number.isFinite(value));

/** Keys stringify would emit: an explicit `undefined` is dropped from the output. */
const definedKeyCount = (value: Record<string, unknown>, keys: string[]): number => {
  let count = 0;
  for (const key of keys) if (value[key] !== undefined) count += 1;
  return count;
};

/**
 * Structural equality with the same verdict as comparing JSON serialisations,
 * but allocation-free and bailing on the first difference.
 */
export const historyValuesEqual = (before: unknown, after: unknown): boolean => {
  // The hot path: immutable updates leave every untouched branch by reference.
  if (before === after) return true;

  if (isJsonNullish(before) || isJsonNullish(after)) {
    return isJsonNullish(before) && isJsonNullish(after);
  }

  const beforeIsObject = typeof before === 'object' && before !== null;
  const afterIsObject = typeof after === 'object' && after !== null;
  if (!beforeIsObject || !afterIsObject) {
    // Primitives, and the mixed primitive/object case.
    return Object.is(before, after);
  }

  const beforeIsArray = Array.isArray(before);
  if (beforeIsArray !== Array.isArray(after)) return false;

  if (beforeIsArray) {
    const a = before as unknown[];
    const b = after as unknown[];
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index++) {
      if (!historyValuesEqual(a[index], b[index])) return false;
    }
    return true;
  }

  const a = before as Record<string, unknown>;
  const b = after as Record<string, unknown>;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  // Compare only keys stringify would emit, so an explicit `undefined` on one
  // side does not read as a change. Counting first keeps the common case (no
  // `undefined` anywhere) at two cheap length reads.
  if (aKeys.length !== bKeys.length) {
    if (definedKeyCount(a, aKeys) !== definedKeyCount(b, bKeys)) return false;
  }

  for (const key of aKeys) {
    if (a[key] === undefined) {
      if (b[key] !== undefined) return false;
      continue;
    }
    if (!historyValuesEqual(a[key], b[key])) return false;
  }

  // Keys present only on `after` (with a defined value) are a change.
  for (const key of bKeys) {
    if (b[key] === undefined) continue;
    if (!Object.prototype.hasOwnProperty.call(a, key)) return false;
  }

  return true;
};
