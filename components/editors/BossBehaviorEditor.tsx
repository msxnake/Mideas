import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Boss,
  BossAttack,
  BossBehaviorAction,
  BossBehaviorActionType,
  BossBehaviorTarget,
  BossForm,
  BossPhase,
  ProjectAsset,
  ScreenMap,
  Tile,
} from '../../types';
import { Button } from '../common/Button';
import { renderScreenToCanvas } from '../utils/screenUtils';
import { renderBossPhaseToCanvas } from '../utils/bossRenderUtils';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ClockIcon,
  FireIcon,
  LockIcon,
  PlusCircleIcon,
  ShieldIcon,
  SwapVertIcon,
  TrashIcon,
  ViewfinderCircleIcon,
} from '../icons/MsxIcons';

interface BossBehaviorEditorProps {
  boss: Boss;
  phase: BossPhase;
  allAssets: ProjectAsset[];
  currentScreenMode: string;
  onUpdatePhase: (patch: Partial<BossPhase>) => void;
  onUpdateBoss: (patch: Partial<Boss>) => void;
}

const DEFAULT_TARGET: BossBehaviorTarget = { type: 'fixed', xChar: 16, yChar: 10 };
const CURRENT_FORM_ID = '__phase_current_form';

const ACTION_LABELS: Record<BossBehaviorActionType, string> = {
  wait: 'Wait',
  moveTo: 'Move To',
  attack: 'Attack',
  slam: 'Slam',
  protect: 'Protect',
  shield: 'Shield',
  setForm: 'Set Form',
  animateForm: 'Animate Form',
  loop: 'Loop',
};

const actionDuration = (action: BossBehaviorAction): number => {
  switch (action.type) {
    case 'wait':
      return action.frames;
    case 'moveTo':
      return action.durationFrames;
    case 'attack':
      return Math.max(1, action.delayAfterFrames ?? 1);
    case 'slam':
      return action.windupFrames + action.slamFrames + (action.holdFrames ?? 0) + action.returnFrames;
    case 'protect':
    case 'shield':
      return action.durationFrames;
    case 'setForm':
      return 1;
    case 'animateForm':
      return Math.max(1, action.frameDurationFrames) * Math.max(1, action.formIds.length) * Math.max(1, action.loops);
    case 'loop':
      return 1;
    default:
      return 1;
  }
};

