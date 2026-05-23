import React from 'react';
import { Msx2HudWidget, Msx2HudWidgetBinding, Msx2HudWidgetKind, Msx2Screen4Runtime } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { MAP_HEIGHT, MAP_WIDTH } from './Msx2Screen4EditorParts';

interface MSX2HudPlanPanelProps {
  runtime: Msx2Screen4Runtime;
  onRuntimeChange: (runtime: Msx2Screen4Runtime) => void;
}

const clampByte = (value: unknown, fallback: number) =>
  Math.max(0, Math.min(255, Number(value) || fallback));

const clampNibble = (value: unknown, fallback: number) =>
  Math.max(0, Math.min(15, Number(value) || fallback));

const clampHudValue = (value: unknown, fallback: number) =>
  Math.max(1, Math.min(255, Number(value) || fallback));

const colorClass = 'h-3 w-3 rounded-sm border border-msx-border';
const widgetKinds: Msx2HudWidgetKind[] = ['bar', 'counter', 'icon', 'text'];
const widgetBindings: Msx2HudWidgetBinding[] = ['playerEnergy', 'bossEnergy', 'air', 'score', 'lives', 'collectibles', 'custom'];

const exportHintForWidget = (widget: Pick<Msx2HudWidget, 'kind' | 'binding'>): string => {
  if (widget.kind === 'bar') return 'V9938 fill/line rectangle';
  if (widget.kind === 'counter') return '8x8 glyph atlas copies';
  if (widget.kind === 'icon') return '16x16 icon atlas copy';
  if (widget.kind === 'text') return '8x8 glyph atlas copies';
  return 'metadata';
};

const createHudWidget = (index: number, kind: Msx2HudWidgetKind = 'bar'): Msx2HudWidget => ({
  id: `msx2_hud_widget_${Date.now()}_${index}`,
  name: kind === 'bar' ? `Status Bar ${index + 1}` : kind === 'counter' ? `Counter ${index + 1}` : kind === 'icon' ? `Icon ${index + 1}` : `Text ${index + 1}`,
  kind,
  binding: kind === 'counter' ? 'score' : kind === 'icon' ? 'lives' : kind === 'text' ? 'custom' : 'playerEnergy',
  x: 8,
  y: 5 + index * 10,
  width: kind === 'counter' ? 40 : kind === 'icon' ? 16 : kind === 'text' ? 64 : 64,
  height: kind === 'counter' || kind === 'text' ? 8 : kind === 'icon' ? 16 : 6,
  maxValue: 16,
  initialValue: 16,
  primaryColor: 10,
  secondaryColor: 8,
  borderColor: 15,
  emptyColor: 4,
  text: kind === 'text' ? 'TEXT' : undefined,
  variableName: kind === 'counter' ? 'score' : undefined,
  iconTileIndex: kind === 'icon' ? 0 : undefined,
});

