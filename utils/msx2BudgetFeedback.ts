export interface Msx2BudgetFeedback {
  scope: 'msx2_screen4_ide_budget_feedback';
  status: 'ok' | 'warning' | 'error';
  project: {
    name?: string;
    backend?: string;
    screenMode?: string;
    romMode?: string;
    mapper?: string;
  };
  rom: {
    bankSizeBytes: number;
    payloadBytes: number;
    estimatedPackedBankCount: number;
    warningThresholdBytes: number;
    usedPercentOfSingleBank: number;
    warningBankCount: number;
    warningRecommendationCount: number;
    bankClassSummary: any[];
  };
  ram: {
    start?: string;
    limit?: string;
    usedBytes: number;
    freeBytes: number;
    status: string;
    warningCount: number;
    sections: any[];
  };
  runtimeModules?: {
    included: any[];
    excluded: any[];
    all: any[];
    includedCount: number;
    residentCount: number;
    farCodeCount: number;
    worldSpecificCount: number;
  };
  worldBankManifest?: {
    worldCount: number;
    estimatedPhysicalBankCount: number;
    dataWindowAddress?: string;
    packageCount: number;
    warningBankCount: number;
    overBudgetBankCount: number;
    worlds: any[];
    estimatedPhysicalBanks: any[];
  };
  screen4RuntimeLayerPolicy?: Record<string, any>;
  worldPackages: any[];
  largestAssets: Array<{
    id: string;
    usedBytes: number;
    bankClass?: string;
    warning: boolean;
    overBudgetBytes: number;
  }>;
  warnings: {
    romRecommendations: any[];
    warningPackedBanks: any[];
    ramRecommendations: any[];
  };
  suggestedFixes: Array<{
    severity: string;
    target?: string;
    reason?: string;
    action?: string;
  }>;
  resolverCandidates?: Array<{
    id: string;
    eligible: boolean;
    stage: string;
    retryKind: string;
    reason: string;
    priority?: number;
    requires?: string[];
    blockedBy?: string;
    implementedPart?: string;
    missingPart?: string;
    unsupportedReason?: string;
    splitPackageCount?: number;
    regenerate?: Record<string, any>;
  }>;
  automaticResolutionPlan?: {
    scope: string;
    status: 'ready' | 'blocked' | 'manual' | 'resolved';
    nextCandidateId?: string | null;
    nextAutomaticAction?: string | null;
    eligibleCandidateIds: string[];
    blockedCandidateIds: string[];
    blockedReasons: Array<{
      id?: string;
      reason?: string;
      blockedBy?: string;
      readinessStatus?: string;
      implementedPart?: string;
      missingPart?: string;
      unsupportedReason?: string;
      splitPackageCount?: number;
    }>;
    attemptCount: number;
    resolvedCandidateId?: string | null;
  };
}

export interface Msx2BudgetPressureSummary {
  residentCoreBytes: number;
  worldContentBytes: number;
  otherBytes: number;
  residentCoreClasses: any[];
  worldContentClasses: any[];
  otherClasses: any[];
}

const isResidentCoreBankClass = (id: string): boolean =>
  /(core|engine|runtime|resident|common|fixed|boot)/i.test(id);

const isWorldContentBankClass = (id: string): boolean =>
  /(world|screen|graphics|sprite|tile|map|entity|animation|attack|behavior|manifest)/i.test(id);

export const summarizeMsx2BudgetPressure = (feedback: Msx2BudgetFeedback | null | undefined): Msx2BudgetPressureSummary => {
  const classes = Array.isArray(feedback?.rom?.bankClassSummary) ? feedback?.rom.bankClassSummary || [] : [];
  const summary: Msx2BudgetPressureSummary = {
    residentCoreBytes: 0,
    worldContentBytes: 0,
    otherBytes: 0,
    residentCoreClasses: [],
    worldContentClasses: [],
    otherClasses: []
  };

  for (const item of classes) {
    const id = String(item?.id || item?.bankClass || '');
    const usedBytes = Number(item?.usedBytes || 0);
    if (isResidentCoreBankClass(id)) {
      summary.residentCoreBytes += usedBytes;
      summary.residentCoreClasses.push(item);
    } else if (isWorldContentBankClass(id)) {
      summary.worldContentBytes += usedBytes;
      summary.worldContentClasses.push(item);
    } else {
      summary.otherBytes += usedBytes;
      summary.otherClasses.push(item);
    }
  }

  return summary;
};

