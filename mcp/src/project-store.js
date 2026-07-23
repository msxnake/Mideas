import { copyFile, lstat, mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const JSON_EXTENSION = '.json';

export class ProjectStore {
  constructor(allowedDirectories) {
    if (!Array.isArray(allowedDirectories) || allowedDirectories.length === 0) {
      throw new Error('At least one allowed directory is required.');
    }
    this.allowedDirectories = allowedDirectories.map(directory => path.resolve(directory));
  }

  async initialize() {
    this.allowedDirectories = await Promise.all(
      this.allowedDirectories.map(async directory => {
        const info = await lstat(directory);
        if (!info.isDirectory()) throw new Error(`Allowed path is not a directory: ${directory}`);
        return realpath(directory);
      }),
    );
  }

  async resolveProjectPath(inputPath) {
    if (typeof inputPath !== 'string' || inputPath.trim() === '') {
      throw new Error('projectPath must be a non-empty string.');
    }
    const resolved = await realpath(path.resolve(inputPath));
    const info = await lstat(resolved);
    if (!info.isFile()) throw new Error(`Project path is not a file: ${resolved}`);
    if (path.extname(resolved).toLowerCase() !== JSON_EXTENSION) {
      throw new Error('Mideas project files must use the .json extension.');
    }
    if (!this.allowedDirectories.some(directory => isInside(directory, resolved))) {
      throw new Error(`Access denied. Project is outside the allowed directories: ${resolved}`);
    }
    return resolved;
  }

  async readProject(inputPath) {
    const projectPath = await this.resolveProjectPath(inputPath);
    const [raw, info] = await Promise.all([readFile(projectPath, 'utf8'), lstat(projectPath)]);
    let project;
    try {
      project = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid JSON in ${projectPath}: ${error.message}`);
    }
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      throw new Error('A Mideas project must be a JSON object.');
    }
    return { projectPath, project, mtimeMs: info.mtimeMs, size: info.size };
  }

  async writeProject(inputPath, project, options = {}) {
    const projectPath = await this.resolveProjectPath(inputPath);
    const info = await lstat(projectPath);
    if (
      options.expectedMtimeMs !== undefined
      && Math.abs(info.mtimeMs - options.expectedMtimeMs) > 0.5
    ) {
      throw new Error(
        `Project changed since it was read (expected mtimeMs ${options.expectedMtimeMs}, current ${info.mtimeMs}). Read it again before writing.`,
      );
    }

    const directory = path.dirname(projectPath);
    const temporaryPath = path.join(
      directory,
      `.${path.basename(projectPath)}.${process.pid}.${Date.now()}.tmp`,
    );
    const backupPath = `${projectPath}.mideas-mcp.bak`;
    await mkdir(directory, { recursive: true });

    try {
      if (options.createBackup !== false) await copyFile(projectPath, backupPath);
      await writeFile(temporaryPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
      await rename(temporaryPath, projectPath);
    } catch (error) {
      await rm(temporaryPath, { force: true }).catch(() => {});
      throw error;
    }

    const writtenInfo = await lstat(projectPath);
    return {
      projectPath,
      backupPath: options.createBackup === false ? null : backupPath,
      mtimeMs: writtenInfo.mtimeMs,
      size: writtenInfo.size,
    };
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function summarizeProject(project) {
  const assets = Array.isArray(project.assets) ? project.assets : [];
  const assetsByType = {};
  for (const asset of assets) {
    const type = typeof asset?.type === 'string' && asset.type ? asset.type : '(missing)';
    assetsByType[type] = (assetsByType[type] || 0) + 1;
  }
  return {
    name: project.currentProjectName || null,
    screenMode: project.currentScreenMode || project.screenMode || null,
    assetCount: assets.length,
    assetsByType,
    componentDefinitionCount: arrayLength(project.componentDefinitions),
    entityTemplateCount: arrayLength(project.entityTemplates),
    enemyDefinitionCount: arrayLength(project.enemyDefinitions),
    selectedAssetId: project.selectedAssetId || null,
    hasMainMenu: Boolean(project.mainMenuConfig),
    hasPresentationScreen: Boolean(project.presentationScreen),
  };
}

export function validateProject(project) {
  const errors = [];
  const warnings = [];
  const assets = project.assets;
  if (!Array.isArray(assets)) {
    errors.push({ code: 'ASSETS_NOT_ARRAY', message: 'The root assets field must be an array.' });
    return { valid: false, errors, warnings };
  }

  const ids = new Map();
  assets.forEach((asset, index) => {
    const location = `assets[${index}]`;
    if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
      errors.push({ code: 'INVALID_ASSET', location, message: 'Asset must be an object.' });
      return;
    }
    for (const field of ['id', 'name', 'type']) {
      if (typeof asset[field] !== 'string' || asset[field].trim() === '') {
        errors.push({ code: `MISSING_${field.toUpperCase()}`, location, message: `Asset ${field} must be a non-empty string.` });
      }
    }
    if (typeof asset.id === 'string' && asset.id) {
      if (ids.has(asset.id)) {
        errors.push({
          code: 'DUPLICATE_ASSET_ID',
          location,
          message: `Asset id ${asset.id} is also used at assets[${ids.get(asset.id)}].`,
        });
      } else {
        ids.set(asset.id, index);
      }
    }
    if (!Object.prototype.hasOwnProperty.call(asset, 'data')) {
      warnings.push({ code: 'MISSING_ASSET_DATA', location, message: 'Asset has no data field.' });
    }
  });

  if (project.selectedAssetId && !ids.has(project.selectedAssetId)) {
    warnings.push({
      code: 'SELECTED_ASSET_NOT_FOUND',
      location: 'selectedAssetId',
      message: `Selected asset ${project.selectedAssetId} does not exist.`,
    });
  }
  if (!project.currentScreenMode && !project.screenMode) {
    warnings.push({ code: 'MISSING_SCREEN_MODE', message: 'Project has no currentScreenMode or legacy screenMode.' });
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function mergePatch(target, patch) {
  if (!isPlainObject(patch)) return structuredClone(patch);
  const output = isPlainObject(target) ? structuredClone(target) : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete output[key];
    else output[key] = isPlainObject(value) ? mergePatch(output[key], value) : structuredClone(value);
  }
  return output;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}
