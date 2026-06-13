"use strict";
/**
 * Global MSX2 enemy library.
 *
 * Browser-local (localStorage) store of reusable enemy definitions that
 * survives across projects — the sibling of `msx2EntityLibrary.ts` and
 * `msx2SpriteLibrary.ts`, for `EnemyDefinition` payloads authored in the
 * Enemy Library editor.
 *
 * Pure IDE authoring data: an enemy only contributes to a ROM when actually
 * referenced by a placed entity / screen spawn in the current project.
 *
 * Persistence: localStorage (live store) + JSON file export/import for backup
 * and sharing between machines.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMsx2EnemyLibrary = loadMsx2EnemyLibrary;
exports.saveMsx2EnemyLibrary = saveMsx2EnemyLibrary;
exports.addEntryToMsx2EnemyLibrary = addEntryToMsx2EnemyLibrary;
exports.removeMsx2EnemyLibraryEntry = removeMsx2EnemyLibraryEntry;
exports.exportMsx2EnemyLibraryFile = exportMsx2EnemyLibraryFile;
exports.exportMsx2EnemyLibraryEntryFile = exportMsx2EnemyLibraryEntryFile;
exports.parseMsx2EnemyLibraryFile = parseMsx2EnemyLibraryFile;
exports.mergeMsx2EnemyLibraryEntries = mergeMsx2EnemyLibraryEntries;
const downloadUtils_1 = require("./downloadUtils");
const LS_KEY = 'msxIdeMsx2EnemyLibrary_v1';
const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'enemy';
/**
 * Type guard for a single entry. Accepts only entries whose enemy has an
 * `enemyId` and a `behavior`, so unrelated JSON never enters the store.
 */
function isValidEntry(value) {
    if (!value || typeof value !== 'object')
        return false;
    const entry = value;
    const enemy = entry.enemy;
    return Boolean(typeof entry.id === 'string'
        && typeof entry.name === 'string'
        && enemy
        && typeof enemy.enemyId === 'string'
        && enemy.behavior
        && typeof enemy.behavior === 'object');
}
/** Reads the library from localStorage. Returns [] on any error. */
function loadMsx2EnemyLibrary() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isValidEntry);
    }
    catch (error) {
        console.error('Failed to load MSX2 enemy library:', error);
        return [];
    }
}
/** Persists the library to localStorage. Returns false if storage failed. */
function saveMsx2EnemyLibrary(entries) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(entries));
        return true;
    }
    catch (error) {
        console.error('Failed to save MSX2 enemy library:', error);
        return false;
    }
}
/**
 * Adds an enemy to the library (load → append → save) and returns the new
 * entry. The name is deduplicated against existing entries with a numeric
 * suffix so repeated exports do not collide.
 */
function addEntryToMsx2EnemyLibrary(enemy, name) {
    const entries = loadMsx2EnemyLibrary();
    const baseName = (name || enemy.name || 'Enemy').trim() || 'Enemy';
    const existingNames = new Set(entries.map(entry => entry.name));
    let uniqueName = baseName;
    let suffix = 2;
    while (existingNames.has(uniqueName))
        uniqueName = `${baseName} ${suffix++}`;
    const entry = {
        id: `${slugify(uniqueName)}_${Date.now()}`,
        name: uniqueName,
        savedAt: Date.now(),
        enemy: { ...enemy, name: uniqueName },
    };
    saveMsx2EnemyLibrary([...entries, entry]);
    return entry;
}
/** Removes one entry by id (load → filter → save) and returns the new list. */
function removeMsx2EnemyLibraryEntry(id) {
    const entries = loadMsx2EnemyLibrary().filter(entry => entry.id !== id);
    saveMsx2EnemyLibrary(entries);
    return entries;
}
/** Downloads the whole library as a versioned JSON file. */
function exportMsx2EnemyLibraryFile() {
    const file = { version: 1, entries: loadMsx2EnemyLibrary() };
    (0, downloadUtils_1.downloadTextFile)('mideas_msx2_enemy_library.json', JSON.stringify(file, null, 2), 'application/json');
}
/** Downloads a single entry as a JSON file (one-entry library file). */
function exportMsx2EnemyLibraryEntryFile(entry) {
    const file = { version: 1, entries: [entry] };
    (0, downloadUtils_1.downloadTextFile)(`${slugify(entry.name)}.msx2enemy.json`, JSON.stringify(file, null, 2), 'application/json');
}
/**
 * Parses a JSON string into validated library entries. Accepts the
 * `{ version, entries }` file shape, a bare array of entries, or a bare
 * array/object of `EnemyDefinition` (so plain enemy `.json` exports can be
 * imported too). Throws on malformed JSON or when nothing valid is found.
 */
function parseMsx2EnemyLibraryFile(json) {
    const parsed = JSON.parse(json);
    const asArray = Array.isArray(parsed) ? parsed : [parsed];
    // Prefer the library file shape; otherwise treat items as raw EnemyDefinitions.
    const fileEntries = (parsed && !Array.isArray(parsed) && Array.isArray(parsed.entries))
        ? parsed.entries
        : null;
    let candidates;
    if (fileEntries) {
        candidates = fileEntries;
    }
    else {
        candidates = asArray
            .filter((raw) => Boolean(raw && typeof raw === 'object' && typeof raw.enemyId === 'string' && raw.behavior))
            .map(enemy => ({
            id: `${slugify(enemy.name || enemy.enemyId)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: enemy.name || enemy.enemyId,
            savedAt: Date.now(),
            enemy,
        }));
    }
    const valid = candidates.filter(isValidEntry);
    if (valid.length === 0) {
        throw new Error('No valid enemy entries found in the file.');
    }
    return valid;
}
/**
 * Merges incoming entries into the stored library (dedup by id, re-id and
 * re-name collisions). Returns the merged list.
 */
function mergeMsx2EnemyLibraryEntries(incoming) {
    const entries = loadMsx2EnemyLibrary();
    const existingIds = new Set(entries.map(entry => entry.id));
    const existingNames = new Set(entries.map(entry => entry.name));
    for (const candidate of incoming) {
        let name = candidate.name;
        let suffix = 2;
        while (existingNames.has(name))
            name = `${candidate.name} ${suffix++}`;
        let id = candidate.id;
        if (existingIds.has(id))
            id = `${slugify(name)}_${Date.now()}_${suffix}`;
        const entry = {
            ...candidate,
            id,
            name,
            enemy: { ...candidate.enemy, name },
        };
        entries.push(entry);
        existingIds.add(id);
        existingNames.add(name);
    }
    saveMsx2EnemyLibrary(entries);
    return entries;
}
