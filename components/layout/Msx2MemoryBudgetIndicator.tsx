import React, { useState } from 'react';
import type { ProjectAsset } from '../../types';
import {
  formatHex,
  measureScreen5MemoryBudget,
  SCREEN5_RESIDENT_END,
  SCREEN5_RESIDENT_START,
  type Screen5MemoryBudget,
} from '../../utils/msx2Screen5MemoryBudget';
import { Msx2MegaRomBankMap } from './Msx2MegaRomBankMap';

interface Msx2MemoryBudgetIndicatorProps {
  projectName: string;
  assets: ProjectAsset[];
  entityTemplates: any[];
  componentDefinitions: any[];
}

const toneFor = (freeBytes: number, totalBytes: number) => {
  if (freeBytes < 0) return 'text-red-400';
  const freeRatio = totalBytes > 0 ? freeBytes / totalBytes : 0;
  if (freeRatio < 0.05) return 'text-red-400';
  if (freeRatio < 0.15) return 'text-yellow-400';
  return 'text-green-400';
};

const barColorFor = (freeBytes: number, totalBytes: number) => {
  const tone = toneFor(freeBytes, totalBytes);
  return tone === 'text-red-400' ? 'bg-red-500' : tone === 'text-yellow-400' ? 'bg-yellow-500' : 'bg-green-500';
};

const Bar: React.FC<{ used: number; total: number; free: number }> = ({ used, total, free }) => (
  <div className="w-full h-2 bg-msx-bgcolor border border-msx-border rounded overflow-hidden">
    <div
      className={`h-full ${barColorFor(free, total)}`}
      style={{ width: `${Math.min(100, Math.max(0, (used / total) * 100))}%` }}
    />
  </div>
);

/**
 * Status-bar "chivato" for MSX2 SCREEN 5 bitmap-room projects: free RAM in the
 * runtime chain and free bytes of the resident #4000-#BFFF window. Measured on
 * demand (Recalcular) because the resident figure needs a real Glass compile.
 * The "Bancos" button shows the same measurement as a per-bank MegaROM map.
 */
