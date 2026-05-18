export const BEHAVIOR_COMPONENT_IDS = new Set(['comp_behavior', 'comp_ai_behavior']);

export const BEHAVIOR_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'walk_x_wall_turn', label: 'Walk X, turn on wall' },
  { value: 'follow_player_x', label: 'Follow player X' },
  { value: 'flee_player_x', label: 'Flee player X' },
  { value: 'face_player_x', label: 'Face player X' },
] as const;

export const BEHAVIOR_DIRECTION_OPTIONS = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
] as const;

export const isBehaviorComponentProperty = (
  componentId: string,
  propertyName: string,
  expectedPropertyName: 'behaviorType' | 'initialDirection'
): boolean => BEHAVIOR_COMPONENT_IDS.has(componentId) && propertyName === expectedPropertyName;
