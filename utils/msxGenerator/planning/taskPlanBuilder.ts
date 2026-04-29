import type { ProjectAnalysis } from '../../asmTemplateGenerator';
import type { MSXModularConfig } from '../index';
import type { TaskDefinition } from '../types/executionTypes';

export function buildInterruptTasks(
  analysis: ProjectAnalysis,
  config: MSXModularConfig
): TaskDefinition[] {
  const tasks: TaskDefinition[] = [];
  const interruptConfig = config.interruptConfig ?? {};
  const hasExternalPt3Audio = (analysis.tracks || [])
    .some((track: any) => track?.playbackBackend === 'external-pt3');
  const enableAudioTask = interruptConfig.enableAudioTask ?? hasExternalPt3Audio;
  const enableFrameCounterTask = interruptConfig.enableFrameCounterTask ?? true;
  const hasFrameAudio =
    ((analysis.tracks?.length || 0) > 0) ||
    ((analysis.stateMachines?.length || 0) > 0);

  if (enableAudioTask && hasFrameAudio) {
    tasks.push({
      id: hasExternalPt3Audio ? 'pt3_music_update' : 'audio_tick',
      responsibility: 'audio',
      routineLabel: hasExternalPt3Audio ? 'music_update' : 'task_audio_tick',
      slot: 0,
      period: 1,
      enabledAtBoot: true,
      irqSafe: true,
      estimatedCycles: 0,
      notes: [hasExternalPt3Audio
        ? 'External PT3 music tick only; keep state-machine/SFX work out of H.TIMI.'
        : 'Tracker music and state-machine sound tick.'],
    });
  }

  if (enableFrameCounterTask) {
    tasks.push({
      id: 'frame_counter',
      responsibility: 'timer',
      routineLabel: 'task_frame_counter',
      slot: 1,
      period: 1,
      enabledAtBoot: true,
      irqSafe: true,
      estimatedCycles: 0,
      notes: ['Minimal periodic timing hook.'],
    });
  }

  return tasks;
}