export const MSX2HudPlanPanel: React.FC<MSX2HudPlanPanelProps> = ({ runtime, onRuntimeChange }) => {
  const topHudRows = runtime.activeAreaY;
  const bottomHudRows = Math.max(0, MAP_HEIGHT - (runtime.activeAreaY + runtime.activeAreaHeight));
  const hudEnabled = runtime.hideHud !== true && runtime.showHud !== false && runtime.statusHud !== false;
  const playerMax = clampHudValue(runtime.playerEnergyMax, 16);
  const playerInitial = Math.min(playerMax, clampHudValue(runtime.playerEnergyInitial, playerMax));
  const bossMax = clampHudValue(runtime.bossEnergyMax, 16);
  const bossInitial = Math.min(bossMax, clampHudValue(runtime.bossEnergyInitial, bossMax));
  const air = clampByte(runtime.initialAir, 255);
  const airSegments = Math.max(1, Math.ceil((air / 255) * 16));
  const hudWidgets = runtime.hudWidgets || [];

  const updateRuntime = (patch: Partial<Msx2Screen4Runtime>) => {
    onRuntimeChange({ ...runtime, ...patch });
  };

  const applyStatusBarsHudPreset = () => {
    const widgets: Msx2HudWidget[] = [
      { ...createHudWidget(0), id: 'hud_player_energy', name: 'Player Energy', binding: 'playerEnergy', x: 8, y: 5, primaryColor: 10 },
      { ...createHudWidget(1), id: 'hud_boss_energy', name: 'Boss Energy', binding: 'bossEnergy', x: 184, y: 5, primaryColor: 8 },
      { ...createHudWidget(2), id: 'hud_air_time', name: 'Air/Time', binding: 'air', x: 96, y: 5, primaryColor: 10, maxValue: 255, initialValue: runtime.initialAir ?? 255 },
    ];
    updateRuntime({
      activeAreaX: 0,
      activeAreaY: 2,
      activeAreaWidth: MAP_WIDTH,
      activeAreaHeight: Math.max(1, MAP_HEIGHT - 2),
      hideHud: false,
      showHud: true,
      statusHud: true,
      hudStyle: 'statusBars',
      playerEnergyMax: 16,
      playerEnergyInitial: 16,
      bossEnergyMax: 16,
      bossEnergyInitial: 16,
      hudPrimaryColor: 10,
      hudSecondaryColor: 8,
      hudBorderColor: 15,
      hudEmptyColor: 4,
      hudWidgets: widgets,
      initialAir: runtime.initialAir ?? 255,
    });
  };

  const updateWidget = (id: string, patch: Partial<Msx2HudWidget>) => {
    updateRuntime({
      hudWidgets: hudWidgets.map(widget => widget.id === id ? { ...widget, ...patch } : widget),
    });
  };

  const addWidget = (kind: Msx2HudWidgetKind = 'bar') => updateRuntime({ hudWidgets: [...hudWidgets, createHudWidget(hudWidgets.length, kind)] });
  const removeWidget = (id: string) => updateRuntime({ hudWidgets: hudWidgets.filter(widget => widget.id !== id) });

  const renderBar = (filled: number, total: number, color: string) => (
    <div className="flex gap-px rounded border border-msx-border bg-msx-bgcolor p-0.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className="h-2 flex-1"
          style={{ backgroundColor: index < filled ? color : '#243042' }}
        />
      ))}
    </div>
  );

  return (
    <Panel title="MSX2 HUD Plan" collapsible className="text-xs" bodyClassName="p-2 space-y-2">
      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-msx-textsecondary">Status HUD</span>
          <Button
            size="sm"
            variant={hudEnabled ? 'primary' : 'secondary'}
            className="text-[11px]"
            onClick={() => updateRuntime({ hideHud: hudEnabled, showHud: !hudEnabled, statusHud: !hudEnabled })}
            title="Toggle native MSX2 runtime HUD"
          >
            {hudEnabled ? 'On' : 'Off'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-msx-textsecondary">HUD style</span>
          <span className="text-msx-textprimary">{runtime.hudStyle ?? 'compact'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-msx-textsecondary">Bands</span>
          <span className="text-msx-textprimary">top {topHudRows}, bottom {bottomHudRows}</span>
        </div>
      </div>

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-msx-textprimary">HUD widgets</div>
          <div className="flex gap-1">
            {widgetKinds.map(kind => (
              <Button key={kind} size="sm" variant="secondary" className="text-[11px]" onClick={() => addWidget(kind)} title={`Add ${kind} HUD widget`}>
                {kind}
              </Button>
            ))}
          </div>
        </div>
        {hudWidgets.length === 0 ? (
          <div className="text-msx-textsecondary">No HUD widgets yet.</div>
        ) : (
          <div className="space-y-2">
            {hudWidgets.map(widget => (
              <div key={widget.id} className="rounded border border-msx-border/60 bg-msx-panelbg/70 p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={widget.name}
                    onChange={event => updateWidget(widget.id, { name: event.target.value })}
                    className="min-w-0 flex-1 rounded border border-msx-border bg-msx-bgcolor px-2 py-1"
                    aria-label="MSX2 HUD widget name"
                  />
                  <Button size="sm" variant="danger" className="text-[11px]" onClick={() => removeWidget(widget.id)}>
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={widget.kind}
                    onChange={event => updateWidget(widget.id, { kind: event.target.value as Msx2HudWidgetKind })}
                    className="rounded border border-msx-border bg-msx-bgcolor px-2 py-1"
                    aria-label="MSX2 HUD widget kind"
                  >
                    {widgetKinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}
                  </select>
                  <select
                    value={widget.binding}
                    onChange={event => updateWidget(widget.id, { binding: event.target.value as Msx2HudWidgetBinding })}
                    className="rounded border border-msx-border bg-msx-bgcolor px-2 py-1"
                    aria-label="MSX2 HUD widget binding"
                  >
                    {widgetBindings.map(binding => <option key={binding} value={binding}>{binding}</option>)}
                  </select>
                </div>
                <div className="rounded border border-msx-border/50 bg-msx-bgcolor/50 px-2 py-1 text-msx-textsecondary">
                  Export hint: <span className="text-msx-textprimary">{exportHintForWidget(widget)}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['x', 'y', 'width', 'height'] as const).map(field => (
                    <label key={field} className="space-y-1">
                      <span className="text-msx-textsecondary">{field}</span>
                      <input
                        type="number"
                        min={field === 'width' || field === 'height' ? 1 : 0}
                        max={field === 'y' ? 191 : field === 'height' ? 64 : 255}
                        value={widget[field]}
                        onChange={event => updateWidget(widget.id, { [field]: clampByte(event.target.value, widget[field]) } as Partial<Msx2HudWidget>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1"
                        aria-label={`MSX2 HUD widget ${field}`}
                      />
                    </label>
                  ))}
                </div>
                {widget.kind === 'bar' && (
                  <div className="grid grid-cols-4 gap-2">
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Max</span>
                      <input type="number" min={1} max={255} value={widget.maxValue ?? 16} onChange={event => updateWidget(widget.id, { maxValue: clampHudValue(event.target.value, widget.maxValue ?? 16) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget max value" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Value</span>
                      <input type="number" min={0} max={255} value={widget.initialValue ?? widget.maxValue ?? 16} onChange={event => updateWidget(widget.id, { initialValue: clampByte(event.target.value, widget.initialValue ?? 16) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget initial value" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Fill</span>
                      <input type="number" min={0} max={15} value={widget.primaryColor ?? 10} onChange={event => updateWidget(widget.id, { primaryColor: clampNibble(event.target.value, widget.primaryColor ?? 10) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget fill color" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Border</span>
                      <input type="number" min={0} max={15} value={widget.borderColor ?? 15} onChange={event => updateWidget(widget.id, { borderColor: clampNibble(event.target.value, widget.borderColor ?? 15) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget border color" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Empty</span>
                      <input type="number" min={0} max={15} value={widget.emptyColor ?? 4} onChange={event => updateWidget(widget.id, { emptyColor: clampNibble(event.target.value, widget.emptyColor ?? 4) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget empty color" />
                    </label>
                  </div>
                )}
                {widget.kind === 'counter' && (
                  <div className="grid grid-cols-3 gap-2">
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Variable</span>
                      <input value={widget.variableName ?? ''} onChange={event => updateWidget(widget.id, { variableName: event.target.value })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget variable name" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Digits</span>
                      <input type="number" min={1} max={8} value={widget.width ? Math.max(1, Math.floor(widget.width / 8)) : 5} onChange={event => updateWidget(widget.id, { width: clampHudValue(event.target.value, 5) * 8 })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget digit count" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Color</span>
                      <input type="number" min={0} max={15} value={widget.primaryColor ?? 15} onChange={event => updateWidget(widget.id, { primaryColor: clampNibble(event.target.value, widget.primaryColor ?? 15) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget counter color" />
                    </label>
                  </div>
                )}
                {widget.kind === 'icon' && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Icon tile</span>
                      <input type="number" min={0} max={255} value={widget.iconTileIndex ?? 0} onChange={event => updateWidget(widget.id, { iconTileIndex: clampByte(event.target.value, widget.iconTileIndex ?? 0) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget icon tile" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-msx-textsecondary">Color</span>
                      <input type="number" min={0} max={15} value={widget.primaryColor ?? 15} onChange={event => updateWidget(widget.id, { primaryColor: clampNibble(event.target.value, widget.primaryColor ?? 15) })} className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1" aria-label="MSX2 HUD widget icon color" />
                    </label>
                  </div>
                )}
                {widget.kind === 'text' && (
                  <input
                    value={widget.text ?? ''}
                    onChange={event => updateWidget(widget.id, { text: event.target.value })}
                    className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1"
                    aria-label="MSX2 HUD widget text"
                    placeholder="Text"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-2">
        <div className="text-msx-textprimary">Legacy status preview</div>
        <div>
          <div className="mb-1 flex justify-between text-msx-textsecondary">
            <span>Player energy</span>
            <span>{playerInitial}/{playerMax}</span>
          </div>
          {renderBar(playerInitial, playerMax, '#74d07d')}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-msx-textsecondary">
            <span>Boss energy</span>
            <span>{bossInitial}/{bossMax}</span>
          </div>
          {renderBar(bossInitial, bossMax, '#ff8e81')}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-msx-textsecondary">
            <span>Air/time</span>
            <span>{air}/255</span>
          </div>
          {renderBar(airSegments, 16, '#e7e474')}
        </div>
      </div>

      <div className="rounded border border-msx-border/60 bg-msx-bgcolor/40 p-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-msx-textsecondary">Player max</span>
            <input
              type="number"
              min={1}
              max={255}
              value={playerMax}
              onChange={event => updateRuntime({ playerEnergyMax: clampHudValue(event.target.value, playerMax) })}
              className="w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
              aria-label="MSX2 player energy max"
            />
          </label>
          <label className="space-y-1">
            <span className="text-msx-textsecondary">Player initial</span>
            <input
              type="number"
              min={1}
              max={playerMax}
              value={playerInitial}
              onChange={event => updateRuntime({ playerEnergyInitial: Math.min(playerMax, clampHudValue(event.target.value, playerInitial)) })}
              className="w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
              aria-label="MSX2 player energy initial"
            />
          </label>
          <label className="space-y-1">
            <span className="text-msx-textsecondary">Boss max</span>
            <input
              type="number"
              min={1}
              max={255}
              value={bossMax}
              onChange={event => updateRuntime({ bossEnergyMax: clampHudValue(event.target.value, bossMax) })}
              className="w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
              aria-label="MSX2 boss energy max"
            />
          </label>
          <label className="space-y-1">
            <span className="text-msx-textsecondary">Boss initial</span>
            <input
              type="number"
              min={1}
              max={bossMax}
              value={bossInitial}
              onChange={event => updateRuntime({ bossEnergyInitial: Math.min(bossMax, clampHudValue(event.target.value, bossInitial)) })}
              className="w-full rounded border border-msx-border bg-msx-panelbg px-2 py-1"
              aria-label="MSX2 boss energy initial"
            />
          </label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-1 text-msx-textsecondary"><span className={colorClass} style={{ backgroundColor: '#74d07d' }} /> P</div>
          <div className="flex items-center gap-1 text-msx-textsecondary"><span className={colorClass} style={{ backgroundColor: '#ff8e81' }} /> B</div>
          <div className="flex items-center gap-1 text-msx-textsecondary"><span className={colorClass} style={{ backgroundColor: '#e7e474' }} /> A</div>
          <div className="flex items-center gap-1 text-msx-textsecondary"><span className={colorClass} style={{ backgroundColor: '#ffffff' }} /> Border</div>
        </div>
        <Button size="sm" variant="secondary" className="w-full text-[11px]" onClick={applyStatusBarsHudPreset}>
          Apply Status Bars HUD
        </Button>
        <div className="text-msx-textsecondary">
          The preset now creates editable HUD widgets. The backend exports the widget contract and will consume it in the data-driven renderer.
        </div>
      </div>
    </Panel>
  );
};
