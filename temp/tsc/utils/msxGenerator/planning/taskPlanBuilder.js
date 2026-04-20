export function buildInterruptTasks(analysis, config) {
    const tasks = [];
    const interruptConfig = config.interruptConfig ?? {};
    const enableAudioTask = interruptConfig.enableAudioTask ?? true;
    const enableFrameCounterTask = interruptConfig.enableFrameCounterTask ?? true;
    const hasFrameAudio = ((analysis.tracks?.length || 0) > 0) ||
        ((analysis.stateMachines?.length || 0) > 0);
    if (enableAudioTask && hasFrameAudio) {
        tasks.push({
            id: 'audio_tick',
            responsibility: 'audio',
            routineLabel: 'task_audio_tick',
            slot: 0,
            period: 1,
            enabledAtBoot: true,
            irqSafe: true,
            estimatedCycles: 0,
            notes: ['Tracker/PT3 music and state-machine sound tick.'],
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