export const extractMideasArtifactCommentBlock = (sourceCode: string, fileName: string): string | null => {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(sourceCode || '').match(
    new RegExp(
      `; \\[\\[\\[MIDEAS_ARTIFACT:${escaped}:BEGIN\\]\\]\\]\\n([\\s\\S]*?)\\n; \\[\\[\\[MIDEAS_ARTIFACT:${escaped}:END\\]\\]\\]`,
      'i'
    )
  );
  if (!match) return null;
  return match[1]
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*;\s?/, ''))
    .join('\n');
};

export const parseMideasJsonArtifact = (sourceCode: string, fileName: string): any | null => {
  const content = extractMideasArtifactCommentBlock(sourceCode, fileName);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
};

export const buildMsx2BudgetFeedbackFromAsm = (sourceCode: string): Msx2BudgetFeedback | null => {
  const projectSlice = parseMideasJsonArtifact(sourceCode, 'project_slice.json');
  const logicalBudget = parseMideasJsonArtifact(sourceCode, 'logical_bank_budget.json');
  const artifactWorldBankManifest = parseMideasJsonArtifact(sourceCode, 'msx2_world_bank_manifest.json');
  const ramBudget = parseMideasJsonArtifact(sourceCode, 'ram_budget.json');
  if (!projectSlice || projectSlice.scope !== 'msx2_screen4_project_slice' || !logicalBudget || !ramBudget) {
    return null;
  }

  const packages = Array.isArray(logicalBudget.packages) ? logicalBudget.packages : [];
  const romRecommendations = Array.isArray(logicalBudget.recoveryRecommendations)
    ? logicalBudget.recoveryRecommendations.filter((item: any) => item && ['warning', 'plan_b'].includes(item.severity))
    : [];
  const allRomRecommendations = Array.isArray(logicalBudget.recoveryRecommendations)
    ? logicalBudget.recoveryRecommendations.filter((item: any) => item)
    : [];
  const warningPackedBanks = Array.isArray(logicalBudget.warningPackedBanks) ? logicalBudget.warningPackedBanks : [];
  const ramRecommendations = Array.isArray(ramBudget.recommendations)
    ? ramBudget.recommendations.filter((item: any) => item && ['warning', 'plan_b'].includes(item.severity))
    : [];
  const suggestedFixes = [
    ...allRomRecommendations.map((item: any) => ({
      severity: item.severity || 'info',
      target: item.target,
      reason: item.reason,
      action: item.action
    })),
    ...(Array.isArray(logicalBudget.recoveryPlan) ? logicalBudget.recoveryPlan : [])
      .filter((step: any) => step && ['recommended', 'required', 'enforced'].includes(step.status))
      .map((step: any) => ({
        severity: step.status,
        target: Array.isArray(step.appliesTo) && step.appliesTo.length ? step.appliesTo.join(', ') : step.id,
        reason: step.trigger,
        action: step.action
      })),
    ...ramRecommendations.map((item: any) => ({
      severity: item.severity || 'info',
      target: item.target,
      reason: item.reason,
      action: item.action
    }))
  ];
  const estimatedPackedBankCount = Number(logicalBudget.estimatedPackedBankCount || 0);
  const screen4DataBankPlan = projectSlice.screen4DataBankPlan;
  const needsUnsupportedMultiBankLoader = estimatedPackedBankCount > 1 && !(
    screen4DataBankPlan
    && screen4DataBankPlan.supported === true
    && Number(screen4DataBankPlan.bankCount || 0) >= estimatedPackedBankCount
  );
  let status: Msx2BudgetFeedback['status'] = 'ok';
  if (romRecommendations.length || warningPackedBanks.length || ramRecommendations.length) status = 'warning';
  if (
    (Array.isArray(logicalBudget.overBudgetPackages) && logicalBudget.overBudgetPackages.length)
    || (ramBudget.status && ramBudget.status !== 'ok')
    || needsUnsupportedMultiBankLoader
  ) {
    status = 'error';
  }
  const includedRuntimeModules = Array.isArray(projectSlice.includedRuntimeModuleDetails)
    ? projectSlice.includedRuntimeModuleDetails
    : (Array.isArray(projectSlice.includedRuntimeModules) ? projectSlice.includedRuntimeModules.map((id: any) => ({ id })) : []);
  const excludedRuntimeModules = Array.isArray(projectSlice.excludedRuntimeModules) ? projectSlice.excludedRuntimeModules : [];
  const runtimeModuleDetails = Array.isArray(projectSlice.runtimeModuleDetails)
    ? projectSlice.runtimeModuleDetails
    : [
      ...includedRuntimeModules.map((item: any) => ({ ...item, included: true })),
      ...excludedRuntimeModules.map((item: any) => ({ ...item, included: false }))
    ];
  const includedRuntimeModuleDetails = includedRuntimeModules.map((item: any) => ({
    id: item?.id ?? item,
    placement: item?.placement || 'unknown',
    reason: item?.reason,
  }));
  const worldBankManifest = artifactWorldBankManifest || projectSlice.worldBankManifest || null;
  const manifestWorlds = Array.isArray(worldBankManifest?.worlds) ? worldBankManifest.worlds : [];
  const manifestPhysicalBanks = Array.isArray(worldBankManifest?.estimatedPhysicalBanks) ? worldBankManifest.estimatedPhysicalBanks : [];
  const manifestPackageCount = manifestWorlds.reduce((sum: number, world: any) =>
    sum + (Array.isArray(world?.packages) ? world.packages.length : 0), 0);
  const manifestWarningBankCount = manifestPhysicalBanks.filter((bank: any) => bank?.status === 'warning' || bank?.warning === true).length;
  const manifestOverBudgetBankCount = manifestPhysicalBanks.filter((bank: any) => bank?.status === 'error' || Number(bank?.overBudgetBytes || 0) > 0).length;
  const largestAssets = [...packages]
    .sort((a: any, b: any) => Number(b?.usedBytes || 0) - Number(a?.usedBytes || 0))
    .slice(0, 8)
    .map((item: any) => ({
      id: item.id,
      usedBytes: Number(item.usedBytes || 0),
      bankClass: item.recommendedBankClass,
      warning: Boolean(item.warning),
      overBudgetBytes: Number(item.overBudgetBytes || 0)
    }));
  const resolverCandidates = buildMsx2BudgetResolverCandidates({
    status,
    logicalBudget,
    ramBudget,
    manifestOverBudgetBankCount,
    manifestWarningBankCount,
    largestAssets,
    screen4DataBankPlan
  });

  return {
    scope: 'msx2_screen4_ide_budget_feedback',
    status,
    project: {
      name: projectSlice.projectName,
      backend: projectSlice.backend,
      screenMode: projectSlice.screenMode,
      romMode: projectSlice.romMode,
      mapper: projectSlice.mapper
    },
    rom: {
      bankSizeBytes: Number(logicalBudget.bankSizeBytes || 8192),
      payloadBytes: Number(logicalBudget.totalPayloadBytes || 0),
      estimatedPackedBankCount,
      warningThresholdBytes: Number(logicalBudget.warningThresholdBytes || 0),
      usedPercentOfSingleBank: Number(logicalBudget.bankSizeBytes || 8192)
        ? Math.round((Number(logicalBudget.totalPayloadBytes || 0) / Number(logicalBudget.bankSizeBytes || 8192)) * 10000) / 100
        : 0,
      warningBankCount: warningPackedBanks.length,
      warningRecommendationCount: romRecommendations.length,
      bankClassSummary: Array.isArray(logicalBudget.bankClassSummary) ? logicalBudget.bankClassSummary : []
    },
    ram: {
      start: ramBudget.start,
      limit: ramBudget.limit,
      usedBytes: Number(ramBudget.usedBytes || 0),
      freeBytes: Number(ramBudget.freeBytes || 0),
      status: ramBudget.status || 'unknown',
      warningCount: ramRecommendations.length,
      sections: Array.isArray(ramBudget.sections) ? ramBudget.sections : []
    },
    runtimeModules: {
      included: includedRuntimeModuleDetails,
      excluded: excludedRuntimeModules,
      all: runtimeModuleDetails,
      includedCount: includedRuntimeModuleDetails.length,
      residentCount: includedRuntimeModuleDetails.filter((item: any) => item.placement === 'resident').length,
      farCodeCount: includedRuntimeModuleDetails.filter((item: any) => item.placement === 'far_code').length,
      worldSpecificCount: includedRuntimeModuleDetails.filter((item: any) => item.placement === 'world_specific').length
    },
    worldBankManifest: worldBankManifest ? {
      worldCount: manifestWorlds.length,
      estimatedPhysicalBankCount: manifestPhysicalBanks.length,
      dataWindowAddress: worldBankManifest.dataWindowAddress,
      packageCount: manifestPackageCount,
      warningBankCount: manifestWarningBankCount,
      overBudgetBankCount: manifestOverBudgetBankCount,
      worlds: manifestWorlds,
      estimatedPhysicalBanks: manifestPhysicalBanks,
    } : undefined,
    screen4RuntimeLayerPolicy: projectSlice.screen4RuntimeLayerPolicy,
    worldPackages: Array.isArray(projectSlice.worldPackageSummary) ? projectSlice.worldPackageSummary : [],
    largestAssets,
    warnings: {
      romRecommendations,
      warningPackedBanks,
      ramRecommendations
    },
    suggestedFixes,
    resolverCandidates,
    automaticResolutionPlan: buildMsx2AutomaticResolutionPlan(
      'msx2_screen4_megarom_preflight_resolution_plan',
      resolverCandidates
    )
  };
};

