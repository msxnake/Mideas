import React, { useMemo } from 'react';
import { Msx2Screen4Layers, Msx2Screen4Runtime } from '../../types';
import { Panel } from '../common/Panel';
import { normalizeMsx2ShooterRuntimeConfig, validateMsx2Shooter60HzBudget, buildMsx2Shooter60HzFrameBudgetSummary, resolveMsx2ShooterScrollRowRoutine } from '../../utils/msx2ShooterRuntime';
import { Msx2Shooter60HzFrameBudgetView } from '../msx2_screen4_editor/Msx2Shooter60HzFrameBudgetView';

interface MSX2ExportContractPanelProps {
  map: number[][];
  layers: Msx2Screen4Layers;
  runtime: Msx2Screen4Runtime;
}

export const MSX2ExportContractPanel: React.FC<MSX2ExportContractPanelProps> = ({ map, layers, runtime }) => {
  const contract = useMemo(() => {
    const activeCells = Math.max(0, runtime.activeAreaWidth * runtime.activeAreaHeight);
    const hudWidgets = runtime.hudWidgets || [];
    const shooter = runtime.screenEngine === 'shooter'
      ? normalizeMsx2ShooterRuntimeConfig(runtime.shooter)
      : null;
    const activeIrqProfile = shooter
      ? shooter.budget.irqProfiles.find(profile => profile.id === shooter.budget.activeIrqProfile)
      : null;
    const hudStatic = hudWidgets.filter(widget => widget.kind === 'icon' || widget.kind === 'text');
    const hudDynamic = hudWidgets.filter(widget => widget.kind === 'bar' || widget.kind === 'counter');
    const widgetPrimitive = (kind: string) =>
      kind === 'bar' ? 'v9938_fill_line_rect' :
      kind === 'counter' || kind === 'text' ? 'glyph_atlas_copy_8x8' :
      kind === 'icon' ? 'icon_atlas_copy_16x16' :
      'metadata';
    const hudRecords = hudWidgets.map((widget, index) => ({
      id: widget.id,
      kind: widget.kind,
      binding: widget.binding,
      primitive: widgetPrimitive(widget.kind),
      recordOffsetBytes: index * 12,
      rect: [widget.x, widget.y, widget.width, widget.height],
      exportedBytes: [
        widget.kind,
        widget.binding,
        widget.x,
        widget.y,
        widget.width,
        widget.height,
        widget.maxValue ?? 16,
        widget.initialValue ?? widget.maxValue ?? 16,
        widget.primaryColor ?? 10,
        widget.secondaryColor ?? 8,
        widget.borderColor ?? 15,
        widget.emptyColor ?? 4,
      ],
      auxiliaryTables: [
        widget.kind === 'icon' ? 'msx2_screen_hud_widget_icon_tile' : '',
        widget.kind === 'text' ? 'msx2_screen_hud_widget_text_offset/length/pool' : '',
        widget.binding === 'custom' ? 'msx2_screen_hud_widget_variable_name_offset/length/pool' : '',
      ].filter(Boolean),
      runtimeRenderer: 'pending data-driven ASM consumer',
    }));
    const shooterValidation = shooter ? validateMsx2Shooter60HzBudget(shooter) : [];
    const shooterFrameBudget = shooter
      ? buildMsx2Shooter60HzFrameBudgetSummary(shooter, {
        scrollRowRoutine: resolveMsx2ShooterScrollRowRoutine(shooter, {
          movementMode: runtime.movementMode || runtime.movementModel,
        }),
      })
      : null;
    return {
      screen: {
        clear: {
          mode: 'SCREEN4_VISIBLE_PAGE',
          bytes: 256 * 192 / 2,
        },
        backgroundCopies: {
          source: 'tileMap',
          mapCells: map.flat().length,
          activeCells,
          primitive: '8x8_or_16x16_v9938_copy',
        },
        hudStatic: {
          widgets: hudStatic.length,
          kinds: Array.from(new Set(hudStatic.map(widget => widget.kind))),
          primitives: Array.from(new Set(hudStatic.map(widget => widgetPrimitive(widget.kind)))),
          records: hudRecords.filter(record => record.kind === 'icon' || record.kind === 'text'),
        },
        hudDynamic: {
          widgets: hudDynamic.length,
          bindings: Array.from(new Set(hudDynamic.map(widget => widget.binding))),
          primitives: Array.from(new Set(hudDynamic.map(widget => widgetPrimitive(widget.kind)))),
          records: hudRecords.filter(record => record.kind === 'bar' || record.kind === 'counter'),
        },
        spriteInit: {
          hardwareSat: true,
          entityInstances: layers.entities.length,
        },
        collision: {
          cells: layers.collision.flat().length,
          storage: 'rom_table',
        },
        effects: {
          cells: layers.effects.flat().length,
          storage: 'persistent_ram_copy',
        },
        behavior: {
          cells: (layers.behavior || []).flat().length,
          storage: 'rom_table',
        },
        shooter60Hz: shooter ? {
          direction: shooter.direction,
          scrollMode: shooter.scrollMode,
          playerMode: shooter.playerMode,
          pools: {
            enemies: shooter.budget.maxEnemies,
            playerShots: shooter.budget.maxPlayerShots,
            enemyShots: shooter.budget.maxEnemyShots,
            powerups: shooter.budget.maxPowerups,
            explosions: shooter.budget.maxExplosions,
            bossParts: shooter.budget.maxBossParts,
          },
          irq: activeIrqProfile ? {
            profile: activeIrqProfile.id,
            estimatedCycles: activeIrqProfile.estimatedCycles,
            worstCaseCycles: activeIrqProfile.worstCaseCycles,
            maxAllowedCycles: activeIrqProfile.maxAllowedCycles,
            vramBytes: activeIrqProfile.vramBytes,
            frequency: activeIrqProfile.frequency,
            sustained: activeIrqProfile.sustained,
            tasks: activeIrqProfile.tasks,
          } : null,
          frameBudget: shooterFrameBudget,
          validation: shooterValidation,
        } : null,
      },
    };
  }, [layers, map, runtime]);

  return (
    <Panel title="MSX2 Export Contract" collapsible className="text-xs" bodyClassName="p-2 space-y-2">
      {contract.screen.shooter60Hz?.frameBudget && (
        <Msx2Shooter60HzFrameBudgetView
          frameBudget={contract.screen.shooter60Hz.frameBudget}
          validation={contract.screen.shooter60Hz.validation}
          compact
        />
      )}
      <pre className="max-h-64 overflow-auto rounded border border-msx-border/60 bg-msx-bgcolor/60 p-2 text-[10px] leading-relaxed text-msx-textsecondary">
        {JSON.stringify(contract, null, 2)}
      </pre>
    </Panel>
  );
};
