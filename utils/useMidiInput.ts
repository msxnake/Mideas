import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web MIDI input hook for the PT3 tracker.
 *
 * Wraps `navigator.requestMIDIAccess` to expose available MIDI input ports,
 * the currently selected port, connection status and parsed MIDI callbacks
 * (note on/off + control change). Handles hot (dis)connect via `statechange`
 * and persists the chosen device name + enabled flag in `localStorage`.
 *
 * The Web MIDI API types are not guaranteed to be present in the project's
 * TypeScript lib set, so this module declares minimal local types and uses
 * `any` casts where the standard DOM lib does not provide them.
 *
 * @category Tracker
 */

// --- Minimal local Web MIDI types (avoid a @types/webmidi dependency) ---
interface MidiPortLike {
  id: string;
  name?: string | null;
  manufacturer?: string | null;
  state?: string;
  type?: string;
  onmidimessage?: ((e: { data: Uint8Array }) => void) | null;
}
interface MidiAccessLike {
  inputs: Map<string, MidiPortLike>;
  onstatechange: ((e: { port: MidiPortLike }) => void) | null;
}

export type MidiStatus =
  | 'unsupported'   // navigator.requestMIDIAccess is undefined
  | 'idle'          // not yet requested
  | 'requesting'    // awaiting permission
  | 'denied'        // permission denied / error
  | 'ready';        // access granted

export interface MidiInputInfo {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MidiLastMessage {
  type: 'noteon' | 'noteoff' | 'cc' | 'other';
  note?: number;
  velocity?: number;
  cc?: number;
  value?: number;
  channel: number;
  raw: number[];
  at: number;
}

export interface UseMidiInputOptions {
  /** Called for Note On with velocity > 0. */
  onNoteOn?: (note: number, velocity: number, channel: number) => void;
  /** Called for Note Off, or Note On with velocity 0. */
  onNoteOff?: (note: number, channel: number) => void;
  /** Called for Control Change messages (knobs etc.). */
  onControlChange?: (cc: number, value: number, channel: number) => void;
  /** Substring(s) matched (case-insensitive) to auto-select a device. */
  autoSelectMatch?: string[];
  /** localStorage key used to persist the selected device name + enabled flag. */
  storageKey?: string;
}

const DEFAULT_AUTO_MATCH = ['mpk mini 3', 'mpk mini mk3', 'mpkmini3', 'mpk mini'];
const DEFAULT_STORAGE_KEY = 'mideas.tracker.midi';

interface PersistedSettings {
  enabled: boolean;
  deviceName: string | null;
}

const loadPersisted = (key: string): PersistedSettings => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        deviceName: typeof parsed.deviceName === 'string' ? parsed.deviceName : null,
      };
    }
  } catch {
    /* ignore malformed storage */
  }
  return { enabled: false, deviceName: null };
};

const savePersisted = (key: string, value: PersistedSettings) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy errors */
  }
};