const buildMsx2AutomaticResolutionPlan = (
  scope: string,
  resolverCandidates: NonNullable<Msx2BudgetFeedback['resolverCandidates']> = [],
  resolverAttempts: any[] = []
): NonNullable<Msx2BudgetFeedback['automaticResolutionPlan']> => {
  const candidates = Array.isArray(resolverCandidates)
    ? resolverCandidates.filter((item) => item && typeof item === 'object')
    : [];
  const attempts = Array.isArray(resolverAttempts)
    ? resolverAttempts.filter((item) => item && typeof item === 'object')
    : [];
  const eligible = candidates
    .filter((item) => item.id && item.eligible !== false)
    .sort((a, b) => Number(a.priority || 100) - Number(b.priority || 100));
  const blocked = candidates.filter((item) => item.id && item.eligible === false);
  const resolvedAttempt = [...attempts].reverse().find((item) => item.status === 'resolved') || null;
  const nextCandidate = eligible[0] || null;
  const status = resolvedAttempt
    ? 'resolved'
    : nextCandidate
      ? 'ready'
      : blocked.length
        ? 'blocked'
        : 'manual';
  return {
    scope,
    status,
    nextCandidateId: nextCandidate?.id || null,
    nextAutomaticAction: nextCandidate
      ? (nextCandidate.regenerate?.postAsmRules || nextCandidate.retryKind || null)
      : null,
    eligibleCandidateIds: eligible.map((item) => String(item.id)),
    blockedCandidateIds: blocked.map((item) => String(item.id)),
    blockedReasons: blocked
      .filter((item) => item.blockedBy || item.missingPart || item.unsupportedReason)
      .map((item) => ({
        id: item.id,
        reason: item.reason,
        blockedBy: item.blockedBy,
        implementedPart: item.implementedPart,
        missingPart: item.missingPart,
        unsupportedReason: item.unsupportedReason,
        splitPackageCount: item.splitPackageCount
      })),
    attemptCount: attempts.length,
    resolvedCandidateId: resolvedAttempt?.candidateId || null
  };
};

