import React, { lazy, Suspense, type ComponentType } from 'react';

/** Keep the surrounding IDE usable while an editor or dialog loads on first use. */
export function deferredPanel<P extends object>(load: () => Promise<{ default: ComponentType<P> }>): ComponentType<P> {
  const Component = lazy(load);
  return function DeferredPanel(props: P) {
    return (
      <Suspense fallback={<div role="status" className="p-4 text-sm text-msx-textsecondary">Cargando herramienta…</div>}>
        <Component {...props} />
      </Suspense>
    );
  };
}
