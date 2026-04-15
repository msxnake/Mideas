"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMainlineWork = buildMainlineWork;
function buildMainlineWork(analysis, _config, tasks) {
    const mainline = [];
    const hasAudioTask = tasks.some((task) => task.responsibility === 'audio');
    const hasFrameAudio = ((analysis.tracks?.length || 0) > 0) ||
        ((analysis.stateMachines?.length || 0) > 0);
    if (!hasAudioTask && hasFrameAudio) {
        mainline.push({
            id: 'audio_tick_fallback',
            responsibility: 'audio',
            routineLabel: 'task_audio_tick',
            phase: 'postHalt',
            notes: ['Fallback path when IRQ audio task is disabled.'],
        });
    }
    mainline.push({
        id: 'sprite_upload',
        responsibility: 'sprites',
        routineLabel: 'update_sprites_to_vram',
        phase: 'postHalt',
    }, {
        id: 'screen_flow',
        responsibility: 'screenFlow',
        routineLabel: 'check_world_screen_transition',
        phase: 'preUpdate',
    }, {
        id: 'entities',
        responsibility: 'entities',
        routineLabel: 'update_all_entities',
        phase: 'postUpdate',
    }, {
        id: 'state_machines',
        responsibility: 'stateMachines',
        routineLabel: 'execute_all_state_machines',
        phase: 'postUpdate',
    }, {
        id: 'animated_tiles',
        responsibility: 'animation',
        routineLabel: 'update_animated_tiles',
        phase: 'postUpdate',
    }, {
        id: 'sfx',
        responsibility: 'sfx',
        routineLabel: 'sfx_update',
        phase: 'postUpdate',
    }, {
        id: 'hud',
        responsibility: 'hud',
        routineLabel: 'render_hud',
        phase: 'render',
    });
    return mainline;
}
