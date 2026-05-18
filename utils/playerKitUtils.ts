import { ComponentDefinition, EntityTemplate, ProjectAsset } from '../types';

export const PLAYER_KIT_SCHEMA = 'mideas.player-kit.v1';

export interface PlayerKitPackage {
  schema: typeof PLAYER_KIT_SCHEMA;
  exportedAt: string;
  rootTemplateId: string;
  templates: EntityTemplate[];
  componentDefinitions: ComponentDefinition[];
  assets: ProjectAsset[];
}

export interface RemappedPlayerKitImport {
  rootTemplateId: string;
  templatesToImport: EntityTemplate[];
  componentDefinitionsToImport: ComponentDefinition[];
  assetsToCreate: ProjectAsset[];
}

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const sanitizePlayerKitFilename = (name: string): string => (
  name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_') || 'player'
);

const createUniqueId = (base: string, usedIds: Set<string>): string => {
  const cleanBase = base.trim().replace(/[^\w.-]+/g, '_') || 'imported';
  let suffix = 0;
  let candidate = `${cleanBase}_imported_${Date.now()}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${cleanBase}_imported_${Date.now()}_${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
};

const isObject = (value: unknown): value is Record<string, unknown> => (
  !!value && typeof value === 'object' && !Array.isArray(value)
);

const replaceIdsDeep = <T,>(value: T, idMap: Map<string, string>): T => {
  if (typeof value === 'string') {
    return (idMap.get(value) ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map(item => replaceIdsDeep(item, idMap)) as T;
  }
  if (isObject(value)) {
    const next: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, child]) => {
      next[key] = replaceIdsDeep(child, idMap);
    });
    return next as T;
  }
  return value;
};

const collectStringValuesDeep = (value: unknown, onString: (text: string) => void) => {
  if (typeof value === 'string') {
    onString(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectStringValuesDeep(item, onString));
    return;
  }
  if (isObject(value)) {
    Object.values(value).forEach(child => collectStringValuesDeep(child, onString));
  }
};

const propertyTypeToAssetType: Partial<Record<ComponentDefinition['properties'][number]['type'], ProjectAsset['type']>> = {
  sprite_ref: 'sprite',
  sound_ref: 'sound',
  behavior_script_ref: 'behavior',
  statemachine_ref: 'statemachine',
  tile_ref: 'tile',
  dialogue_ref: 'dialogue',
};

const isEntityTemplateLike = (value: unknown): value is EntityTemplate => {
  const template = value as EntityTemplate;
  return !!template
    && typeof template === 'object'
    && typeof template.id === 'string'
    && typeof template.name === 'string'
    && Array.isArray(template.components);
};

const isComponentDefinitionLike = (value: unknown): value is ComponentDefinition => {
  const definition = value as ComponentDefinition;
  return !!definition
    && typeof definition === 'object'
    && typeof definition.id === 'string'
    && typeof definition.name === 'string'
    && Array.isArray(definition.properties);
};

const isProjectAssetLike = (value: unknown): value is ProjectAsset => {
  const asset = value as ProjectAsset;
  return !!asset
    && typeof asset === 'object'
    && typeof asset.id === 'string'
    && typeof asset.name === 'string'
    && typeof asset.type === 'string';
};

export const createPlayerKitPackage = (
  rootTemplate: EntityTemplate,
  entityTemplates: EntityTemplate[],
  componentDefinitions: ComponentDefinition[],
  allAssets: ProjectAsset[]
): PlayerKitPackage => {
  const templatesById = new Map(entityTemplates.map(template => [template.id, template]));
  const componentDefinitionsById = new Map(componentDefinitions.map(definition => [definition.id, definition]));
  const assetsById = new Map(allAssets.map(asset => [asset.id, asset]));
  const assetIds = new Set(allAssets.map(asset => asset.id));

  const templateIdsToVisit = [rootTemplate.id];
  const assetIdsToVisit: string[] = [];
  const collectedTemplateIds = new Set<string>();
  const collectedComponentDefinitionIds = new Set<string>();
  const collectedAssetIds = new Set<string>();

  const queueTemplate = (templateId: string) => {
    if (!templateId || collectedTemplateIds.has(templateId) || !templatesById.has(templateId)) return;
    templateIdsToVisit.push(templateId);
  };

  const queueAsset = (assetId: string) => {
    if (!assetId || collectedAssetIds.has(assetId) || !assetsById.has(assetId)) return;
    collectedAssetIds.add(assetId);
    assetIdsToVisit.push(assetId);
  };

  const processedAssetIds = new Set<string>();
  while (templateIdsToVisit.length > 0 || assetIdsToVisit.length > 0) {
    while (templateIdsToVisit.length > 0) {
      const templateId = templateIdsToVisit.shift()!;
      if (collectedTemplateIds.has(templateId)) continue;

      const template = templatesById.get(templateId);
      if (!template) continue;
      collectedTemplateIds.add(templateId);

      template.components.forEach(component => {
        collectedComponentDefinitionIds.add(component.definitionId);
        const componentDefinition = componentDefinitionsById.get(component.definitionId);
        const defaults = component.defaultValues || {};

        componentDefinition?.properties.forEach(property => {
          const value = defaults[property.name];
          if (typeof value !== 'string' || !value) return;
          if (property.type === 'entity_template_ref') {
            queueTemplate(value);
            return;
          }
          const assetType = propertyTypeToAssetType[property.type];
          if (assetType && allAssets.some(asset => asset.id === value && asset.type === assetType)) {
            queueAsset(value);
          }
        });

        collectStringValuesDeep(defaults, text => {
          if (templatesById.has(text)) queueTemplate(text);
          if (assetIds.has(text)) queueAsset(text);
        });
      });
    }

    while (assetIdsToVisit.length > 0) {
      const assetId = assetIdsToVisit.shift()!;
      if (processedAssetIds.has(assetId)) continue;
      processedAssetIds.add(assetId);

      const asset = assetsById.get(assetId);
      if (!asset) continue;
      collectStringValuesDeep(asset.data, text => {
        if (templatesById.has(text) && !collectedTemplateIds.has(text)) {
          queueTemplate(text);
        }
        if (assetIds.has(text)) {
          queueAsset(text);
        }
      });
    }
  }

  const templates = Array.from(collectedTemplateIds)
    .map(id => templatesById.get(id))
    .filter((template): template is EntityTemplate => !!template)
    .map(template => cloneJson(template));

  templates.forEach(template => {
    template.components.forEach(component => collectedComponentDefinitionIds.add(component.definitionId));
  });

  const definitions = Array.from(collectedComponentDefinitionIds)
    .map(id => componentDefinitionsById.get(id))
    .filter((definition): definition is ComponentDefinition => !!definition)
    .map(definition => cloneJson(definition));

  const assets = Array.from(collectedAssetIds)
    .map(id => assetsById.get(id))
    .filter((asset): asset is ProjectAsset => !!asset && asset.type !== 'entitytemplate')
    .map(asset => cloneJson(asset));

  return {
    schema: PLAYER_KIT_SCHEMA,
    exportedAt: new Date().toISOString(),
    rootTemplateId: rootTemplate.id,
    templates,
    componentDefinitions: definitions,
    assets,
  };
};

export const parsePlayerKitPackage = (content: string): PlayerKitPackage => {
  const parsed = JSON.parse(content);
  const packageData = parsed?.schema === PLAYER_KIT_SCHEMA
    ? parsed
    : {
      schema: PLAYER_KIT_SCHEMA,
      exportedAt: new Date().toISOString(),
      rootTemplateId: parsed?.id,
      templates: Array.isArray(parsed) ? parsed : [parsed],
      componentDefinitions: [],
      assets: [],
    };

  if (packageData.schema !== PLAYER_KIT_SCHEMA || !Array.isArray(packageData.templates)) {
    throw new Error('Invalid Player Kit format.');
  }

  const templates = packageData.templates.filter(isEntityTemplateLike);
  if (templates.length === 0) {
    throw new Error('Player Kit has no valid entity templates.');
  }

  const rootTemplateId = typeof packageData.rootTemplateId === 'string'
    ? packageData.rootTemplateId
    : templates[0].id;

  return {
    schema: PLAYER_KIT_SCHEMA,
    exportedAt: typeof packageData.exportedAt === 'string' ? packageData.exportedAt : new Date().toISOString(),
    rootTemplateId,
    templates,
    componentDefinitions: Array.isArray(packageData.componentDefinitions)
      ? packageData.componentDefinitions.filter(isComponentDefinitionLike)
      : [],
    assets: Array.isArray(packageData.assets) ? packageData.assets.filter(isProjectAssetLike) : [],
  };
};

export const remapPlayerKitForImport = (
  packageData: PlayerKitPackage,
  existingTemplates: EntityTemplate[],
  existingComponentDefinitions: ComponentDefinition[],
  existingAssets: ProjectAsset[]
): RemappedPlayerKitImport => {
  const existingIds = new Set([
    ...existingTemplates.map(template => template.id),
    ...existingAssets.map(asset => asset.id),
  ]);
  const usedIds = new Set(existingIds);
  const idMap = new Map<string, string>();

  packageData.templates.forEach(template => {
    const existingTemplate = existingTemplates.find(current => current.id === template.id);
    const newId = existingTemplate
      ? createUniqueId(template.id, usedIds)
      : template.id;
    usedIds.add(newId);
    idMap.set(template.id, newId);
  });

  packageData.assets.forEach(asset => {
    const existingAsset = existingAssets.find(current => current.id === asset.id);
    if (existingAsset && existingAsset.type === asset.type && JSON.stringify(existingAsset.data) === JSON.stringify(asset.data)) {
      idMap.set(asset.id, asset.id);
      return;
    }

    const newId = existingAsset ? createUniqueId(asset.id, usedIds) : asset.id;
    usedIds.add(newId);
    idMap.set(asset.id, newId);
  });

  const templatesToImport = packageData.templates.map(template => {
    const remapped = replaceIdsDeep(cloneJson(template), idMap);
    remapped.id = idMap.get(template.id) ?? template.id;
    return remapped;
  });

  const assetsToCreate = packageData.assets
    .map(asset => {
      const mappedId = idMap.get(asset.id) ?? asset.id;
      const existingAsset = existingAssets.find(current => current.id === mappedId);
      if (existingAsset && existingAsset.type === asset.type && JSON.stringify(existingAsset.data) === JSON.stringify(asset.data)) {
        return null;
      }

      const remapped = replaceIdsDeep(cloneJson(asset), idMap);
      remapped.id = mappedId;
      if (remapped.data && typeof remapped.data === 'object' && 'id' in remapped.data) {
        (remapped.data as any).id = mappedId;
      }
      return remapped;
    })
    .filter((asset): asset is ProjectAsset => !!asset);

  const existingComponentIds = new Set(existingComponentDefinitions.map(definition => definition.id));
  const componentDefinitionsToImport = packageData.componentDefinitions
    .filter(definition => !existingComponentIds.has(definition.id))
    .map(definition => cloneJson(definition));

  return {
    rootTemplateId: idMap.get(packageData.rootTemplateId) ?? packageData.rootTemplateId,
    templatesToImport,
    componentDefinitionsToImport,
    assetsToCreate,
  };
};
