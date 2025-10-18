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

/**
 * Gets only the custom variables created by the user in the GlobalVariables asset.
 * Does NOT include the default MIDEAS variables.
 *
 * @param assets - Array of project assets
 * @returns Array of only custom user-defined global variables
 */
export function getCustomGlobalVariables(assets: ProjectAsset[]): MideasGlobalVariable[] {
  // Find the globalvariables asset
  const globalVarsAsset = assets.find(asset => asset.type === 'globalvariables');

  if (!globalVarsAsset || !globalVarsAsset.data) {
    // No custom variables asset found
    return [];
  }

  const customVariables = (globalVarsAsset.data as any).customVariables || [];
  return customVariables;
}

/**
 * Detects which global variables are actually used in the project
 * by scanning entities, behaviors, state machines, and custom code.
 *
 * @param assets - Array of project assets
 * @returns Array of only the global variables that are referenced in the project
 */
export function getUsedGlobalVariables(assets: ProjectAsset[]): MideasGlobalVariable[] {
  const allVariables = getAllGlobalVariables(assets);

  // If no variables defined, return empty array
  if (allVariables.length === 0) {
    return [];
  }

  // Collect all code snippets from the project
  const codeSnippets: string[] = [];

  // 1. Extract code from entities (behaviors)
  const screenMaps = assets.filter(a => a.type === 'screenmap');
  screenMaps.forEach(screenMap => {
    const entities = (screenMap.data as any)?.layers?.entities || [];
    entities.forEach((entity: any) => {
      // Check Behavior component
      if (entity.components?.Behavior?.behaviorCode) {
        codeSnippets.push(entity.components.Behavior.behaviorCode);
      }
    });
  });

  // 2. Extract code from StateMachine nodes AND variable references from IfThenElse nodes
  const gameFlowAsset = assets.find(a => a.type === 'gameflow');
  const ifThenElseVariableNames = new Set<string>();

  if (gameFlowAsset?.data) {
    const gameFlow = gameFlowAsset.data as any;
    if (gameFlow.nodes && Array.isArray(gameFlow.nodes)) {
      gameFlow.nodes.forEach((node: any) => {
        // StateMachine nodes have customCode
        if (node.type === 'StateMachine' && node.data?.customCode) {
          codeSnippets.push(node.data.customCode);
        }

        // IfThenElse nodes reference global variables by name
        if (node.type === 'IfThenElse' && node.data?.variableName) {
          ifThenElseVariableNames.add(node.data.variableName);
        }
      });
    }
  }

  // 3. Extract code from component definitions
  const componentDefs = assets.filter(a => a.type === 'componentdefinition');
  componentDefs.forEach(comp => {
    const compData = comp.data as any;
    if (compData.customCode) {
      codeSnippets.push(compData.customCode);
    }
  });

  // 4. Detect which variables are used
  const usedVariables: MideasGlobalVariable[] = [];
  const usedVariableNames = new Set<string>();

  allVariables.forEach(variable => {
    // Check 1: Variable's asmName appears in any code snippet
    const isUsedInCode = codeSnippets.some(code => {
      // Match the asmName as a whole word (not part of another identifier)
      const regex = new RegExp(`\\b${variable.asmName}\\b`, 'i');
      return regex.test(code);
    });

    // Check 2: Variable is referenced by an IfThenElse node
    const isUsedInIfThenElse = ifThenElseVariableNames.has(variable.name);

    if ((isUsedInCode || isUsedInIfThenElse) && !usedVariableNames.has(variable.name)) {
      usedVariables.push(variable);
      usedVariableNames.add(variable.name);
    }
  });

  return usedVariables;
}
