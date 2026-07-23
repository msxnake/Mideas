import { useEffect, useMemo, useRef } from 'react';

type MideasMcpAction = {
  id: string;
  type: 'focus_asset' | 'open_configuration' | 'set_status_message';
  payload?: {
    assetId?: string;
    message?: string;
  };
};

type MideasMcpBridgeOptions = {
  projectSnapshot: Record<string, unknown>;
  onFocusAsset: (assetId: string) => void;
  onOpenConfiguration: () => void;
  onSetStatusMessage: (message: string) => void;
};

const BRIDGE_PATH = '/mcp-api';

export function useMideasMcpBridge(options: MideasMcpBridgeOptions) {
  const handlersRef = useRef(options);
  handlersRef.current = options;
  const serializedEnvelope = useMemo(() => JSON.stringify({
    clientId: 'mideas-web',
    project: options.projectSnapshot,
  }), [options.projectSnapshot]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`${BRIDGE_PATH}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serializedEnvelope,
        signal: controller.signal,
      }).catch(() => {
        // The MCP bridge is optional. A stopped bridge must not affect the IDE.
      });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [serializedEnvelope]);

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;

    const reportResult = async (actionId: string, ok: boolean, message?: string) => {
      await fetch(`${BRIDGE_PATH}/actions/${encodeURIComponent(actionId)}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok, ...(message ? { message } : {}) }),
      });
    };

    const execute = async (action: MideasMcpAction) => {
      try {
        const handlers = handlersRef.current;
        if (action.type === 'focus_asset') {
          if (!action.payload?.assetId) throw new Error('focus_asset requires assetId.');
          handlers.onFocusAsset(action.payload.assetId);
        } else if (action.type === 'open_configuration') {
          handlers.onOpenConfiguration();
        } else if (action.type === 'set_status_message') {
          if (!action.payload?.message) throw new Error('set_status_message requires message.');
          handlers.onSetStatusMessage(action.payload.message);
        } else {
          throw new Error('Unsupported action.');
        }
        await reportResult(action.id, true, 'Action executed by Mideas.');
      } catch (error) {
        await reportResult(
          action.id,
          false,
          error instanceof Error ? error.message.slice(0, 500) : 'Action failed.',
        ).catch(() => {});
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(`${BRIDGE_PATH}/actions`, { cache: 'no-store' });
        if (response.ok) {
          const body = await response.json() as { actions?: MideasMcpAction[] };
          for (const action of body.actions || []) await execute(action);
        }
      } catch {
        // The optional bridge may be offline while the IDE continues normally.
      } finally {
        if (!disposed) timer = window.setTimeout(poll, 750);
      }
    };

    void poll();
    return () => {
      disposed = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);
}
