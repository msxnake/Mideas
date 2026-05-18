import type { ProjectAnalysis } from '../../asmTemplateGenerator';
import type { MSXModularConfig } from '../index';
import type { MainlineWorkItem, TaskDefinition } from '../types/executionTypes';

function usesLimitOnComponent(analysis: ProjectAnalysis): boolean {
  const entities = Array.isArray((analysis as any).entities) ? (analysis as any).entities : [];
  const templates = Array.isArray((analysis as any).templates) ? (analysis as any).templates : [];

  return entities.some((entity: any) => {
    const template = templates.find((candidate: any) => candidate?.id === entity?.entityTemplateId);
    const templateComp = template?.components?.find((component: any) =>
      component?.definitionId === 'comp_limit_on' || component?.definitionName === 'Limit_on'
    );
    const overrides = entity?.componentOverrides?.['comp_limit_on'];
    if (!templateComp && !overrides) return false;

    const enabled = overrides?.isEnabled ?? templateComp?.defaultValues?.isEnabled;
    return enabled !== false && enabled !== 'false';
  });
}

export function buildMainlineWork(
  analysis: ProjectAnalysis,
  _config: MSXModularConfig,
  tasks: TaskDefinition[]
): MainlineWorkItem[] {
  const mainline: MainlineWorkItem[] = [];
  const hasAudioTask = tasks.some((task) => task.responsibility === 'audio');
  const hasFrameAudio =
    ((analysis.tracks?.length || 0) > 0) ||
    ((analysis.sounds?.length || 0) > 0);
  const hasLimitOn = usesLimitOnComponent(analysis);

  if (!hasAudioTask && hasFrameAudio) {
    mainline.push({
      id: 'audio_tick_fallback',
      responsibility: 'audio',
      routineLabel: 'task_audio_tick',
      phase: 'postHalt',
      notes: ['Fallback path when IRQ audio task is disabled.'],
    });
  }

  mainline.push(
    {
      id: 'sprite_upload',
      responsibility: 'sprites',
      routineLabel: 'update_sprites_to_vram',
      phase: 'postHalt',
    },
    {
      id: 'screen_flow',
      responsibility: 'screenFlow',
      routineLabel: 'check_world_screen_transition',
      phase: 'preUpdate',
    },
    {
      id: 'entities',
      responsibility: 'entities',
      routineLabel: 'update_all_entities',
      phase: 'postUpdate',
    },
    ...(hasLimitOn
      ? [{
          id: 'screen_limits',
          responsibility: 'screenFlow',
          routineLabel: 'clamp_world_screen_limits',
          phase: 'postUpdate',
          notes: ['Applies Limit_on after movement so missing WorldMap edges behave like implicit walls.'],
        } satisfies MainlineWorkItem]
      : []),
    {
      id: 'state_machines',
      responsibility: 'stateMachines',
      routineLabel: 'execute_all_state_machines',
      phase: 'postUpdate',
    },
    {
      id: 'animated_tiles',
      responsibility: 'animation',
      routineLabel: 'update_animated_tiles',
      phase: 'postUpdate',
    },
    ...(((analysis.sounds?.length || 0) > 0)
      ? [{
          id: 'sfx',
          responsibility: 'sfx',
          routineLabel: 'sfx_update',
          phase: 'postUpdate',
        } satisfies MainlineWorkItem]
      : []),
    {
      id: 'hud',
      responsibility: 'hud',
      routineLabel: 'render_hud',
      phase: 'render',
    }
  );

  return mainline;
}
