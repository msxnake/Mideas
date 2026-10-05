import React from 'react';
import {
  MEGAROM_BANK_BYTES,
  type Screen5BankEntry,
  type Screen5BankKind,
  type Screen5BankMap,
} from '../../utils/msx2Screen5MemoryBudget';

const KIND_LABEL: Record<Screen5BankKind, string> = {
  resident: 'Residente',
  data: 'Datos',
  music: 'Música',
  'intro-code': 'Intro (código)',
  'intro-image': 'Intro (imágenes)',
  'fx-code': 'Efecto (código)',
  'tfx-code': 'Transiciones (código)',
  reserved: 'Reservado (SCC)',
  free: 'Libre',
};

const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

const rowLabel = (entry: Screen5BankEntry) =>
  entry.kind === 'data' && entry.blockCount && entry.blockCount > 1
    ? `${KIND_LABEL.data} ×${entry.blockCount}`
    : KIND_LABEL[entry.kind];

const rowTitle = (entry: Screen5BankEntry) => {
  const lines = [`Banco ${entry.bank} · ${KIND_LABEL[entry.kind]}`];
  if (entry.kind === 'reserved') {
    lines.push('Sus 6 bits bajos son #3F: con ese valor en #9000 la ventana #9800-#9FFF mostraría el SCC, así que el generador no pone datos aquí.');
  } else if (entry.kind === 'free') {
    lines.push('Banco vacío: la ROM se exporta con un número de bancos potencia de 2, y estos son el relleno. Cabe contenido nuevo aquí sin que la ROM crezca.');
  } else if (entry.used === undefined) {
    lines.push('No se pudo medir (hace falta una compilación correcta).');
  } else {
    lines.push(`Usado ${entry.used} · libre ${MEGAROM_BANK_BYTES - entry.used} de ${MEGAROM_BANK_BYTES} bytes`);
    if (entry.kind === 'music') {
      lines.push('Medido por los #FF finales del banco; aunque sobre sitio, el banco es solo de música.');
    }
  }
  if (entry.blocks?.length) {
    const hidden = (entry.blockCount ?? entry.blocks.length) - entry.blocks.length;
    lines.push(...entry.blocks.map(label => `· ${label}`));
    if (hidden > 0) lines.push(`· … y ${hidden} más`);
  }
  return lines.join('\n');
};

/** Red = used part of the 8 KB bank, green = unused part. Grey = reserved or not measurable. */
const BankBar: React.FC<{ entry: Screen5BankEntry }> = ({ entry }) => {
  if (entry.kind === 'reserved') {
    return <div className="flex-1 h-3 rounded border border-msx-border bg-gray-600/60" />;
  }
  if (entry.used === undefined) {
    return <div className="flex-1 h-3 rounded border border-msx-border bg-gray-500/30" />;
  }
  const usedPercent = Math.min(100, Math.max(0, (entry.used / MEGAROM_BANK_BYTES) * 100));
  return (
    <div className="flex-1 h-3 flex rounded border border-msx-border overflow-hidden bg-green-500">
      <div className="h-full bg-red-500" style={{ width: `${usedPercent}%` }} />
    </div>
  );
};

const LegendSwatch: React.FC<{ className: string; label: string }> = ({ className, label }) => (
  <span className="flex items-center gap-1">
    <span className={`inline-block w-3 h-3 rounded-sm border border-msx-border ${className}`} />
    {label}
  </span>
);

/**
 * One bar per 8 KB bank of the MegaROM image: banks 0-3 are the resident boot
 * image (#4000-#BFFF), the rest are the data/music/intro banks the generator
 * packs after it.
 */
export const Msx2MegaRomBankMap: React.FC<{ bankMap: Screen5BankMap }> = ({ bankMap }) => {
  const measurable = bankMap.banks.filter(entry => entry.kind !== 'reserved');
  const measured = measurable.filter(entry => entry.used !== undefined);
  const usedBytes = measured.reduce((total, entry) => total + (entry.used ?? 0), 0);
  const capacityBytes = measured.length * MEGAROM_BANK_BYTES;
  const reservedCount = bankMap.banks.filter(entry => entry.kind === 'reserved').length;
  const freeBankCount = bankMap.banks.filter(entry => entry.kind === 'free').length;
  const unmeasuredCount = measurable.length - measured.length;

  return (
    <div className="space-y-2">
      <div className="text-msx-textsecondary">
        ROM exportada: {bankMap.bankCount} bancos × 8 KB = <strong className="text-msx-textprimary">{formatKB(bankMap.bankCount * MEGAROM_BANK_BYTES)}</strong>
        {' '}(siempre potencia de 2). Con contenido: {bankMap.contentBankCount}
        {freeBankCount > 0 && <> · <strong className="text-green-400">{freeBankCount} {freeBankCount === 1 ? 'libre' : 'libres'}</strong> de relleno</>}
        {reservedCount > 0 && <> · {reservedCount} reservado{reservedCount === 1 ? '' : 's'} para el SCC</>}
      </div>
      <div>
        Usado <strong className="text-red-400">{formatKB(usedBytes)}</strong> · libre{' '}
        <strong className="text-green-400">{formatKB(capacityBytes - usedBytes)}</strong>
        {unmeasuredCount > 0 && <span className="text-msx-textsecondary"> · {unmeasuredCount} sin medir</span>}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-msx-textsecondary">
        <LegendSwatch className="bg-red-500" label="usado" />
        <LegendSwatch className="bg-green-500" label="libre" />
        <LegendSwatch className="bg-gray-600/60" label="reservado SCC" />
        <LegendSwatch className="bg-gray-500/30" label="sin medir" />
      </div>
      <div className="space-y-px text-[11px]">
        {bankMap.banks.map(entry => (
          <div key={entry.bank} className="flex items-center gap-2" title={rowTitle(entry)}>
            <span className="w-7 shrink-0 text-right tabular-nums text-msx-textsecondary">{entry.bank}</span>
            <BankBar entry={entry} />
            <span className="w-24 shrink-0 text-right tabular-nums">
              {entry.kind === 'reserved' ? '—' : entry.used === undefined ? '?' : `${entry.used}/${MEGAROM_BANK_BYTES}`}
            </span>
            <span className="w-28 shrink-0 truncate text-msx-textsecondary">{rowLabel(entry)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