export const Msx2MemoryBudgetIndicator: React.FC<Msx2MemoryBudgetIndicatorProps> = ({
  projectName,
  assets,
  entityTemplates,
  componentDefinitions,
}) => {
  const [budget, setBudget] = useState<Screen5MemoryBudget | null>(null);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<'memory' | 'banks' | null>(null);

  const recalculate = async () => {
    setBusy(true);
    try {
      setBudget(await measureScreen5MemoryBudget(projectName || 'MSX_Game', assets, entityTemplates, componentDefinitions));
    } catch (error) {
      setBudget({
        measuredAt: Date.now(),
        ramError: error instanceof Error ? error.message : String(error),
        resident: { status: 'unavailable', message: 'Error inesperado al medir.' },
      });
    } finally {
      setBusy(false);
    }
  };

  // The bank map comes from the same compile as the figures, so the first time it
  // is asked for with nothing measured yet, measure instead of showing an empty panel.
  const toggleBanks = () => {
    if (panel === 'banks') {
      setPanel(null);
      return;
    }
    setPanel('banks');
    if (!budget && !busy) void recalculate();
  };

  const ram = budget?.ram;
  const ramTotal = ram ? ram.chainCeiling - ram.chainBase : 0;
  const ramUsed = ram ? ram.chainEnd - ram.chainBase : 0;
  const ramFree = ram ? ram.chainCeiling - ram.chainEnd : 0;
  const resident = budget?.resident;
  const residentTotal = SCREEN5_RESIDENT_END - SCREEN5_RESIDENT_START;

  const ramLabel = !budget
    ? 'RAM —'
    : ram
      ? <>RAM <span className={toneFor(ramFree, ramTotal)}>{ramFree}</span> libres</>
      : <span className="text-red-400">¡Error al generar!</span>;
  const residentLabel = !resident
    ? 'Residente —'
    : resident.status === 'ok'
      ? <>Residente <span className={toneFor(resident.freeBytes!, residentTotal)}>{resident.freeBytes}</span> libres</>
      : resident.status === 'overflow'
        ? <span className="text-red-400">Residente +{resident.overflowBytes} de más</span>
        : <span className="opacity-60">Residente ?</span>;

  return (
    <span className="relative shrink-0 flex items-center gap-2 font-sans">
      <button
        type="button"
        className="hover:text-msx-highlight"
        title="Memoria del proyecto SCREEN 5 (clic para ver el desglose)"
        onClick={() => setPanel(current => (current === 'memory' ? null : 'memory'))}
      >
        {ramLabel} · {residentLabel}
      </button>
      <button
        type="button"
        className="px-1.5 py-0.5 border border-msx-border rounded hover:bg-msx-border disabled:opacity-50"
        onClick={recalculate}
        disabled={busy}
        title="Genera el ASM y lo compila con Glass para medir la RAM y la ventana residente"
      >
        {busy ? 'Midiendo…' : 'Recalcular'}
      </button>
      <button
        type="button"
        className={`px-1.5 py-0.5 border border-msx-border rounded hover:bg-msx-border ${panel === 'banks' ? 'bg-msx-border' : ''}`}
        onClick={toggleBanks}
        title="Mapa visual de los bancos MegaROM: rojo = usado, verde = libre"
      >
        Bancos
      </button>
      {panel === 'banks' && (
        <div className="absolute bottom-full right-0 mb-2 w-[32rem] max-w-[95vw] max-h-[70vh] overflow-auto bg-msx-panelbg border border-msx-border rounded shadow-lg p-3 z-50 text-msx-textprimary space-y-3">
          <div className="flex justify-between items-center">
            <strong>Bancos MegaROM (8 KB)</strong>
            <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setPanel(null)}>✕</button>
          </div>
          {!budget && (
            <p className="text-msx-textsecondary">{busy ? 'Midiendo…' : 'Aún no se ha medido. Pulsa «Recalcular».'}</p>
          )}
          {budget && !budget.banks && (
            <p className="text-red-400 break-words">
              {budget.ramError && !budget.ram
                ? budget.ramError
                : 'El ASM generado no trae el informe de bancos (¿la exportación no es MegaROM?).'}
            </p>
          )}
          {budget?.banks && <Msx2MegaRomBankMap bankMap={budget.banks} />}
          {budget && (
            <div className="text-msx-textsecondary text-[11px]">
              Medido a las {new Date(budget.measuredAt).toLocaleTimeString()}. No se actualiza solo: pulsa «Recalcular».
            </div>
          )}
        </div>
      )}
      {panel === 'memory' && (
        <div className="absolute bottom-full right-0 mb-2 w-96 max-h-[70vh] overflow-auto bg-msx-panelbg border border-msx-border rounded shadow-lg p-3 z-50 text-msx-textprimary space-y-3">
          <div className="flex justify-between items-center">
            <strong>Memoria MSX2 SCREEN 5</strong>
            <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setPanel(null)}>✕</button>
          </div>
          {!budget && <p className="text-msx-textsecondary">Aún no se ha medido. Pulsa «Recalcular».</p>}
          {budget && (
            <>
              <section className="space-y-1">
                <div className="font-semibold">RAM dinámica ({formatHex(ram?.chainBase ?? 0xD000)}–{formatHex((ram?.chainCeiling ?? 0xF000) - 1)})</div>
                {ram ? (
                  <>
                    <Bar used={ramUsed} total={ramTotal} free={ramFree} />
                    <div>
                      Usados <strong>{ramUsed}</strong> / {ramTotal} bytes · libres{' '}
                      <strong className={toneFor(ramFree, ramTotal)}>{ramFree}</strong> (fin en {formatHex(ram.chainEnd)})
                    </div>
                    {ram.chainStart > ram.chainBase && (
                      <div className="text-msx-textsecondary">Skills del player desbordan hasta {formatHex(ram.chainStart)}</div>
                    )}
                    <table className="w-full text-[11px]">
                      <tbody>
                        <tr className="text-msx-textsecondary">
                          <td>Skills del player</td>
                          <td className="text-right">{formatHex(ram.skillsBase)}</td>
                          <td className="text-right">{ram.skillsEnd - ram.skillsBase} B</td>
                        </tr>
                        {[...ram.sections].sort((a, b) => b.bytes - a.bytes).map(section => (
                          <tr key={section.name}>
                            <td>{section.name}</td>
                            <td className="text-right text-msx-textsecondary">{formatHex(section.start)}</td>
                            <td className="text-right">{section.bytes} B</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p className="text-red-400 break-words">{budget.ramError}</p>
                )}
              </section>
              <section className="space-y-1">
                <div className="font-semibold">Ventana residente (#4000–#BFFF)</div>
                {resident?.status === 'ok' ? (
                  <>
                    <Bar used={resident.usedBytes!} total={residentTotal} free={resident.freeBytes!} />
                    <div>
                      Usados <strong>{resident.usedBytes}</strong> / {residentTotal} bytes · libres{' '}
                      <strong className={toneFor(resident.freeBytes!, residentTotal)}>{resident.freeBytes}</strong>
                    </div>
                  </>
                ) : (
                  <p className={resident?.status === 'overflow' ? 'text-red-400' : 'text-msx-textsecondary'}>{resident?.message}</p>
                )}
                <p className="text-msx-textsecondary text-[11px]">
                  Es lo que suele agotarse primero. Los datos que van a bancos MegaROM no cuentan aquí.
                </p>
              </section>
              <div className="text-msx-textsecondary text-[11px]">
                Medido a las {new Date(budget.measuredAt).toLocaleTimeString()}. No se actualiza solo.
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
};
