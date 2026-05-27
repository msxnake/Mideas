import React from 'react';
import {
  Msx2Shooter60HzFrameBudgetSummary,
  Msx2ShooterBudgetIssue,
} from '../../utils/msx2ShooterRuntime';

interface Msx2Shooter60HzFrameBudgetViewProps {
  frameBudget: Msx2Shooter60HzFrameBudgetSummary | null | undefined;
  validation?: Msx2ShooterBudgetIssue[];
  compact?: boolean;
}

const statusTextClass = (status: Msx2Shooter60HzFrameBudgetSummary['frameBudgetStatus']): string => {
  if (status === 'error') return 'text-red-300';
  if (status === 'warning') return 'text-yellow-200';
  return 'text-green-300';
};

const statusBarClass = (status: Msx2Shooter60HzFrameBudgetSummary['frameBudgetStatus']): string => {
  if (status === 'error') return 'bg-red-500';
  if (status === 'warning') return 'bg-yellow-500';
  return 'bg-green-500';
};

export const Msx2Shooter60HzFrameBudgetView: React.FC<Msx2Shooter60HzFrameBudgetViewProps> = ({
  frameBudget,
  validation = [],
  compact = false,
}) => {
  if (!frameBudget) return null;

  const worstUsagePct = Math.max(
    0,
    Math.min(100, Math.round((frameBudget.worstCaseCycles / frameBudget.maxFrameCycles) * 100))
  );
  const estimatedUsagePct = Math.max(
    0,
    Math.min(100, Math.round((frameBudget.estimatedCycles / frameBudget.maxFrameCycles) * 100))
  );

  return (
    <div className={`rounded border border-msx-border/70 bg-msx-bgcolor/40 ${compact ? 'p-1.5' : 'p-2'} space-y-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-msx-highlight font-semibold">60 Hz frame budget</span>
        <span className={`text-[10px] uppercase tracking-wide ${statusTextClass(frameBudget.frameBudgetStatus)}`}>
          {frameBudget.frameBudgetStatus}
        </span>
      </div>
      <div className="text-msx-textsecondary">
        Profile <strong className="text-msx-textprimary">{frameBudget.activeIrqProfile}</strong>
        {' · '}
        target <strong className="text-msx-textprimary">{frameBudget.targetHz} fps</strong>
        {frameBudget.scrollRowRoutine ? (
          <>
            {' · '}
            scroll <span className="font-mono text-[10px]">{frameBudget.scrollRowRoutine}</span>
          </>
        ) : null}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-msx-textsecondary">
          <span>Worst case</span>
          <span>
            {frameBudget.worstCaseCycles}/{frameBudget.maxFrameCycles} cyc
            {' '}({worstUsagePct}%)
          </span>
        </div>
        <div className="h-1.5 rounded bg-msx-panelbg overflow-hidden">
          <div
            className={`h-full ${statusBarClass(frameBudget.frameBudgetStatus)}`}
            style={{ width: `${worstUsagePct}%` }}
          />
        </div>
        {!compact && (
          <div className="text-[10px] text-msx-textsecondary">
            Estimate {frameBudget.estimatedCycles} cyc ({estimatedUsagePct}%)
            {' · '}
            headroom worst {frameBudget.worstCaseHeadroomCycles} cyc
            {' · '}
            est {frameBudget.estimatedHeadroomCycles} cyc
          </div>
        )}
      </div>
      {validation.length > 0 && (
        <div className="space-y-0.5">
          {validation.slice(0, compact ? 2 : 4).map(issue => (
            <div
              key={`${issue.code}_${issue.message}`}
              className={`text-[10px] ${issue.severity === 'error' ? 'text-red-300' : 'text-yellow-200'}`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
