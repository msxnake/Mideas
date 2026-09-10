// The bundled AY emulator expects this namespace. Each AudioWorklet has its
// own global scope; this does not replace window.Cowbell in the editor.
globalThis.Cowbell = { Common: {}, Player: {} };