const createActionId = (type: BossBehaviorActionType) => `boss_behavior_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const createDefaultAction = (type: BossBehaviorActionType, attacks: BossAttack[]): BossBehaviorAction => {
  const id = createActionId(type);
  switch (type) {
    case 'wait':
      return { id, type, frames: 30 };
    case 'moveTo':
      return { id, type, target: { ...DEFAULT_TARGET }, durationFrames: 40, easing: 'linear' };
    case 'attack':
      return { id, type, attackId: attacks[0]?.id, target: { type: 'playerCurrent' }, delayAfterFrames: 12 };
    case 'slam':
      return {
        id,
        type,
        target: { type: 'playerCurrent' },
        direction: 'target',
        distanceChars: 4,
        windupFrames: 18,
        slamFrames: 8,
        holdFrames: 8,
        returnFrames: 18,
      };
    case 'protect':
      return { id, type, enabled: true, durationFrames: 60, damageReductionPercent: 100 };
    case 'shield':
      return { id, type, enabled: true, durationFrames: 90, hp: 3 };
    case 'setForm':
      return { id, type };
    case 'animateForm':
      return { id, type, formIds: [], frameDurationFrames: 8, loops: 1 };
    case 'loop':
      return { id, type, targetIndex: 0 };
    default:
      return { id, type: 'wait', frames: 30 };
  }
};

const targetSummary = (target?: BossBehaviorTarget): string => {
  if (!target) return 'No target';
  switch (target.type) {
    case 'fixed':
      return `Fixed ${target.xChar ?? 0},${target.yChar ?? 0}`;
    case 'playerCurrent':
      return 'Player';
    case 'playerPredicted':
      return `Player +${target.framesAhead ?? 20}f`;
    case 'playerLastKnown':
      return 'Last known';
    case 'bossRelative':
      return `Relative ${target.dxChar ?? 0},${target.dyChar ?? 0}`;
    default:
      return 'Target';
  }
};

interface BehaviorEvaluation {
  xChar: number;
  yChar: number;
  targetXChar?: number;
  targetYChar?: number;
  activeActionId?: string;
  formId?: string;
  shieldActive: boolean;
  protectActive: boolean;
  attackActive: boolean;
}

const resolvePreviewTarget = (
  target: BossBehaviorTarget | undefined,
  bossX: number,
  bossY: number,
  playerX: number,
  playerY: number
) => {
  if (!target) return { xChar: bossX, yChar: bossY };
  switch (target.type) {
    case 'fixed':
      return { xChar: target.xChar ?? bossX, yChar: target.yChar ?? bossY };
    case 'playerCurrent':
    case 'playerLastKnown':
      return { xChar: playerX, yChar: playerY };
    case 'playerPredicted':
      return { xChar: playerX + Math.max(1, Math.round((target.framesAhead ?? 20) / 20)), yChar: playerY };
    case 'bossRelative':
      return { xChar: bossX + (target.dxChar ?? 0), yChar: bossY + (target.dyChar ?? 0) };
    default:
      return { xChar: bossX, yChar: bossY };
  }
};

const clampLerp = (from: number, to: number, progress: number) => from + (to - from) * Math.max(0, Math.min(1, progress));

const evaluateBehaviorAtFrame = (
  loop: BossBehaviorAction[],
  frame: number,
  startX: number,
  startY: number,
  playerX: number,
  playerY: number,
  initialFormId?: string
): BehaviorEvaluation => {
  let xChar = startX;
  let yChar = startY;
  let formId = initialFormId;
  let cursor = 0;

  for (const action of loop) {
    const duration = actionDuration(action);
    const localFrame = frame - cursor;
    const isActive = localFrame >= 0 && localFrame < duration;

    if (action.type === 'moveTo') {
      const target = resolvePreviewTarget(action.target, xChar, yChar, playerX, playerY);
      if (isActive) {
        const progress = duration <= 1 ? 1 : localFrame / duration;
        return {
          xChar: clampLerp(xChar, target.xChar, progress),
          yChar: clampLerp(yChar, target.yChar, progress),
          targetXChar: target.xChar,
          targetYChar: target.yChar,
          activeActionId: action.id,
          formId,
          shieldActive: false,
          protectActive: false,
          attackActive: false,
        };
      }
      xChar = target.xChar;
      yChar = target.yChar;
    } else if (action.type === 'slam') {
      const target = resolvePreviewTarget(action.target, xChar, yChar, playerX, playerY);
      let slamTargetX = target.xChar;
      let slamTargetY = target.yChar;
      if (action.direction && action.direction !== 'target') {
        slamTargetX = xChar + (action.direction === 'left' ? -action.distanceChars : action.direction === 'right' ? action.distanceChars : 0);
        slamTargetY = yChar + (action.direction === 'up' ? -action.distanceChars : action.direction === 'down' ? action.distanceChars : 0);
      }

      if (isActive) {
        const windupEnd = action.windupFrames;
        const slamEnd = windupEnd + action.slamFrames;
        const holdEnd = slamEnd + (action.holdFrames ?? 0);
        if (localFrame < windupEnd) {
          return { xChar, yChar, targetXChar: slamTargetX, targetYChar: slamTargetY, activeActionId: action.id, shieldActive: false, protectActive: false, attackActive: false };
        }
        if (localFrame < slamEnd) {
          const progress = (localFrame - windupEnd) / Math.max(1, action.slamFrames);
          return {
            xChar: clampLerp(xChar, slamTargetX, progress),
            yChar: clampLerp(yChar, slamTargetY, progress),
            targetXChar: slamTargetX,
            targetYChar: slamTargetY,
            activeActionId: action.id,
            formId,
            shieldActive: false,
            protectActive: false,
            attackActive: false,
          };
        }
        if (localFrame < holdEnd) {
          return { xChar: slamTargetX, yChar: slamTargetY, targetXChar: slamTargetX, targetYChar: slamTargetY, activeActionId: action.id, formId, shieldActive: false, protectActive: false, attackActive: false };
        }
        const progress = (localFrame - holdEnd) / Math.max(1, action.returnFrames);
        return {
          xChar: clampLerp(slamTargetX, xChar, progress),
          yChar: clampLerp(slamTargetY, yChar, progress),
          targetXChar: slamTargetX,
          targetYChar: slamTargetY,
          activeActionId: action.id,
          formId,
          shieldActive: false,
          protectActive: false,
          attackActive: false,
        };
      }
    } else if (action.type === 'setForm') {
      if (isActive) {
        return { xChar, yChar, activeActionId: action.id, formId: action.formId || formId, shieldActive: false, protectActive: false, attackActive: false };
      }
      formId = action.formId || formId;
    } else if (action.type === 'animateForm') {
      if (isActive) {
        const formIds = action.formIds.length > 0 ? action.formIds : formId ? [formId] : [];
        const frameIndex = formIds.length > 0
          ? Math.floor(localFrame / Math.max(1, action.frameDurationFrames)) % formIds.length
          : 0;
        return { xChar, yChar, activeActionId: action.id, formId: formIds[frameIndex] || formId, shieldActive: false, protectActive: false, attackActive: false };
      }
      if (action.formIds.length > 0) {
        formId = action.formIds[action.formIds.length - 1];
      }
    } else if (isActive) {
      const hasTarget = 'target' in action;
      const target = hasTarget ? resolvePreviewTarget(action.target, xChar, yChar, playerX, playerY) : undefined;
      return {
        xChar,
        yChar,
        targetXChar: target?.xChar,
        targetYChar: target?.yChar,
        activeActionId: action.id,
        formId,
        shieldActive: action.type === 'shield' && action.enabled,
        protectActive: action.type === 'protect' && action.enabled,
        attackActive: action.type === 'attack',
      };
    }

    cursor += duration;
  }

  return { xChar, yChar, formId, shieldActive: false, protectActive: false, attackActive: false };
};

const actionSummary = (action: BossBehaviorAction, attacks: BossAttack[]): string => {
  switch (action.type) {
    case 'wait':
      return `${action.frames}f`;
    case 'moveTo':
      return `${targetSummary(action.target)} ${action.durationFrames}f`;
    case 'attack': {
      const attack = attacks.find(candidate => candidate.id === action.attackId);
      return `${attack?.type || 'Attack'} -> ${targetSummary(action.target)}`;
    }
    case 'slam':
      return `${targetSummary(action.target)} ${actionDuration(action)}f`;
    case 'protect':
      return `${action.enabled ? 'On' : 'Off'} ${action.durationFrames}f`;
    case 'shield':
      return `${action.enabled ? 'On' : 'Off'} ${action.durationFrames}f`;
    case 'setForm':
      return action.formId || 'No form';
    case 'animateForm':
      return `${action.formIds.length} forms · ${action.frameDurationFrames}f`;
    case 'loop':
      return `to #${action.targetIndex + 1}`;
    default:
      return '';
  }
};

const getActionIcon = (type: BossBehaviorActionType) => {
  switch (type) {
    case 'wait':
      return <ClockIcon className="w-4 h-4" />;
    case 'moveTo':
      return <ViewfinderCircleIcon className="w-4 h-4" />;
    case 'attack':
      return <FireIcon className="w-4 h-4" />;
    case 'slam':
      return <ArrowDownIcon className="w-4 h-4" />;
    case 'protect':
      return <LockIcon className="w-4 h-4" />;
    case 'shield':
      return <ShieldIcon className="w-4 h-4" />;
    case 'setForm':
      return <ViewfinderCircleIcon className="w-4 h-4" />;
    case 'animateForm':
      return <ArrowPathIcon className="w-4 h-4" />;
    case 'loop':
      return <ArrowPathIcon className="w-4 h-4" />;
    default:
      return <PlusCircleIcon className="w-4 h-4" />;
  }
};

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cloneMatrix = <T,>(matrix: T[][] | undefined): T[][] => (matrix || []).map(row => [...row]);

