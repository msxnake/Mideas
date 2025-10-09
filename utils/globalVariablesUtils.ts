import { MIDEAS_GLOBAL_VARIABLES, MideasGlobalVariable } from '../constants';
import { ProjectAsset } from '../types';

/**
 * Merges default MIDEAS global variables with custom project-specific variables.
 * Custom variables override defaults if they share the same name.
 *
 * @param assets - Array of project assets
 * @returns Combined array of global variables (defaults + custom)
 */
export function getAllGlobalVariables(assets: ProjectAsset[]): MideasGlobalVariable[] {
  // Find the globalvariables asset
  const globalVarsAsset = assets.find(asset => asset.type === 'globalvariables');

  if (!globalVarsAsset || !globalVarsAsset.data) {
    // No custom variables, return only defaults
    return [...MIDEAS_GLOBAL_VARIABLES];
  }

  const customVariables = (globalVarsAsset.data as any).customVariables || [];

  // Create a map to avoid duplicates (custom overrides default)
  const variablesMap = new Map<string, MideasGlobalVariable>();

  // Add default variables first
  MIDEAS_GLOBAL_VARIABLES.forEach(variable => {
    variablesMap.set(variable.name, variable);
  });

  // Add/override with custom variables
  customVariables.forEach((variable: MideasGlobalVariable) => {
    variablesMap.set(variable.name, variable);
  });

  // Return as array, preserving order (defaults first, then new custom ones)
  const defaultNames = MIDEAS_GLOBAL_VARIABLES.map(v => v.name);
  const result: MideasGlobalVariable[] = [];

  // First add all that exist in defaults (whether overridden or not)
  defaultNames.forEach(name => {
    const variable = variablesMap.get(name);
    if (variable) {
      result.push(variable);
      variablesMap.delete(name);
    }
  });

  // Then add any new custom variables not in defaults
  variablesMap.forEach(variable => {
    result.push(variable);
  });

  return result;
}

/**
 * Gets a specific global variable by name from the merged list
 */
export function getGlobalVariableByName(
  assets: ProjectAsset[],
  variableName: string
): MideasGlobalVariable | undefined {
  const allVariables = getAllGlobalVariables(assets);
  return allVariables.find(v => v.name === variableName);
}