const buildMsx2BudgetResolverCandidates = ({
  status,
  logicalBudget,
  ramBudget,
  manifestOverBudgetBankCount,
  manifestWarningBankCount,
  largestAssets,
  screen4DataBankPlan
}: {
  status: Msx2BudgetFeedback['status'];
  logicalBudget: any;
  ramBudget: any;
  manifestOverBudgetBankCount: number;
  manifestWarningBankCount: number;
  largestAssets: Msx2BudgetFeedback['largestAssets'];
  screen4DataBankPlan?: any;
}): NonNullable<Msx2BudgetFeedback['resolverCandidates']> => {
  const candidates: NonNullable<Msx2BudgetFeedback['resolverCandidates']> = [];
  const overBudgetPackageCount = Array.isArray(logicalBudget?.overBudgetPackages) ? logicalBudget.overBudgetPackages.length : 0;
  const estimatedPackedBankCount = Number(logicalBudget?.estimatedPackedBankCount || 0);
  const splitPackages = Array.isArray(logicalBudget?.splitPackages) ? logicalBudget.splitPackages : [];
  const screen4DataBankUnsupportedReason = String(screen4DataBankPlan?.unsupportedReason || '');
  const multiBankSupported = screen4DataBankPlan
    && screen4DataBankPlan.supported === true
    && Number(screen4DataBankPlan.bankCount || 0) >= estimatedPackedBankCount;
  const overBudgetAssetCount = Array.isArray(largestAssets)
    ? largestAssets.filter((item) => Number(item?.overBudgetBytes || 0) > 0).length
    : 0;
  const ramStatus = String(ramBudget?.status || 'unknown');
  if (ramStatus && ramStatus !== 'ok' && ramStatus !== 'unknown') {
    candidates.push({
      id: 'reduce_runtime_ram',
      eligible: false,
      stage: 'precompile',
      retryKind: 'authoring_or_runtime_layout_change',
      reason: 'RAM overflow needs smaller live pools, smaller hot caches, or fewer active runtime systems.',
      blockedBy: 'automatic RAM layout reducer is not implemented yet'
    });
  }
  if (estimatedPackedBankCount > 1 && !multiBankSupported) {
    const splitChunkBlocked = screen4DataBankUnsupportedReason === 'split_packages_require_physical_chunk_labels'
      || splitPackages.length > 0;
    candidates.push({
      id: 'emit_multi_bank_world_data_loader',
      eligible: false,
      stage: 'asm_generation',
      retryKind: 'regenerate_asm',
      reason: splitChunkBlocked
        ? 'The logical allocator already split oversized world packages into chunks, but the ASM loader cannot yet bind chunks to physical labels.'
        : 'The logical allocator produced multiple SCREEN 4 data banks, but this plan is not marked supported by the current loader.',
      blockedBy: splitChunkBlocked
        ? 'chunk-to-label SCREEN 4 physical loader is not implemented yet'
        : 'multi-bank SCREEN 4 data loader is not implemented for this plan',
      unsupportedReason: screen4DataBankUnsupportedReason || undefined,
      splitPackageCount: splitPackages.length,
      implementedPart: 'normal per-screen multi-bank SCREEN 4 loader is available when no package chunks are required',
      missingPart: splitChunkBlocked
        ? 'ASM generator must emit chunk-owned physical labels and loader code that copies each chunk through the selected data bank'
        : 'screen4DataBankPlan must describe a supported per-screen physical bank layout'
    });
  }
  if (overBudgetPackageCount > 0 || Number(manifestOverBudgetBankCount || 0) > 0 || overBudgetAssetCount > 0 || status === 'error') {
    candidates.push({
      id: 'enable_zx0_preprocess',
      eligible: true,
      stage: 'preflight',
      retryKind: 'regenerate_asm',
      reason: 'A logical or estimated bank overflow can often be resolved by re-emitting ASM after ZX0 preprocessing.',
      requires: ['source build used screenCompression=false'],
      regenerate: {
        argsRemove: ['screenCompression=false'],
        argsAdd: []
      }
    });
    candidates.push({
      id: 'split_over_budget_world_packages',
      eligible: false,
      stage: 'precompile',
      retryKind: 'repack_world_banks',
      reason: 'The precompiler can budget-split oversized world packages, but chunk-to-label physical SCREEN 4 loading is still pending.',
      blockedBy: 'chunk-to-label SCREEN 4 physical loader is not implemented yet',
      implementedPart: 'logical budget emits auto_world_package_chunk entries for splittable world packages',
      missingPart: 'ASM generator must emit chunk-owned physical labels and loader code that copies each chunk through the selected data bank',
      splitPackageCount: splitPackages.length
    });
  } else if (Number(manifestWarningBankCount || 0) > 0 || status === 'warning') {
    candidates.push({
      id: 'relax_strict_warning_gate',
      eligible: true,
      stage: 'preflight',
      retryKind: 'same_artifacts',
      reason: 'Only warning-level bank pressure is present; a non-strict build can continue while preserving diagnostics.',
      regenerate: {
        argsRemove: ['strict warning gate'],
        argsAdd: []
      }
    });
  }
  return candidates;
};
