/**
 * @fileoverview Condition Migration Utility
 * Migrates legacy VARIABLE_EQUALS and VARIABLE_GREATER conditions to Guards
 */

import { Condition, StateMachineTransition, TransitionGuard } from '../statemachine.types';

/**
 * Check if a condition uses legacy variable comparison types
 */
function isLegacyVariableCondition(condition: Condition): boolean {
  return condition.type === 'VARIABLE_EQUALS' || condition.type === 'VARIABLE_GREATER';
}

/**
 * Convert legacy variable condition to TransitionGuard
 */
function convertToGuard(condition: Condition): TransitionGuard | undefined {
  if (condition.type === 'VARIABLE_EQUALS') {
    return {
      variableName: condition.params?.variable || '',
      operator: '==',
      compareValue: condition.params?.value || '0'
    };
  }

  if (condition.type === 'VARIABLE_GREATER') {
    return {
      variableName: condition.params?.variable || '',
      operator: '>',
      compareValue: condition.params?.value || '0'
    };
  }

  return undefined;
}

/**
 * Migrate a single transition from legacy conditions to guards
 *
 * @param transition - Transition to migrate
 * @returns Migrated transition with guard instead of variable condition
 */
export function migrateTransition(transition: any): any {
  // Check if transition has conditions property
  if (!transition.conditions) {
    return transition;
  }

  const condition = transition.conditions as Condition;

  // Check if it's a legacy variable condition
  if (isLegacyVariableCondition(condition)) {
    console.warn(`[Migration] Converting legacy ${condition.type} to Guard in transition ${transition.id}`);

    const guard = convertToGuard(condition);

    // Replace with KEY_PRESSED as default condition
    return {
      ...transition,
      conditions: {
        type: 'KEY_PRESSED',
        params: { key: '' }
      },
      guard: guard
    };
  }

  // Check nested conditions (AND, OR, XOR, NOT)
  if (condition.conditions && Array.isArray(condition.conditions)) {
    let hasLegacy = false;

    condition.conditions.forEach(subCondition => {
      if (isLegacyVariableCondition(subCondition)) {
        hasLegacy = true;
      }
    });

    if (hasLegacy) {
      console.warn(`[Migration] Found legacy variable conditions in composite condition (transition ${transition.id})`);
      console.warn(`[Migration] Manual review recommended - cannot auto-migrate nested variable conditions`);
    }
  }

  return transition;
}

/**
 * Migrate all transitions in a StateMachine
 *
 * @param transitions - Array of transitions
 * @returns Migrated transitions array
 */
export function migrateTransitions(transitions: any[]): any[] {
  if (!transitions || !Array.isArray(transitions)) {
    return transitions;
  }

  return transitions.map(migrateTransition);
}

/**
 * Migrate an entire project's StateMachines
 *
 * @param assets - Project assets array
 * @returns Migrated assets with updated StateMachines
 */
export function migrateProjectStateMachines(assets: any[]): any[] {
  if (!assets || !Array.isArray(assets)) {
    return assets;
  }

  return assets.map(asset => {
    if (asset.type === 'statemachine' && asset.data && asset.data.transitions) {
      console.log(`[Migration] Checking StateMachine: ${asset.name}`);

      const migratedTransitions = migrateTransitions(asset.data.transitions);

      return {
        ...asset,
        data: {
          ...asset.data,
          transitions: migratedTransitions
        }
      };
    }

    return asset;
  });
}