const createCurrentPhaseForm = (phase: BossPhase): BossForm => ({
  id: CURRENT_FORM_ID,
  name: 'Current Graphic',
  dimensions: { ...(phase.dimensions || { width: 1, height: 1 }) },
  tileMatrix: cloneMatrix(phase.tileMatrix),
  collisionMatrix: cloneMatrix(phase.collisionMatrix),
  weakPoints: phase.weakPoints ? JSON.parse(JSON.stringify(phase.weakPoints)) : undefined,
});

const formToPreviewPhase = (phase: BossPhase, form: BossForm | undefined): BossPhase => {
  if (!form || form.id === CURRENT_FORM_ID) return phase;
  return {
    ...phase,
    buildType: 'tile',
    dimensions: form.dimensions,
    tileMatrix: form.tileMatrix,
    collisionMatrix: form.collisionMatrix,
    weakPoints: form.weakPoints,
  };
};

export const BossBehaviorEditor: React.FC<BossBehaviorEditorProps> = ({
  boss,
  phase,
  allAssets,
  currentScreenMode,
  onUpdatePhase,
  onUpdateBoss,
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(phase.behaviorLoop?.[0]?.id || null);
  const [playheadFrame, setPlayheadFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggedAnimationFormId, setDraggedAnimationFormId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const attacks = boss.attacks || [];
  const behaviorLoop = phase.behaviorLoop || [];
  const selectedAction = behaviorLoop.find(action => action.id === selectedActionId) || behaviorLoop[0] || null;
  const selectedIndex = selectedAction ? behaviorLoop.findIndex(action => action.id === selectedAction.id) : -1;
  const totalFrames = behaviorLoop.reduce((sum, action) => sum + actionDuration(action), 0);

  const screenAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'screenmap' && asset.data),
    [allAssets]
  );
  const selectedScreenAsset = useMemo(() => {
    const linkedScreenAsset = screenAssets.find(asset => asset.id === boss.linkedScreenId);
    if (linkedScreenAsset) return linkedScreenAsset;

    return screenAssets.find(asset => {
      const screen = asset.data as ScreenMap;
      return (screen.bossInstances || []).some(instance => instance.bossAssetId === boss.id);
    }) || null;
  }, [screenAssets, boss.linkedScreenId, boss.id]);
  const selectedScreen = (selectedScreenAsset?.data as ScreenMap | undefined) || null;
  const selectedScreenBossInstance = useMemo(() => (
    (selectedScreen?.bossInstances || []).find(instance => instance.bossAssetId === boss.id) || null
  ), [selectedScreen, boss.id]);
  const tileset = useMemo(
    () => allAssets.filter(asset => asset.type === 'tile' && asset.data).map(asset => asset.data as Tile),
    [allAssets]
  );
  const currentPhaseForm = useMemo(() => createCurrentPhaseForm(phase), [phase]);
  const forms = useMemo(() => [currentPhaseForm, ...(phase.forms || [])], [currentPhaseForm, phase.forms]);
  const initialFormId = phase.initialFormId || forms[0]?.id;

  const startX = boss.behaviorPreviewStartXChar ?? selectedScreenBossInstance?.xChar ?? 12;
  const startY = boss.behaviorPreviewStartYChar ?? selectedScreenBossInstance?.yChar ?? 8;
  const playerX = boss.behaviorPreviewPlayerXChar ?? 16;
  const playerY = boss.behaviorPreviewPlayerYChar ?? 18;
  const bossWidth = phase.dimensions?.width || 2;
  const bossHeight = phase.dimensions?.height || 2;
  const previewState = useMemo(
    () => evaluateBehaviorAtFrame(behaviorLoop, playheadFrame, startX, startY, playerX, playerY, initialFormId),
    [behaviorLoop, playheadFrame, startX, startY, playerX, playerY, initialFormId]
  );
  const previewForm = forms.find(form => form.id === previewState.formId) || currentPhaseForm;
  const previewPhase = formToPreviewPhase(phase, previewForm);

  useEffect(() => {
    if (!selectedScreenBossInstance) return;
    const patch: Partial<Boss> = {};
    if (!boss.linkedScreenId && selectedScreenAsset?.id) {
      patch.linkedScreenId = selectedScreenAsset.id;
    }
    if (!Number.isFinite(boss.behaviorPreviewStartXChar)) {
      patch.behaviorPreviewStartXChar = selectedScreenBossInstance.xChar;
    }
    if (!Number.isFinite(boss.behaviorPreviewStartYChar)) {
      patch.behaviorPreviewStartYChar = selectedScreenBossInstance.yChar;
    }
    if (Object.keys(patch).length > 0) {
      onUpdateBoss(patch);
    }
  }, [
    boss.behaviorPreviewStartXChar,
    boss.behaviorPreviewStartYChar,
    boss.linkedScreenId,
    onUpdateBoss,
    selectedScreenAsset?.id,
    selectedScreenBossInstance,
  ]);

  const updateLoop = (nextLoop: BossBehaviorAction[]) => {
    onUpdatePhase({ behaviorLoop: nextLoop });
    if (!selectedActionId && nextLoop[0]) setSelectedActionId(nextLoop[0].id);
  };

  const addAction = (type: BossBehaviorActionType) => {
    const action = createDefaultAction(type, attacks);
    if (action.type === 'setForm') {
      action.formId = forms[0]?.id;
    }
    if (action.type === 'animateForm') {
      action.formIds = forms.slice(0, 2).map(form => form.id);
    }
    const nextLoop = [...behaviorLoop, action];
    onUpdatePhase({ behaviorLoop: nextLoop });
    setSelectedActionId(action.id);
  };

  const captureCurrentForm = () => {
    const nextForm: BossForm = {
      ...createCurrentPhaseForm(phase),
      id: `boss_form_${Date.now()}`,
      name: `Form ${(phase.forms || []).length + 1}`,
    };
    onUpdatePhase({
      forms: [...(phase.forms || []), nextForm],
      initialFormId: phase.initialFormId || nextForm.id,
    });
  };

  const updateForm = (formId: string, patch: Partial<BossForm>) => {
    if (formId === CURRENT_FORM_ID) return;
    onUpdatePhase({
      forms: (phase.forms || []).map(form => form.id === formId ? { ...form, ...patch } : form),
    });
  };

  const deleteForm = (formId: string) => {
    if (formId === CURRENT_FORM_ID) return;
    const nextForms = (phase.forms || []).filter(form => form.id !== formId);
    const nextLoop = behaviorLoop.map(action => {
      if (action.type === 'setForm' && action.formId === formId) {
        return { ...action, formId: nextForms[0]?.id || CURRENT_FORM_ID } as BossBehaviorAction;
      }
      if (action.type === 'animateForm') {
        return { ...action, formIds: action.formIds.filter(id => id !== formId) } as BossBehaviorAction;
      }
      return action;
    });
    onUpdatePhase({
      forms: nextForms,
      initialFormId: phase.initialFormId === formId ? nextForms[0]?.id : phase.initialFormId,
      behaviorLoop: nextLoop,
    });
  };

  useEffect(() => {
    if (totalFrames <= 0 && playheadFrame !== 0) {
      setPlayheadFrame(0);
      return;
    }
    if (totalFrames > 0 && playheadFrame >= totalFrames) {
      setPlayheadFrame(totalFrames - 1);
    }
  }, [playheadFrame, totalFrames]);

  useEffect(() => {
    if (!isPlaying || totalFrames <= 0) return;
    const intervalId = window.setInterval(() => {
      setPlayheadFrame(current => (current + 1) % totalFrames);
    }, 1000 / 30);
    return () => window.clearInterval(intervalId);
  }, [isPlaying, totalFrames]);

  const updateAction = (actionId: string, patch: Partial<BossBehaviorAction>) => {
    updateLoop(behaviorLoop.map(action => action.id === actionId ? { ...action, ...patch } as BossBehaviorAction : action));
  };

  const deleteAction = (actionId: string) => {
    const actionIndex = behaviorLoop.findIndex(action => action.id === actionId);
    const nextLoop = behaviorLoop.filter(action => action.id !== actionId);
    onUpdatePhase({ behaviorLoop: nextLoop });
    setSelectedActionId(nextLoop[Math.max(0, actionIndex - 1)]?.id || nextLoop[0]?.id || null);
  };

  const duplicateAction = (action: BossBehaviorAction) => {
    const copy = { ...JSON.parse(JSON.stringify(action)), id: createActionId(action.type) } as BossBehaviorAction;
    const insertIndex = behaviorLoop.findIndex(candidate => candidate.id === action.id) + 1;
    const nextLoop = [...behaviorLoop];
    nextLoop.splice(insertIndex, 0, copy);
    onUpdatePhase({ behaviorLoop: nextLoop });
    setSelectedActionId(copy.id);
  };

  const moveAction = (actionId: string, direction: -1 | 1) => {
    const index = behaviorLoop.findIndex(action => action.id === actionId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= behaviorLoop.length) return;
    const nextLoop = [...behaviorLoop];
    const [action] = nextLoop.splice(index, 1);
    nextLoop.splice(targetIndex, 0, action);
    onUpdatePhase({ behaviorLoop: nextLoop });
  };

  const getAnimationFormsInDisplayOrder = (action: Extract<BossBehaviorAction, { type: 'animateForm' }>) => {
    const formById = new Map(forms.map(form => [form.id, form]));
    const selectedForms = action.formIds
      .map(formId => formById.get(formId))
      .filter((form): form is BossForm => Boolean(form));
    const selectedFormIds = new Set(selectedForms.map(form => form.id));
    const unselectedForms = forms.filter(form => !selectedFormIds.has(form.id));
    return [...selectedForms, ...unselectedForms];
  };

  const reorderAnimationForm = (
    action: Extract<BossBehaviorAction, { type: 'animateForm' }>,
    draggedFormId: string,
    targetFormId: string
  ) => {
    if (draggedFormId === targetFormId) return;
    const fromIndex = action.formIds.indexOf(draggedFormId);
    const toIndex = action.formIds.indexOf(targetFormId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextFormIds = [...action.formIds];
    const [draggedForm] = nextFormIds.splice(fromIndex, 1);
    nextFormIds.splice(toIndex, 0, draggedForm);
    updateAction(action.id, { formIds: nextFormIds } as Partial<BossBehaviorAction>);
  };

  const updateTarget = (target: BossBehaviorTarget | undefined, patch: Partial<BossBehaviorTarget>): BossBehaviorTarget => ({
    ...(target || DEFAULT_TARGET),
    ...patch,
  });

  const setSelectedActionFixedTarget = (xChar: number, yChar: number) => {
    if (!selectedAction || !('target' in selectedAction)) return;
    updateAction(selectedAction.id, {
      target: { type: 'fixed', xChar, yChar },
    } as Partial<BossBehaviorAction>);
  };

  const handleStageClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedAction || !('target' in selectedAction)) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX / 8);
    const y = Math.floor((event.clientY - rect.top) * scaleY / 8);
    const maxX = Math.max(0, (selectedScreen?.width || 32) - bossWidth);
    const maxY = Math.max(0, (selectedScreen?.height || 24) - bossHeight);
    setSelectedActionFixedTarget(Math.max(0, Math.min(maxX, x)), Math.max(0, Math.min(maxY, y)));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const widthTiles = selectedScreen?.width || 32;
    const heightTiles = selectedScreen?.height || 24;
    const tileSize = 8;
    canvas.width = widthTiles * tileSize;
    canvas.height = heightTiles * tileSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    if (selectedScreen) {
      renderScreenToCanvas(canvas, selectedScreen, tileset, currentScreenMode, tileSize);
    } else {
      ctx.fillStyle = '#101820';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= widthTiles; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= heightTiles; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(canvas.width, y * tileSize);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 220, 180, 0.10)';
    ctx.strokeStyle = '#00dcb4';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX * tileSize + 0.5, startY * tileSize + 0.5, bossWidth * tileSize - 1, bossHeight * tileSize - 1);

    ctx.fillStyle = 'rgba(84, 85, 237, 0.35)';
    ctx.strokeStyle = '#7d76fc';
    ctx.beginPath();
    ctx.arc((playerX + 0.5) * tileSize, (playerY + 0.5) * tileSize, tileSize * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const target = selectedAction && 'target' in selectedAction ? selectedAction.target : undefined;
    if (target?.type === 'fixed') {
      const tx = target.xChar ?? startX;
      const ty = target.yChar ?? startY;
      ctx.strokeStyle = '#ffef5a';
      ctx.fillStyle = 'rgba(255,239,90,0.18)';
      ctx.beginPath();
      ctx.moveTo((startX + bossWidth / 2) * tileSize, (startY + bossHeight / 2) * tileSize);
      ctx.lineTo((tx + bossWidth / 2) * tileSize, (ty + bossHeight / 2) * tileSize);
      ctx.stroke();
      ctx.fillRect(tx * tileSize, ty * tileSize, bossWidth * tileSize, bossHeight * tileSize);
      ctx.save();
      ctx.globalAlpha = 0.45;
      renderBossPhaseToCanvas(ctx, previewPhase, allAssets, tileset, currentScreenMode, tileSize, tx, ty);
      ctx.restore();
      ctx.strokeRect(tx * tileSize + 0.5, ty * tileSize + 0.5, bossWidth * tileSize - 1, bossHeight * tileSize - 1);
    }

    if (previewState.targetXChar !== undefined && previewState.targetYChar !== undefined) {
      ctx.strokeStyle = previewState.attackActive ? '#ff5a5a' : '#ffef5a';
      ctx.beginPath();
      ctx.moveTo((previewState.xChar + bossWidth / 2) * tileSize, (previewState.yChar + bossHeight / 2) * tileSize);
      ctx.lineTo((previewState.targetXChar + bossWidth / 2) * tileSize, (previewState.targetYChar + bossHeight / 2) * tileSize);
      ctx.stroke();
    }

    ctx.fillStyle = previewState.shieldActive
      ? 'rgba(66, 235, 245, 0.42)'
      : previewState.protectActive
        ? 'rgba(255, 239, 90, 0.38)'
        : previewState.attackActive
          ? 'rgba(255, 90, 90, 0.34)'
          : 'rgba(0, 220, 180, 0.34)';
    ctx.strokeStyle = previewState.shieldActive
      ? '#42ebf5'
      : previewState.protectActive
        ? '#ffef5a'
        : previewState.attackActive
          ? '#ff5a5a'
          : '#00dcb4';
    ctx.lineWidth = 2;
    ctx.fillRect(previewState.xChar * tileSize, previewState.yChar * tileSize, bossWidth * tileSize, bossHeight * tileSize);
    renderBossPhaseToCanvas(ctx, previewPhase, allAssets, tileset, currentScreenMode, tileSize, previewState.xChar, previewState.yChar);
    ctx.strokeRect(previewState.xChar * tileSize + 0.5, previewState.yChar * tileSize + 0.5, bossWidth * tileSize - 1, bossHeight * tileSize - 1);

    ctx.restore();
  }, [selectedScreen, tileset, currentScreenMode, startX, startY, playerX, playerY, bossWidth, bossHeight, selectedAction, previewState, previewPhase, allAssets]);

  const renderTargetEditor = (
    target: BossBehaviorTarget | undefined,
    onChange: (target: BossBehaviorTarget) => void
  ) => {
    const normalizedTarget = target || DEFAULT_TARGET;
    return (
      <div className="space-y-2 rounded border border-msx-border/40 bg-msx-bgcolor/40 p-2">
        <label className="block text-msx-textsecondary">Target</label>
        <select
          value={normalizedTarget.type}
          onChange={event => {
            const type = event.target.value as BossBehaviorTarget['type'];
            const defaultsByType: Record<BossBehaviorTarget['type'], BossBehaviorTarget> = {
              fixed: { type, xChar: normalizedTarget.xChar ?? 16, yChar: normalizedTarget.yChar ?? 10 },
              playerCurrent: { type },
              playerPredicted: { type, framesAhead: normalizedTarget.framesAhead ?? 20 },
              playerLastKnown: { type },
              bossRelative: { type, dxChar: normalizedTarget.dxChar ?? 0, dyChar: normalizedTarget.dyChar ?? 0 },
            };
            onChange(defaultsByType[type]);
          }}
          className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
        >
          <option value="fixed">Fixed position</option>
          <option value="playerCurrent">Player current</option>
          <option value="playerPredicted">Player predicted</option>
          <option value="playerLastKnown">Player last known</option>
          <option value="bossRelative">Boss relative</option>
        </select>

        {normalizedTarget.type === 'fixed' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-msx-textsecondary">X char</label>
              <input
                type="number"
                value={normalizedTarget.xChar ?? 0}
                onChange={event => onChange(updateTarget(normalizedTarget, { xChar: toNumber(event.target.value) }))}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
              />
            </div>
            <div>
              <label className="block text-msx-textsecondary">Y char</label>
              <input
                type="number"
                value={normalizedTarget.yChar ?? 0}
                onChange={event => onChange(updateTarget(normalizedTarget, { yChar: toNumber(event.target.value) }))}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
              />
            </div>
          </div>
        )}

        {normalizedTarget.type === 'playerPredicted' && (
          <div>
            <label className="block text-msx-textsecondary">Frames ahead</label>
            <input
              type="number"
              min="1"
              value={normalizedTarget.framesAhead ?? 20}
              onChange={event => onChange(updateTarget(normalizedTarget, { framesAhead: Math.max(1, toNumber(event.target.value, 20)) }))}
              className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
            />
          </div>
        )}

        {normalizedTarget.type === 'bossRelative' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-msx-textsecondary">DX chars</label>
              <input
                type="number"
                value={normalizedTarget.dxChar ?? 0}
                onChange={event => onChange(updateTarget(normalizedTarget, { dxChar: toNumber(event.target.value) }))}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
              />
            </div>
            <div>
              <label className="block text-msx-textsecondary">DY chars</label>
              <input
                type="number"
                value={normalizedTarget.dyChar ?? 0}
                onChange={event => onChange(updateTarget(normalizedTarget, { dyChar: toNumber(event.target.value) }))}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-[620px] w-full min-w-0 flex-col gap-3 text-xs">
      <div className="grid min-h-0 grid-cols-[minmax(360px,1fr)_300px] gap-3">
        <div className="min-w-0 space-y-3">
          <div className="rounded border border-msx-border/50 bg-msx-panelbg p-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-msx-highlight">Stage Preview</div>
                <div className="text-[0.65rem] text-msx-textsecondary">Screen background, boss footprint, player marker and selected target</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-msx-textsecondary">
                  X
                  <input
                    type="number"
                    value={startX}
                    onChange={event => onUpdateBoss({ behaviorPreviewStartXChar: toNumber(event.target.value) })}
                    className="w-14 rounded border border-msx-border bg-msx-bgcolor p-1"
                  />
                </label>
                <label className="flex items-center gap-1 text-msx-textsecondary">
                  Y
                  <input
                    type="number"
                    value={startY}
                    onChange={event => onUpdateBoss({ behaviorPreviewStartYChar: toNumber(event.target.value) })}
                    className="w-14 rounded border border-msx-border bg-msx-bgcolor p-1"
                  />
                </label>
                <label className="flex items-center gap-1 text-msx-textsecondary" title="Preview player X position used by Player targets">
                  PX
                  <input
                    type="number"
                    value={playerX}
                    onChange={event => onUpdateBoss({ behaviorPreviewPlayerXChar: toNumber(event.target.value) })}
                    className="w-14 rounded border border-msx-border bg-msx-bgcolor p-1"
                  />
                </label>
                <label className="flex items-center gap-1 text-msx-textsecondary" title="Preview player Y position used by Player targets">
                  PY
                  <input
                    type="number"
                    value={playerY}
                    onChange={event => onUpdateBoss({ behaviorPreviewPlayerYChar: toNumber(event.target.value) })}
                    className="w-14 rounded border border-msx-border bg-msx-bgcolor p-1"
                  />
                </label>
                <label className="flex min-w-44 items-center gap-1 text-msx-textsecondary">
                  Preview Screen
                  <select
                    value={boss.linkedScreenId || selectedScreenAsset?.id || ''}
                    onChange={event => {
                      const linkedScreenId = event.target.value || null;
                      const nextScreen = screenAssets.find(asset => asset.id === linkedScreenId);
                      const nextScreenData = nextScreen?.data as ScreenMap | undefined;
                      const nextBossInstance = (nextScreenData?.bossInstances || []).find(instance => instance.bossAssetId === boss.id);
                      onUpdateBoss({
                        linkedScreenId,
                        ...(nextBossInstance ? {
                          behaviorPreviewStartXChar: boss.behaviorPreviewStartXChar ?? nextBossInstance.xChar,
                          behaviorPreviewStartYChar: boss.behaviorPreviewStartYChar ?? nextBossInstance.yChar,
                        } : {}),
                      });
                    }}
                    className="w-36 rounded border border-msx-border bg-msx-bgcolor p-1"
                  >
                    <option value="">No screen</option>
                    {screenAssets.map(screen => (
                      <option key={screen.id} value={screen.id}>{screen.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="flex min-h-52 items-center justify-center overflow-auto rounded border border-msx-border bg-msx-bgcolor p-2">
              <canvas
                ref={canvasRef}
                className="block max-w-full"
                onClick={handleStageClick}
                style={{ imageRendering: 'pixelated', cursor: selectedAction && 'target' in selectedAction ? 'crosshair' : 'default' }}
              />
            </div>
          </div>

          <div className="rounded border border-msx-border/50 bg-msx-panelbg p-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-msx-highlight">Forms</div>
                <div className="text-[0.65rem] text-msx-textsecondary">Visual poses available in this phase</div>
              </div>
              <Button size="sm" variant="secondary" onClick={captureCurrentForm} icon={<PlusCircleIcon className="w-3 h-3" />}>
                Capture Current
              </Button>
            </div>
            <div className="mb-2 grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
              <label className="text-msx-textsecondary">Initial</label>
              <select
                value={initialFormId || CURRENT_FORM_ID}
                onChange={event => onUpdatePhase({ initialFormId: event.target.value })}
                className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
              >
                {forms.map(form => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
              {forms.map(form => (
                <div key={form.id} className="flex items-center gap-2 rounded border border-msx-border/40 bg-msx-bgcolor/40 p-1">
                  <input
                    type="text"
                    value={form.name}
                    disabled={form.id === CURRENT_FORM_ID}
                    onChange={event => updateForm(form.id, { name: event.target.value })}
                    className="min-w-0 flex-1 rounded border border-msx-border bg-msx-bgcolor p-1 disabled:border-transparent disabled:bg-transparent"
                  />
                  <span className="w-14 text-right font-mono text-[0.6rem] text-msx-textsecondary">{form.dimensions.width}x{form.dimensions.height}</span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteForm(form.id)}
                    disabled={form.id === CURRENT_FORM_ID}
                    icon={<TrashIcon className="w-3 h-3" />}
                  >
                    Del
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-msx-border/50 bg-msx-panelbg p-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-msx-highlight">Timeline</div>
                <div className="text-[0.65rem] text-msx-textsecondary">{behaviorLoop.length} blocks · {totalFrames} frames</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isPlaying ? 'secondary' : 'ghost'}
                  onClick={() => setIsPlaying(current => !current)}
                  disabled={totalFrames <= 0}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsPlaying(false);
                    setPlayheadFrame(0);
                  }}
                  disabled={totalFrames <= 0}
                >
                  Reset
                </Button>
                <span className="w-20 text-right font-mono text-[0.65rem] text-msx-textsecondary">
                  {totalFrames > 0 ? `${playheadFrame}/${Math.max(0, totalFrames - 1)}f` : '0f'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['wait', 'moveTo', 'attack', 'slam', 'protect', 'shield', 'setForm', 'animateForm', 'loop'] as BossBehaviorActionType[]).map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant="ghost"
                    icon={getActionIcon(type)}
                    onClick={() => addAction(type)}
                  >
                    {ACTION_LABELS[type]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="min-h-28 overflow-x-auto rounded border border-msx-border bg-msx-bgcolor p-2">
              {behaviorLoop.length === 0 ? (
                <div className="flex h-20 items-center justify-center text-msx-textsecondary">Add blocks to build the boss loop.</div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, totalFrames - 1)}
                    value={Math.min(playheadFrame, Math.max(0, totalFrames - 1))}
                    onChange={event => {
                      setIsPlaying(false);
                      setPlayheadFrame(toNumber(event.target.value));
                    }}
                    className="w-full h-2 bg-msx-border rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-stretch gap-2">
                    {behaviorLoop.map((action, index) => {
                      const duration = actionDuration(action);
                      const width = Math.max(92, Math.min(220, duration * 3));
                      const selected = selectedAction?.id === action.id;
                      const active = previewState.activeActionId === action.id;
                      return (
                        <button
                          key={action.id}
                          onClick={() => setSelectedActionId(action.id)}
                          className={`relative flex min-h-20 flex-shrink-0 flex-col justify-between rounded border p-2 text-left transition-colors ${
                            selected
                              ? 'border-msx-highlight bg-msx-accent/40 text-white'
                              : active
                                ? 'border-msx-highlight bg-msx-highlight/20'
                                : 'border-msx-border bg-msx-panelbg hover:border-msx-highlight/70'
                          }`}
                          style={{ width }}
                        >
                          {active && <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-msx-highlight" />}
                          <div className="flex items-center gap-1">
                            {getActionIcon(action.type)}
                            <span className="truncate text-[0.7rem] text-msx-highlight">{index + 1}. {ACTION_LABELS[action.type]}</span>
                          </div>
                          <div className="line-clamp-2 text-[0.65rem] text-msx-textsecondary">{actionSummary(action, attacks)}</div>
                          <div className="text-right font-mono text-[0.6rem] text-msx-textsecondary">{duration}f</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded border border-msx-border/50 bg-msx-panelbg p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-msx-highlight">Inspector</div>
              <div className="text-[0.65rem] text-msx-textsecondary">{selectedAction ? ACTION_LABELS[selectedAction.type] : 'No block selected'}</div>
            </div>
            {selectedAction && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => moveAction(selectedAction.id, -1)} disabled={selectedIndex <= 0} icon={<ArrowLeftIcon className="w-3 h-3" />}>Left</Button>
                <Button size="sm" variant="ghost" onClick={() => moveAction(selectedAction.id, 1)} disabled={selectedIndex < 0 || selectedIndex >= behaviorLoop.length - 1} icon={<ArrowRightIcon className="w-3 h-3" />}>Right</Button>
              </div>
            )}
          </div>

          {!selectedAction ? (
            <div className="rounded border border-dashed border-msx-border p-4 text-center text-msx-textsecondary">
              Select or add a block.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-msx-textsecondary">Label</label>
                <input
                  type="text"
                  value={selectedAction.label || ''}
                  placeholder={ACTION_LABELS[selectedAction.type]}
                  onChange={event => updateAction(selectedAction.id, { label: event.target.value } as Partial<BossBehaviorAction>)}
                  className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                />
              </div>

              {selectedAction.type === 'wait' && (
                <div>
                  <label className="block text-msx-textsecondary">Frames</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedAction.frames}
                    onChange={event => updateAction(selectedAction.id, { frames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)}
                    className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                  />
                </div>
              )}

              {selectedAction.type === 'moveTo' && (
                <>
                  {renderTargetEditor(selectedAction.target, target => updateAction(selectedAction.id, { target } as Partial<BossBehaviorAction>))}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-msx-textsecondary">Duration</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedAction.durationFrames}
                        onChange={event => updateAction(selectedAction.id, { durationFrames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Easing</label>
                      <select
                        value={selectedAction.easing || 'linear'}
                        onChange={event => updateAction(selectedAction.id, { easing: event.target.value as any } as Partial<BossBehaviorAction>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                      >
                        <option value="linear">Linear</option>
                        <option value="easeIn">Ease In</option>
                        <option value="easeOut">Ease Out</option>
                        <option value="easeInOut">Ease In Out</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {selectedAction.type === 'attack' && (
                <>
                  <div>
                    <label className="block text-msx-textsecondary">Attack</label>
                    <select
                      value={selectedAction.attackId || ''}
                      onChange={event => updateAction(selectedAction.id, { attackId: event.target.value || undefined } as Partial<BossBehaviorAction>)}
                      className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                    >
                      <option value="">None</option>
                      {attacks.map(attack => (
                        <option key={attack.id} value={attack.id}>{attack.name} ({attack.type})</option>
                      ))}
                    </select>
                  </div>
                  {renderTargetEditor(selectedAction.target, target => updateAction(selectedAction.id, { target } as Partial<BossBehaviorAction>))}
                  <div>
                    <label className="block text-msx-textsecondary">Delay after</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedAction.delayAfterFrames ?? 0}
                      onChange={event => updateAction(selectedAction.id, { delayAfterFrames: Math.max(0, toNumber(event.target.value)) } as Partial<BossBehaviorAction>)}
                      className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                    />
                  </div>
                </>
              )}

              {selectedAction.type === 'slam' && (
                <>
                  {renderTargetEditor(selectedAction.target, target => updateAction(selectedAction.id, { target } as Partial<BossBehaviorAction>))}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-msx-textsecondary">Direction</label>
                      <select
                        value={selectedAction.direction || 'target'}
                        onChange={event => updateAction(selectedAction.id, { direction: event.target.value as any } as Partial<BossBehaviorAction>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                      >
                        <option value="target">Toward target</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="up">Up</option>
                        <option value="down">Down</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Distance chars</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedAction.distanceChars}
                        onChange={event => updateAction(selectedAction.id, { distanceChars: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Windup</label>
                      <input type="number" min="0" value={selectedAction.windupFrames} onChange={event => updateAction(selectedAction.id, { windupFrames: Math.max(0, toNumber(event.target.value)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Slam</label>
                      <input type="number" min="1" value={selectedAction.slamFrames} onChange={event => updateAction(selectedAction.id, { slamFrames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Hold</label>
                      <input type="number" min="0" value={selectedAction.holdFrames ?? 0} onChange={event => updateAction(selectedAction.id, { holdFrames: Math.max(0, toNumber(event.target.value)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Return</label>
                      <input type="number" min="1" value={selectedAction.returnFrames} onChange={event => updateAction(selectedAction.id, { returnFrames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                  </div>
                </>
              )}

              {selectedAction.type === 'protect' && (
                <>
                  <label className="flex items-center gap-2 text-msx-textsecondary">
                    <input
                      type="checkbox"
                      checked={selectedAction.enabled}
                      onChange={event => updateAction(selectedAction.id, { enabled: event.target.checked } as Partial<BossBehaviorAction>)}
                      className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                    />
                    Enabled
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-msx-textsecondary">Duration</label>
                      <input type="number" min="1" value={selectedAction.durationFrames} onChange={event => updateAction(selectedAction.id, { durationFrames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Reduction %</label>
                      <input type="number" min="0" max="100" value={selectedAction.damageReductionPercent ?? 100} onChange={event => updateAction(selectedAction.id, { damageReductionPercent: Math.max(0, Math.min(100, toNumber(event.target.value, 100))) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                  </div>
                </>
              )}

              {selectedAction.type === 'shield' && (
                <>
                  <label className="flex items-center gap-2 text-msx-textsecondary">
                    <input
                      type="checkbox"
                      checked={selectedAction.enabled}
                      onChange={event => updateAction(selectedAction.id, { enabled: event.target.checked } as Partial<BossBehaviorAction>)}
                      className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                    />
                    Enabled
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-msx-textsecondary">Duration</label>
                      <input type="number" min="1" value={selectedAction.durationFrames} onChange={event => updateAction(selectedAction.id, { durationFrames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">HP</label>
                      <input type="number" min="0" value={selectedAction.hp ?? 0} onChange={event => updateAction(selectedAction.id, { hp: Math.max(0, toNumber(event.target.value)) } as Partial<BossBehaviorAction>)} className="w-full rounded border border-msx-border bg-msx-bgcolor p-1" />
                    </div>
                  </div>
                </>
              )}

              {selectedAction.type === 'setForm' && (
                <div>
                  <label className="block text-msx-textsecondary">Form</label>
                  <select
                    value={selectedAction.formId || forms[0]?.id || CURRENT_FORM_ID}
                    onChange={event => updateAction(selectedAction.id, { formId: event.target.value } as Partial<BossBehaviorAction>)}
                    className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                  >
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedAction.type === 'animateForm' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-msx-textsecondary">Frame duration</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedAction.frameDurationFrames}
                        onChange={event => updateAction(selectedAction.id, { frameDurationFrames: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-msx-textsecondary">Loops</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedAction.loops}
                        onChange={event => updateAction(selectedAction.id, { loops: Math.max(1, toNumber(event.target.value, 1)) } as Partial<BossBehaviorAction>)}
                        className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 rounded border border-msx-border/40 bg-msx-bgcolor/40 p-2">
                    <label className="block text-msx-textsecondary">Forms in animation</label>
                    {getAnimationFormsInDisplayOrder(selectedAction).map(form => {
                      const checked = selectedAction.formIds.includes(form.id);
                      const isDragging = draggedAnimationFormId === form.id;
                      return (
                        <label
                          key={form.id}
                          draggable={checked}
                          onDragStart={event => {
                            if (!checked) {
                              event.preventDefault();
                              return;
                            }
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', form.id);
                            setDraggedAnimationFormId(form.id);
                          }}
                          onDragOver={event => {
                            if (!checked || !draggedAnimationFormId || draggedAnimationFormId === form.id) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={event => {
                            event.preventDefault();
                            const draggedFormId = draggedAnimationFormId || event.dataTransfer.getData('text/plain');
                            reorderAnimationForm(selectedAction, draggedFormId, form.id);
                            setDraggedAnimationFormId(null);
                          }}
                          onDragEnd={() => setDraggedAnimationFormId(null)}
                          className={`flex items-center gap-2 rounded px-1 py-0.5 ${checked ? 'cursor-grab hover:bg-msx-border/40' : 'cursor-default opacity-80'} ${isDragging ? 'bg-msx-accent/20 opacity-60' : ''}`}
                          title={checked ? 'Drag to reorder this animation frame' : undefined}
                        >
                          <span className={`flex h-4 w-4 items-center justify-center text-msx-textsecondary ${checked ? '' : 'opacity-30'}`} aria-hidden="true">
                            <SwapVertIcon className="w-3 h-3" />
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={event => {
                              const nextFormIds = event.target.checked
                                ? [...selectedAction.formIds, form.id]
                                : selectedAction.formIds.filter(id => id !== form.id);
                              updateAction(selectedAction.id, { formIds: nextFormIds } as Partial<BossBehaviorAction>);
                            }}
                            className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"
                          />
                          <span className="truncate">{form.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedAction.type === 'loop' && (
                <div>
                  <label className="block text-msx-textsecondary">Target block</label>
                  <select
                    value={selectedAction.targetIndex}
                    onChange={event => updateAction(selectedAction.id, { targetIndex: Math.max(0, toNumber(event.target.value)) } as Partial<BossBehaviorAction>)}
                    className="w-full rounded border border-msx-border bg-msx-bgcolor p-1"
                  >
                    {behaviorLoop.map((action, index) => (
                      <option key={action.id} value={index}>{index + 1}. {ACTION_LABELS[action.type]}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 border-t border-msx-border/40 pt-2">
                <Button size="sm" variant="secondary" onClick={() => duplicateAction(selectedAction)} className="flex-1">
                  Duplicate
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteAction(selectedAction.id)} icon={<TrashIcon className="w-3 h-3" />} className="flex-1">
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
