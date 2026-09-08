import React, { useMemo, useRef, useState } from 'react';
import { Msx2PathTiming, Msx2PathTimingKey } from '../../types';
import { createPathTiming, evaluatePathTiming, normalizePathTiming, PATH_EASING_OPTIONS } from '../../utils/msx2PathTiming';

const input = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary';
const button = 'px-2 py-1 text-xs rounded border border-msx-border hover:bg-msx-hover disabled:opacity-40';
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** A temporal layer: it never edits spatial nodes, amplitudes or spline tangents. */
export const Msx2PathTimingEditor: React.FC<{
  timing?: Msx2PathTiming;
  startLabel?: string;
  destinations?: Array<{ id: string; label: string }>;
  onChange: (timing: Msx2PathTiming | undefined) => void;
}> = ({ timing, onChange, startLabel, destinations }) => {
  const curve = useMemo(() => normalizePathTiming(timing || createPathTiming()), [timing]);
  const [selected, setSelected] = useState(0);
  const dragging = useRef<number | null>(null);
  const selectedIndex = Math.min(selected, curve.keys.length - 1);
  const key = curve.keys[selectedIndex];
  const last = curve.keys.length - 1;
  const x = (time: number) => 28 + time * 228;
  const y = (distance: number) => 164 - distance * 140;
  const graph = Array.from({ length: 121 }, (_, i) => {
    const time = i / 120;
    return `${i ? 'L' : 'M'}${x(time).toFixed(2)},${y(evaluatePathTiming(curve.keys, time, curve.intensity)).toFixed(2)}`;
  }).join(' ');
  const updateKey = (index: number, patch: Partial<Msx2PathTimingKey>) => {
    const keys = curve.keys.map(point => ({ ...point }));
    const point = { ...keys[index], ...patch };
    if (index > 0 && index < last) {
      point.time = clamp(point.time, keys[index - 1].time + 0.001, keys[index + 1].time - 0.001);
      point.distance = clamp(point.distance, keys[index - 1].distance, keys[index + 1].distance);
    } else {
      point.time = index === 0 ? 0 : 1;
      point.distance = point.time;
    }
    keys[index] = point;
    onChange({ ...curve, keys });
  };
  const addPoint = (time: number, distance: number) => {
    if (curve.keys.length >= 64) return;
    const index = curve.keys.findIndex(point => point.time > time);
    if (index <= 0 || time - curve.keys[index - 1].time < 0.002 || curve.keys[index].time - time < 0.002) return;
    const keys = [...curve.keys];
    keys.splice(index, 0, { time, distance: clamp(distance, keys[index - 1].distance, keys[index].distance), easing: 'linear' });
    onChange({ ...curve, keys }); setSelected(index);
  };
  const pointerPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { time: clamp(((event.clientX - rect.left) * 280 / rect.width - 28) / 228, 0, 1),
      distance: clamp((164 - (event.clientY - rect.top) * 192 / rect.height) / 140, 0, 1) };
  };
  return <div className="mt-3 pt-3 border-t border-msx-border">
    <h4 className="text-sm font-semibold mb-2">Capa 2 · Ritmo del movimiento</h4>
    <label className="block text-xs text-msx-textsecondary">
      Control del tiempo
      <select className={`${input} mt-1`} value={timing ? 'curve' : 'spacing'}
        onChange={event => { setSelected(0); onChange(event.target.value === 'curve' ? createPathTiming() : undefined); }}>
        <option value="spacing">Espaciado inicial / final</option>
        <option value="curve">Curva de tiempo y distancia</option>
      </select>
    </label>
    {timing && <>
      {destinations && destinations.length > 0 && <label className="block text-xs mt-2">
        Desde {startLabel} hasta
        <select className={input} value={curve.endNodeId || destinations[0].id}
          onChange={event => onChange({ ...curve, endNodeId: event.target.value })}>
          {curve.endNodeId && !destinations.some(node => node.id === curve.endNodeId) && <option value={curve.endNodeId}>Destino eliminado: selecciona otro nodo</option>}
          {destinations.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select>
        <span className="block text-msx-textsecondary mt-1">La duración y la fórmula abarcan todo el recorrido entre estos nodos, incluidos los intermedios.</span>
      </label>}
      <div className="mt-2 text-xs">
        <label className="block">Intensidad del intervalo completo (×)
          <input className={input} type="number" min={0} max={4} step={0.001} value={curve.intensity ?? 1}
            onChange={event => onChange({ ...curve, intensity: clamp(Number(event.target.value), 0, 4) })} />
        </label>
        <input aria-label="Ajustar intensidad" className="w-full" type="range" min={0} max={4} step={0.01}
          value={curve.intensity ?? 1} onChange={event => onChange({ ...curve, intensity: Number(event.target.value) })} />
        <div className="flex flex-wrap gap-1">
          {[0, 0.8, 1, 1.2, 2].map(value => <button key={value} className={button}
            aria-pressed={(curve.intensity ?? 1) === value} onClick={() => onChange({ ...curve, intensity: value })}>×{value.toFixed(2)}</button>)}
        </div>
        <p className="text-msx-textsecondary mt-1">×1 conserva la fórmula; menos suaviza y más acentúa el ritmo. Se aplica a todas las fórmulas entre los nodos elegidos. ×0 hace constante cada intervalo temporal. Conserva tiempos, distancias y pausas; una fórmula constante no cambia.</p>
      </div>
      <label className="block text-xs text-msx-textsecondary mt-2">
        Duración del tramo (frames)
        <input type="number" min={1} max={3600} step={1} className={input} value={curve.durationFrames}
          onChange={event => onChange({ ...curve, durationFrames: clamp(Math.round(Number(event.target.value) || 1), 1, 3600) })} />
      </label>
      <p className="text-xs text-msx-textsecondary mt-1">{(curve.durationFrames / 60).toFixed(2)} s a 60 Hz · {curve.durationFrames * 4} bytes de movimiento</p>
      <svg viewBox="0 0 280 192" role="img" aria-label="Gráfico de tiempo y distancia"
        className="w-full mt-2 rounded border border-msx-border" style={{ touchAction: 'none', background: '#0b1220', cursor: 'crosshair' }}
        onPointerDown={event => {
          const target = event.target as SVGElement;
          const index = target.getAttribute('data-timing-key');
          if (index !== null) {
            setSelected(Number(index)); dragging.current = Number(index);
            event.currentTarget.setPointerCapture(event.pointerId);
          } else {
            const point = pointerPoint(event); addPoint(point.time, point.distance);
          }
        }}
        onPointerMove={event => { if (dragging.current !== null) updateKey(dragging.current, pointerPoint(event)); }}
        onPointerUp={event => { dragging.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { dragging.current = null; }}
        onLostPointerCapture={() => { dragging.current = null; }}>
        {[0, 0.25, 0.5, 0.75, 1].map(value => <g key={value} pointerEvents="none">
          <line x1={x(value)} x2={x(value)} y1={24} y2={164} stroke="#243349" />
          <line x1={28} x2={256} y1={y(value)} y2={y(value)} stroke="#243349" />
        </g>)}
        <g fill="#94a3b8" fontSize="10" pointerEvents="none">
          <text x="28" y="14">Distancia recorrida (%)</text>
          <text x="180" y="185">Tiempo (%)</text>
          <text x="6" y="167">0</text><text x="2" y="28">100</text>
          <text x="28" y="178">0</text><text x="242" y="178">100</text>
        </g>
        <path d={graph} stroke="#38bdf8" strokeWidth="2" fill="none" pointerEvents="none" />
        {curve.keys.map((point, index) => <circle key={index} data-timing-key={index}
          cx={x(point.time)} cy={y(point.distance)} r={5} fill={index === selectedIndex ? '#facc15' : '#38bdf8'}
          stroke="#fff" style={{ cursor: index > 0 && index < last ? 'move' : 'pointer' }}>
          <title>Punto {index + 1}: tiempo {Math.round(point.time * 100)}%, distancia {Math.round(point.distance * 100)}%</title>
        </circle>)}
      </svg>
      <p className="text-xs text-msx-textsecondary mt-1">Más pendiente = más velocidad. Horizontal = pausa. Pulsa para añadir un punto; arrástralo para ajustar el ritmo.</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {curve.keys.map((_, index) => <button key={index} className={button} aria-pressed={index === selectedIndex}
          onClick={() => setSelected(index)}>Punto {index + 1}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        <label>Tiempo del punto (%)
          <input type="number" min={0} max={100} step={0.1} disabled={selectedIndex === 0 || selectedIndex === last}
            className={input} value={Number((key.time * 100).toFixed(1))}
            onChange={event => updateKey(selectedIndex, { time: Number(event.target.value) / 100 })} />
        </label>
        <label>Distancia del punto (%)
          <input type="number" min={0} max={100} step={0.1} disabled={selectedIndex === 0 || selectedIndex === last}
            className={input} value={Number((key.distance * 100).toFixed(1))}
            onChange={event => updateKey(selectedIndex, { distance: Number(event.target.value) / 100 })} />
        </label>
      </div>
      {selectedIndex < last ? <label className="block text-xs mt-2">
        Fórmula hasta el siguiente punto
        <select className={input} value={key.easing} onChange={event => updateKey(selectedIndex, { easing: event.target.value as Msx2PathTimingKey['easing'] })}>
          {PATH_EASING_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label} · {option.formula}</option>)}
        </select>
        <span className="block text-msx-textsecondary mt-1">t va de 0 a 1 dentro de este intervalo. La fórmula modifica el avance, no la forma.</span>
      </label> : <p className="text-xs mt-2">Fin del tramo. Selecciona el punto anterior para editar la fórmula de llegada.</p>}
      <div className="flex flex-wrap gap-1 mt-2">
        <button className={button} disabled={curve.keys.length >= 64} onClick={() => {
          const index = Math.min(selectedIndex, last - 1);
          const time = (curve.keys[index].time + curve.keys[index + 1].time) / 2;
          addPoint(time, evaluatePathTiming(curve.keys, time, curve.intensity));
        }}>Dividir intervalo</button>
        <button className={button} disabled={selectedIndex === 0 || selectedIndex === last} onClick={() => {
          onChange({ ...curve, keys: curve.keys.filter((_, index) => index !== selectedIndex) }); setSelected(Math.max(0, selectedIndex - 1));
        }}>Eliminar punto</button>
        <button className={button} onClick={() => {
          const rampDistance = 1 / (Math.PI + 2);
          onChange({ ...curve, keys: [
            { time: 0, distance: 0, easing: 'sineIn' },
            { time: 0.25, distance: rampDistance, easing: 'linear' },
            { time: 0.75, distance: 1 - rampDistance, easing: 'sineOut' },
            { time: 1, distance: 1, easing: 'linear' },
          ] }); setSelected(0);
        }}>Acelerar · mantener · frenar</button>
      </div>
      <p className="text-xs text-msx-textsecondary mt-2">Cada tramo conserva su geometría. En las uniones, usa pendientes compatibles si buscas continuidad de velocidad.</p>
    </>}
  </div>;
};