export function useMidiInput(options: UseMidiInputOptions = {}) {
  const {
    onNoteOn,
    onNoteOff,
    onControlChange,
    autoSelectMatch = DEFAULT_AUTO_MATCH,
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  const persistedRef = useRef<PersistedSettings>(loadPersisted(storageKey));

  const supported = typeof navigator !== 'undefined'
    && typeof (navigator as any).requestMIDIAccess === 'function';

  const [status, setStatus] = useState<MidiStatus>(supported ? 'idle' : 'unsupported');
  const [enabled, setEnabledState] = useState<boolean>(persistedRef.current.enabled);
  const [inputs, setInputs] = useState<MidiInputInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<MidiLastMessage | null>(null);

  const accessRef = useRef<MidiAccessLike | null>(null);
  const boundPortRef = useRef<MidiPortLike | null>(null);

  // Keep latest callbacks in refs so the message handler never goes stale
  // without forcing re-subscription.
  const cbRef = useRef({ onNoteOn, onNoteOff, onControlChange });
  useEffect(() => {
    cbRef.current = { onNoteOn, onNoteOff, onControlChange };
  }, [onNoteOn, onNoteOff, onControlChange]);

  const portToInfo = (p: MidiPortLike): MidiInputInfo => ({
    id: p.id,
    name: p.name || 'Unknown MIDI device',
    manufacturer: p.manufacturer || '',
  });

  const refreshInputs = useCallback(() => {
    const access = accessRef.current;
    if (!access) return [];
    const list: MidiInputInfo[] = [];
    access.inputs.forEach(p => list.push(portToInfo(p)));
    setInputs(list);
    return list;
  }, []);

  const handleMidiMessage = useCallback((event: { data: Uint8Array }) => {
    const data = event.data;
    if (!data || data.length === 0) return;
    const statusByte = data[0];
    const command = statusByte & 0xf0;
    const channel = statusByte & 0x0f;
    const d1 = data[1] ?? 0;
    const d2 = data[2] ?? 0;

    let msg: MidiLastMessage = { type: 'other', channel, raw: Array.from(data), at: Date.now() };

    if (command === 0x90 && d2 > 0) {
      // Note On (velocity > 0)
      msg = { ...msg, type: 'noteon', note: d1, velocity: d2 };
      cbRef.current.onNoteOn?.(d1, d2, channel);
    } else if (command === 0x80 || (command === 0x90 && d2 === 0)) {
      // Note Off, or Note On with velocity 0
      msg = { ...msg, type: 'noteoff', note: d1, velocity: 0 };
      cbRef.current.onNoteOff?.(d1, channel);
    } else if (command === 0xb0) {
      // Control Change (knobs)
      msg = { ...msg, type: 'cc', cc: d1, value: d2 };
      cbRef.current.onControlChange?.(d1, d2, channel);
    }
    setLastMessage(msg);
  }, []);

  const unbindCurrentPort = useCallback(() => {
    if (boundPortRef.current) {
      boundPortRef.current.onmidimessage = null;
      boundPortRef.current = null;
    }
  }, []);

  const bindPort = useCallback((id: string | null) => {
    unbindCurrentPort();
    const access = accessRef.current;
    if (!access || !id) {
      setSelectedInputId(id);
      return;
    }
    const port = access.inputs.get(id);
    if (port) {
      port.onmidimessage = handleMidiMessage;
      boundPortRef.current = port;
    }
    setSelectedInputId(id);
  }, [handleMidiMessage, unbindCurrentPort]);

  const pickDefault = useCallback((list: MidiInputInfo[]): string | null => {
    if (list.length === 0) return null;
    // 1) previously chosen device name still present
    const remembered = persistedRef.current.deviceName;
    if (remembered) {
      const byName = list.find(i => i.name === remembered);
      if (byName) return byName.id;
    }
    // 2) auto-match (Akai MPK mini)
    const lowerMatches = autoSelectMatch.map(m => m.toLowerCase());
    const matched = list.find(i => {
      const n = i.name.toLowerCase();
      return lowerMatches.some(m => n.includes(m));
    });
    if (matched) return matched.id;
    // 3) first available
    return list[0].id;
  }, [autoSelectMatch]);

  const requestAccess = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    if (accessRef.current) {
      setStatus('ready');
      return;
    }
    setStatus('requesting');
    try {
      const access: MidiAccessLike = await (navigator as any).requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      access.onstatechange = () => {
        const list = refreshInputs();
        // If our selected port disappeared, try to re-pick.
        setSelectedInputId(prev => {
          if (prev && list.some(i => i.id === prev)) return prev;
          const next = pickDefault(list);
          // bind outside of setState to avoid double work
          window.setTimeout(() => bindPort(next), 0);
          return next;
        });
      };
      const list = refreshInputs();
      setStatus('ready');
      const def = pickDefault(list);
      bindPort(def);
    } catch (err) {
      console.warn('[MIDI] requestMIDIAccess failed:', err);
      setStatus('denied');
    }
  }, [supported, refreshInputs, pickDefault, bindPort]);

  // Persist enabled + selected device name whenever they change.
  const selectInput = useCallback((id: string | null) => {
    bindPort(id);
    const info = inputs.find(i => i.id === id);
    persistedRef.current = {
      ...persistedRef.current,
      deviceName: info ? info.name : null,
    };
    savePersisted(storageKey, persistedRef.current);
  }, [bindPort, inputs, storageKey]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    persistedRef.current = { ...persistedRef.current, enabled: value };
    savePersisted(storageKey, persistedRef.current);
    if (value && !accessRef.current) {
      void requestAccess();
    }
  }, [requestAccess, storageKey]);

  // Auto-connect on mount if previously enabled.
  useEffect(() => {
    if (enabled && supported && !accessRef.current) {
      void requestAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup listeners on unmount.
  useEffect(() => {
    return () => {
      unbindCurrentPort();
      if (accessRef.current) accessRef.current.onstatechange = null;
    };
  }, [unbindCurrentPort]);

  return {
    supported,
    status,
    enabled,
    setEnabled,
    inputs,
    selectedInputId,
    selectInput,
    requestAccess,
    lastMessage,
  };
}

export type UseMidiInputReturn = ReturnType<typeof useMidiInput>;
