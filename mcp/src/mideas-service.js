const SCREEN_TYPES = new Set(['screenmap', 'msx2screen', 'msx2bitmaproom']);

export function getAppState(bridge) {
  const snapshot = bridge.getSnapshot();
  const project = snapshot.project;
  return {
    connected: snapshot.connected,
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
    clientId: snapshot.clientId,
    projectName: project?.currentProjectName || null,
    screenMode: project?.currentScreenMode || null,
    selectedAssetId: project?.selectedAssetId || null,
    currentEditor: project?.currentEditor ?? null,
    statusBarMessage: project?.statusBarMessage || null,
    assetCount: Array.isArray(project?.assets) ? project.assets.length : 0,
  };
}

export function getProject(bridge, includeAssetData = false) {
  const snapshot = bridge.requireProject();
  const project = snapshot.project;
  return {
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
    project: {
      ...project,
      assets: project.assets.map(asset => includeAssetData
        ? asset
        : { id: asset.id, name: asset.name, type: asset.type }),
    },
  };
}

export function getAsset(bridge, assetId) {
  const snapshot = bridge.requireProject();
  const asset = snapshot.project.assets.find(candidate => candidate.id === assetId);
  if (!asset) throw new Error(`Asset not found: ${assetId}`);
  return { revision: snapshot.revision, asset };
}

export function listWorlds(bridge) {
  const snapshot = bridge.requireProject();
  const worlds = snapshot.project.assets
    .filter(asset => asset.type === 'worldmap')
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      nodeCount: arrayLength(asset.data?.nodes),
      connectionCount: arrayLength(asset.data?.connections || asset.data?.edges),
      screenAssetIds: Array.isArray(asset.data?.nodes)
        ? asset.data.nodes.map(node => node?.screenAssetId).filter(Boolean)
        : [],
    }));
  return { revision: snapshot.revision, count: worlds.length, worlds };
}

export function listScreens(bridge) {
  const snapshot = bridge.requireProject();
  const screens = snapshot.project.assets
    .filter(asset => SCREEN_TYPES.has(asset.type))
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      width: asset.data?.width ?? asset.data?.mapWidth ?? null,
      height: asset.data?.height ?? asset.data?.mapHeight ?? null,
      entityCount: getEntityInstances(asset).length,
    }));
  return { revision: snapshot.revision, count: screens.length, screens };
}

export function listEntities(bridge) {
  const snapshot = bridge.requireProject();
  const project = snapshot.project;
  const templates = [
    ...(Array.isArray(project.entityTemplates) ? project.entityTemplates : []),
    ...project.assets.filter(asset => asset.type === 'entitytemplate').map(asset => asset.data || asset),
  ].map(template => ({
    id: template?.id || null,
    name: template?.name || null,
    componentCount: arrayLength(template?.components),
  }));

  const instances = project.assets
    .filter(asset => SCREEN_TYPES.has(asset.type))
    .flatMap(screen => getEntityInstances(screen).map(entity => ({
      id: entity?.id || null,
      name: entity?.name || null,
      templateId: entity?.templateId || entity?.entityTemplateId || entity?.type || null,
      screenId: screen.id,
      screenName: screen.name,
      x: entity?.x ?? entity?.position?.x ?? null,
      y: entity?.y ?? entity?.position?.y ?? null,
    })));

  return {
    revision: snapshot.revision,
    templateCount: templates.length,
    instanceCount: instances.length,
    templates,
    instances,
  };
}

export function listComponents(bridge) {
  const snapshot = bridge.requireProject();
  const project = snapshot.project;
  const definitions = Array.isArray(project.componentDefinitions) ? project.componentDefinitions : [];
  const templates = Array.isArray(project.entityTemplates) ? project.entityTemplates : [];
  const components = definitions.map(definition => ({
    id: definition?.id || null,
    name: definition?.name || null,
    propertyCount: arrayLength(definition?.properties),
    usedByTemplateIds: templates
      .filter(template => Array.isArray(template?.components)
        && template.components.some(component => component?.definitionId === definition?.id))
      .map(template => template.id),
  }));
  return { revision: snapshot.revision, count: components.length, components };
}

export function getConfiguration(bridge) {
  const snapshot = bridge.requireProject();
  const project = snapshot.project;
  return {
    revision: snapshot.revision,
    projectName: project.currentProjectName || null,
    screenMode: project.currentScreenMode || null,
    msx2ProjectProfile: project.msx2ProjectProfile ?? null,
    ideConfiguration: project.ideConfiguration || {},
    tileBankCount: arrayLength(project.tileBanks),
    mainMenuConfigured: Boolean(project.mainMenuConfig),
    presentationConfigured: Boolean(project.presentationScreen),
  };
}

export function validateControlledAction(bridge, action) {
  const snapshot = bridge.requireProject();
  if (action.type === 'focus_asset') {
    const exists = snapshot.project.assets.some(asset => asset.id === action.assetId);
    if (!exists) throw new Error(`Cannot focus missing asset: ${action.assetId}`);
  }
  return action;
}

function getEntityInstances(asset) {
  const candidates = [
    asset?.data?.layers?.entities,
    asset?.data?.entities,
    asset?.data?.entityInstances,
    asset?.data?.objects?.entities,
  ];
  return candidates.find(Array.isArray) || [];
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}
