// Compatibility wrapper: the implementation still lives in the legacy-named
// fixture generator, but it now writes the active SCREEN 4 smoke JSON path.
process.env.MIDEAS_MSX2_SCREEN_FIXTURE_DIR = 'msx2-screen4';
await import('./create_msx2_screen5_layers_fixture.mjs');
