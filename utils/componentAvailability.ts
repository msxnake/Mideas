/**
 * Components that the editor declares but that neither Mideas Play mode
 * (GameFlowPreviewModal) nor the MSX1 ROM generator implement
 * (docs/project/PLAN_PARIDAD_PLAY_ROM.md, phase 4, decision: hide them).
 *
 * Matched by id because every project keeps its own copy of the component
 * definitions. Hidden components are not offered in the pickers, but templates
 * that already use one keep it (shown with a warning) and nothing is deleted.
 * scripts/check_play_rom_parity.mjs checks this list against the source code.
 */
export const UNIMPLEMENTED_COMPONENT_IDS: ReadonlySet<string> = new Set([
  'comp_PacmanMovementV2',
  'comp_PacmanRotationV2',
  'comp_aiming',
  'comp_bounce',
  'comp_boss_crush_movement',
  'comp_boss_neck_chain',
  'comp_inventory',
  'comp_pacMovement',
  'comp_rotate',
  'comp_spawner',
]);

export const UNIMPLEMENTED_COMPONENT_NOTE = 'Not implemented by Mideas Play mode nor by the MSX1 ROM: it has no effect.';

export const isComponentDefinitionHidden = (definitionId: string | undefined | null): boolean =>
  !!definitionId && UNIMPLEMENTED_COMPONENT_IDS.has(definitionId);
