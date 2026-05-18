"use strict";

const MSX_PALETTE = [
  { index: 0, name: "Transparente", hex: "#000000", rgb: [0, 0, 0] },
  { index: 1, name: "Negro", hex: "#000000", rgb: [0, 0, 0] },
  { index: 2, name: "Verde medio", hex: "#3EB847", rgb: [62, 184, 71] },
  { index: 3, name: "Verde claro", hex: "#74D07D", rgb: [116, 208, 125] },
  { index: 4, name: "Azul oscuro", hex: "#2F2FC1", rgb: [47, 47, 193] },
  { index: 5, name: "Azul claro", hex: "#5858FC", rgb: [88, 88, 252] },
  { index: 6, name: "Rojo oscuro", hex: "#B63125", rgb: [182, 49, 37] },
  { index: 7, name: "Cian", hex: "#68D2DA", rgb: [104, 210, 218] },
  { index: 8, name: "Rojo medio", hex: "#FC584A", rgb: [252, 88, 74] },
  { index: 9, name: "Rojo claro", hex: "#FF8E81", rgb: [255, 142, 129] },
  { index: 10, name: "Amarillo oscuro", hex: "#C0BF3B", rgb: [192, 191, 59] },
  { index: 11, name: "Amarillo claro", hex: "#E7E474", rgb: [231, 228, 116] },
  { index: 12, name: "Verde oscuro", hex: "#309337", rgb: [48, 147, 55] },
  { index: 13, name: "Magenta", hex: "#B640C8", rgb: [182, 64, 200] },
  { index: 14, name: "Gris", hex: "#999999", rgb: [153, 153, 153] },
  { index: 15, name: "Blanco", hex: "#FFFFFF", rgb: [255, 255, 255] },
];

const MIDEAS_MSX1_HEX = [
  "rgba(0,0,0,0)",
  "#000000",
  "#21C842",
  "#5EDC78",
  "#5455ED",
  "#7D76FC",
  "#D4524D",
  "#42EBF5",
  "#FC5554",
  "#FF7978",
  "#D4C154",
  "#E6CE80",
  "#21B03B",
  "#C95BBA",
  "#CCCCCC",
  "#FFFFFF",
];

const BOSS_PACKAGE_SCHEMA = "mideas.boss.v1";
const DIALOGUE_PORTRAIT_PACKAGE_SCHEMA = "mideas.dialoguePortrait.v1";
const DEFAULT_SIMILAR_TILE_PIXEL_THRESHOLD = 5;
const TONE_PRESETS = [
  {
    id: "original",
    label: "Original",
    description: "Sin recolor: usa la paleta MSX mas cercana.",
  },
  {
    id: "gray",
    label: "Gris",
    ramp: [1, 14, 15],
    description: "Negro, gris y blanco para piedra, metal o fotos monocromo.",
  },
  {
    id: "rockCold",
    label: "Roca fria",
    ramp: [1, 4, 14, 15],
    description: "Negro, azul oscuro, gris y blanco: sombras frias con lectura de roca.",
  },
  {
    id: "blue",
    label: "Azul",
    ramp: [1, 4, 5, 7, 15],
    description: "Rampa fria: negro, azules MSX, cian y blanco.",
  },
  {
    id: "red",
    label: "Rojo",
    ramp: [1, 6, 8, 9, 15],
    description: "Rampa calida roja con negro para sombra y blanco para brillo.",
  },
  {
    id: "green",
    label: "Verde",
    ramp: [1, 12, 2, 3, 15],
    description: "Rampa vegetal: verde oscuro, medio, claro y blanco.",
  },
  {
    id: "yellow",
    label: "Amarillo",
    ramp: [1, 10, 11, 15],
    description: "Rampa dorada: negro, amarillos MSX y blanco.",
  },
  {
    id: "sepia",
    label: "Sepia",
    ramp: [1, 6, 10, 11, 15],
    description: "Foto antigua: sombra rojiza, medios amarillos y luces claras.",
  },
  {
    id: "vivid",
    label: "Vivo",
    map: {
      0: 0,
      1: 1,
      2: 3,
      3: 3,
      4: 5,
      5: 5,
      6: 8,
      7: 7,
      8: 8,
      9: 9,
      10: 11,
      11: 11,
      12: 2,
      13: 13,
      14: 14,
      15: 15,
    },
    description: "Sube colores oscuros a sus variantes mas vivas sin cambiar la familia.",
  },
];
const TONE_PRESET_BY_ID = new Map(TONE_PRESETS.map((preset) => [preset.id, preset]));

const elements = {
  fileInput: document.getElementById("fileInput"),
  targetWidth: document.getElementById("targetWidth"),
  targetHeight: document.getElementById("targetHeight"),
  tileInfo: document.getElementById("tileInfo"),
  lockAspectRatio: document.getElementById("lockAspectRatio"),
  resolutionPreset: document.getElementById("resolutionPreset"),
  keepAspect: document.getElementById("keepAspect"),
  nearestScale: document.getElementById("nearestScale"),
  cleanIsolatedPixels: document.getElementById("cleanIsolatedPixels"),
  cleanIsolatedMode: document.getElementById("cleanIsolatedMode"),
  includeCompactAsm: document.getElementById("includeCompactAsm"),
  conversionMode: document.getElementById("conversionMode"),
  pairStrategy: document.getElementById("pairStrategy"),
  toneButtons: Array.from(document.querySelectorAll("[data-tone-preset]")),
  tonePresetInfo: document.getElementById("tonePresetInfo"),
  transparentColor: document.getElementById("transparentColor"),
  addColorRemapButton: document.getElementById("addColorRemapButton"),
  clearColorRemapsButton: document.getElementById("clearColorRemapsButton"),
  colorRemapRows: document.getElementById("colorRemapRows"),
  emptyRemapNote: document.getElementById("emptyRemapNote"),
  asmLabel: document.getElementById("asmLabel"),
  convertButton: document.getElementById("convertButton"),
  trimButton: document.getElementById("trimButton"),
  selectionInfo: document.getElementById("selectionInfo"),
  clearSelectionButton: document.getElementById("clearSelectionButton"),
  showGrid: document.getElementById("showGrid"),
  sourceCanvas: document.getElementById("sourceCanvas"),
  resultCanvas: document.getElementById("resultCanvas"),
  colorCanvas: document.getElementById("colorCanvas"),
  conflictCanvas: document.getElementById("conflictCanvas"),
  asmOutput: document.getElementById("asmOutput"),
  copyAsmButton: document.getElementById("copyAsmButton"),
  downloadAsmButton: document.getElementById("downloadAsmButton"),
  downloadJsonButton: document.getElementById("downloadJsonButton"),
  downloadScrButton: document.getElementById("downloadScrButton"),
  downloadTilesJsonButton: document.getElementById("downloadTilesJsonButton"),
  downloadTablesButton: document.getElementById("downloadTablesButton"),
  downloadSplitTablesButton: document.getElementById("downloadSplitTablesButton"),
  downloadBossButton: document.getElementById("downloadBossButton"),
  downloadPresentationButton: document.getElementById("downloadPresentationButton"),
  downloadPortraitButton: document.getElementById("downloadPortraitButton"),
  downloadPngButton: document.getElementById("downloadPngButton"),
  similarTileThreshold: document.getElementById("similarTileThreshold"),
  findSimilarTilesButton: document.getElementById("findSimilarTilesButton"),
  mergeSimilarTilesButton: document.getElementById("mergeSimilarTilesButton"),
  similarTilesInfo: document.getElementById("similarTilesInfo"),
  statsBox: document.getElementById("statsBox"),
  statusText: document.getElementById("statusText"),
  headerPreview: document.getElementById("headerPreview"),
  headerPreviewCanvas: document.getElementById("headerPreviewCanvas"),
};

let loadedImage = null;
let loadedName = "image";
let latestResult = null;
let latestSourceImageData = null;
let latestExportResult = null;
let exportSelection = null;
let activeSelectionDrag = null;
let similarTileCandidates = [];
let similarTileSelectionIndex = -1;
let lockedAspectRatio = Number(elements.targetWidth.value) / Number(elements.targetHeight.value);
let activeTonePreset = "original";

function init() {
  for (const color of MSX_PALETTE) {
    const option = document.createElement("option");
    option.value = String(color.index);
    option.textContent = `${color.index.toString(16).toUpperCase()} - ${color.name} ${color.hex}`;
    if (color.index === 1) option.selected = true;
    elements.transparentColor.append(option);
  }

  elements.fileInput.addEventListener("change", handleFile);
  elements.convertButton.addEventListener("click", convert);
  elements.trimButton.addEventListener("click", trimLatestResult);
  elements.clearSelectionButton.addEventListener("click", clearExportSelection);
  elements.resolutionPreset.addEventListener("change", applyResolutionPreset);
  elements.conversionMode.addEventListener("change", convert);
  elements.pairStrategy.addEventListener("change", convert);
  elements.cleanIsolatedPixels.addEventListener("change", convert);
  elements.cleanIsolatedMode.addEventListener("change", convert);
  for (const button of elements.toneButtons) {
    button.addEventListener("click", () => setTonePreset(button.dataset.tonePreset));
  }
  elements.transparentColor.addEventListener("change", convert);
  elements.addColorRemapButton.addEventListener("click", () => addColorRemapRow());
  elements.clearColorRemapsButton.addEventListener("click", clearColorRemaps);
  elements.showGrid.addEventListener("change", () => redrawLatest());
  elements.includeCompactAsm.addEventListener("change", () => rebuildLatestOutput());
  elements.asmLabel.addEventListener("input", () => rebuildLatestOutput());
  elements.lockAspectRatio.addEventListener("change", handleAspectLockChange);
  elements.targetWidth.addEventListener("input", handleSizeInputChange);
  elements.targetHeight.addEventListener("input", handleSizeInputChange);
  elements.targetWidth.addEventListener("change", handleSizeInputChange);
  elements.targetHeight.addEventListener("change", handleSizeInputChange);
  elements.copyAsmButton.addEventListener("click", copyAsm);
  elements.downloadAsmButton.addEventListener("click", () => downloadText("asm"));
  elements.downloadJsonButton.addEventListener("click", () => downloadText("json"));
  elements.downloadScrButton.addEventListener("click", downloadScr);
  elements.downloadTilesJsonButton.addEventListener("click", downloadTileEditorCompositeTileJson);
  elements.downloadTablesButton.addEventListener("click", downloadTables);
  elements.downloadSplitTablesButton.addEventListener("click", downloadSplitTables);
  elements.downloadBossButton.addEventListener("click", downloadBossPackage);
  elements.downloadPresentationButton.addEventListener("click", downloadPresentationPackage);
  elements.downloadPortraitButton.addEventListener("click", downloadDialoguePortraitPackage);
  elements.downloadPngButton.addEventListener("click", downloadPreviewPng);
  elements.similarTileThreshold.addEventListener("input", handleSimilarThresholdChange);
  elements.similarTileThreshold.addEventListener("change", handleSimilarThresholdChange);
  elements.findSimilarTilesButton.addEventListener("click", findSimilarTiles);
  elements.mergeSimilarTilesButton.addEventListener("click", mergeAllSimilarTiles);
  elements.resultCanvas.addEventListener("pointerdown", beginExportSelection);
  elements.resultCanvas.addEventListener("pointermove", updateExportSelectionDrag);
  elements.resultCanvas.addEventListener("pointerup", endExportSelectionDrag);
  elements.resultCanvas.addEventListener("pointercancel", endExportSelectionDrag);

  updateSimilarTileSearchLabel();
  updateTonePresetButtons();
  normalizeSizeInputs();
  resetCanvases(256, 192);
}

function setTonePreset(presetId) {
  if (!TONE_PRESET_BY_ID.has(presetId)) return;
  activeTonePreset = presetId;
  updateTonePresetButtons();
  convert();
}

function updateTonePresetButtons() {
  const preset = TONE_PRESET_BY_ID.get(activeTonePreset) ?? TONE_PRESETS[0];
  for (const button of elements.toneButtons) {
    const active = button.dataset.tonePreset === preset.id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
  elements.tonePresetInfo.textContent = preset.description;
}

function addColorRemapRow(from = 1, to = 1) {
  const row = document.createElement("div");
  row.className = "color-remap-row";

  const fromSelect = createPaletteSelect(from);
  fromSelect.className = "remap-from";
  fromSelect.title = "Color MSX origen";

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.textContent = ">";

  const toSelect = createPaletteSelect(to);
  toSelect.className = "remap-to";
  toSelect.title = "Color MSX destino";

  const removeButton = document.createElement("button");
  removeButton.className = "icon-button";
  removeButton.type = "button";
  removeButton.title = "Eliminar sustitucion";
  removeButton.textContent = "X";

  fromSelect.addEventListener("change", convert);
  toSelect.addEventListener("change", convert);
  removeButton.addEventListener("click", () => {
    row.remove();
    refreshRemapEmptyState();
    convert();
  });

  row.append(fromSelect, arrow, toSelect, removeButton);
  elements.colorRemapRows.append(row);
  refreshRemapEmptyState();
  convert();
}

function createPaletteSelect(selectedIndex) {
  const select = document.createElement("select");
  for (const color of MSX_PALETTE) {
    const option = document.createElement("option");
    option.value = String(color.index);
    option.textContent = `${color.index.toString(16).toUpperCase()} ${color.name}`;
    option.style.backgroundColor = color.hex;
    option.style.color = color.index === 1 || color.index === 4 ? "#ffffff" : "#000000";
    option.selected = color.index === selectedIndex;
    select.append(option);
  }
  return select;
}

function clearColorRemaps() {
  for (const row of elements.colorRemapRows.querySelectorAll(".color-remap-row")) {
    row.remove();
  }
  refreshRemapEmptyState();
  convert();
}

function refreshRemapEmptyState() {
  const hasRows = elements.colorRemapRows.querySelector(".color-remap-row") !== null;
  elements.emptyRemapNote.hidden = hasRows;
}

function getColorRemaps() {
  const remaps = [];
  const table = new Map();
  for (const row of elements.colorRemapRows.querySelectorAll(".color-remap-row")) {
    const from = Number(row.querySelector(".remap-from").value);
    const to = Number(row.querySelector(".remap-to").value);
    if (from === to) continue;
    table.set(from, to);
    remaps.push({ from, to });
  }
  return { table, remaps };
}

function getNoiseCleanupConfig() {
  const mode = elements.cleanIsolatedMode.value;
  const profiles = {
    soft: { sameNeighborLimit: 0, dominantNeighborMin: 4 },
    medium: { sameNeighborLimit: 1, dominantNeighborMin: 4 },
    strong: { sameNeighborLimit: 1, dominantNeighborMin: 3 },
  };
  return {
    enabled: elements.cleanIsolatedPixels.checked,
    mode,
    ...(profiles[mode] ?? profiles.soft),
  };
}

async function handleFile(event) {
  const [file] = event.target.files;
  if (!file) return;

  loadedName = file.name.replace(/\.[^.]+$/, "") || "image";
  loadedImage = await loadImageFromFile(file);

  if (elements.keepAspect.checked) {
    const fitted = fitInsideScreen(loadedImage.width, loadedImage.height);
    elements.targetWidth.value = String(fitted.width);
    elements.targetHeight.value = String(fitted.height);
    elements.resolutionPreset.value = presetForSize(fitted.width, fitted.height);
  }
  updateLockedAspectRatio();

  elements.convertButton.disabled = false;
  elements.asmLabel.value = sanitizeAsmLabel(loadedName);
  elements.statusText.textContent = `${loadedImage.width}x${loadedImage.height} cargado`;
  convert();
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen."));
    };
    image.src = url;
  });
}

function fitInsideScreen(width, height) {
  const scale = Math.min(256 / width, 192 / height, 1);
  return {
    width: clampToMultiple(Math.max(8, Math.round((width * scale) / 8) * 8), 8, 256, 8),
    height: clampToMultiple(Math.max(8, Math.round((height * scale) / 8) * 8), 8, 192, 8),
  };
}

function handleAspectLockChange() {
  if (elements.lockAspectRatio.checked) {
    updateLockedAspectRatio();
  }
}

function handleSizeInputChange(event) {
  normalizeSizeInputs(event.currentTarget.id);
  if (!elements.lockAspectRatio.checked) {
    updateLockedAspectRatio();
  }
  convert();
}

function updateLockedAspectRatio() {
  const width = Number(elements.targetWidth.value);
  const height = Number(elements.targetHeight.value);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    lockedAspectRatio = width / height;
  }
}

function normalizeSizeInputs(changedInputId) {
  let width = clampToMultiple(Number(elements.targetWidth.value), 8, 256, 8);
  let height = clampToMultiple(Number(elements.targetHeight.value), 8, 192, 8);

  if (elements.lockAspectRatio.checked && Number.isFinite(lockedAspectRatio) && lockedAspectRatio > 0) {
    if (changedInputId === "targetWidth") {
      height = clampToMultiple(width / lockedAspectRatio, 8, 192, 8);
    } else if (changedInputId === "targetHeight") {
      width = clampToMultiple(height * lockedAspectRatio, 8, 256, 8);
    }
  }

  elements.targetWidth.value = String(width);
  elements.targetHeight.value = String(height);
  elements.resolutionPreset.value = presetForSize(width, height);
  updateTileInfo(width, height);
}

function updateTileInfo(width = Number(elements.targetWidth.value), height = Number(elements.targetHeight.value)) {
  const tileCols = Math.max(1, Math.floor(width / 8));
  const tileRows = Math.max(1, Math.floor(height / 8));
  elements.tileInfo.value = `${tileCols} x ${tileRows} = ${tileCols * tileRows} tiles`;
}

function applyResolutionPreset() {
  if (elements.resolutionPreset.value === "custom") return;
  const [width, height] = elements.resolutionPreset.value.split("x").map(Number);
  elements.targetWidth.value = String(width);
  elements.targetHeight.value = String(height);
  updateLockedAspectRatio();
  convert();
}

function presetForSize(width, height) {
  const value = `${width}x${height}`;
  return [...elements.resolutionPreset.options].some((option) => option.value === value) ? value : "custom";
}

function clampToMultiple(value, min, max, multiple) {
  const numeric = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, Math.round(numeric / multiple) * multiple));
}

function convert() {
  if (!loadedImage) return;

  normalizeSizeInputs();
  const width = Number(elements.targetWidth.value);
  const height = Number(elements.targetHeight.value);
  const scaled = drawScaledImage(loadedImage, width, height);
  const transparentColor = Number(elements.transparentColor.value);
  const result = convertImageDataToScreen2(
    scaled.imageData,
    width,
    height,
    transparentColor,
    elements.conversionMode.value,
    elements.pairStrategy.value,
    activeTonePreset,
    getColorRemaps(),
    getNoiseCleanupConfig(),
  );
  result.compactBanks = buildCompactBanks(result);
  result.similarTileMerges = [];
  result.asm = buildAsm(result, elements.asmLabel.value);
  result.json = buildJson(result);

  latestResult = result;
  latestSourceImageData = scaled.imageData;
  clearExportSelectionState();
  clearSimilarTileSelection("Pulsa buscar para localizar tiles casi iguales.");
  drawSourceCanvas(scaled.imageData, width, height);
  drawResultCanvas(result);
  drawHeaderPreview(result);
  drawColorCanvas(result);
  drawConflictCanvas(result);
  updateOutput(result);
  enableOutputButtons(true);
  elements.statusText.textContent = result.strictFailed
    ? `No valido ${width}x${height}`
    : `Convertido ${width}x${height}`;
}

function trimLatestResult() {
  if (!latestResult) return;

  const transparentColor = Number(elements.transparentColor.value);
  const bounds = findDrawnTileBounds(latestResult, transparentColor);
  if (!bounds) {
    elements.statusText.textContent = "Trim: sin tiles dibujados";
    return;
  }

  if (
    bounds.minTileX === 0 &&
    bounds.minTileY === 0 &&
    bounds.maxTileX === latestResult.cols - 1 &&
    bounds.maxTileY === latestResult.rows - 1
  ) {
    elements.statusText.textContent = "Trim: ya esta ajustado";
    return;
  }

  const trimmedResult = cropScreen2Result(latestResult, bounds);
  trimmedResult.compactBanks = buildCompactBanks(trimmedResult);
  trimmedResult.asm = buildAsm(trimmedResult, elements.asmLabel.value);
  trimmedResult.json = buildJson(trimmedResult);

  const trimmedSource = latestSourceImageData
    ? cropImageData(latestSourceImageData, latestResult.width, bounds)
    : null;

  latestResult = trimmedResult;
  latestSourceImageData = trimmedSource;
  clearExportSelectionState();
  clearSimilarTileSelection("Pulsa buscar para localizar tiles casi iguales.");
  if (trimmedSource) {
    drawSourceCanvas(trimmedSource, trimmedResult.width, trimmedResult.height);
  }
  drawResultCanvas(trimmedResult);
  drawHeaderPreview(trimmedResult);
  drawColorCanvas(trimmedResult);
  drawConflictCanvas(trimmedResult);
  updateOutput(trimmedResult);
  enableOutputButtons(true);

  elements.statusText.textContent =
    `Trim ${latestResult.width}x${latestResult.height} (${latestResult.cols}x${latestResult.rows} tiles)`;
}

function findDrawnTileBounds(result, transparentColor) {
  let minTileX = Infinity;
  let minTileY = Infinity;
  let maxTileX = -Infinity;
  let maxTileY = -Infinity;

  for (const tile of result.tileRows) {
    if (!tileHasDrawnPixels(tile, transparentColor)) continue;
    minTileX = Math.min(minTileX, tile.x);
    minTileY = Math.min(minTileY, tile.y);
    maxTileX = Math.max(maxTileX, tile.x);
    maxTileY = Math.max(maxTileY, tile.y);
  }

  if (!Number.isFinite(minTileX)) return null;
  return { minTileX, minTileY, maxTileX, maxTileY };
}

function tileHasDrawnPixels(tile, transparentColor) {
  for (const row of tile.rows) {
    const ink = (row.colorByte >> 4) & 0x0f;
    const paper = row.colorByte & 0x0f;
    for (let pixel = 0; pixel < 8; pixel += 1) {
      const color = row.patternByte & (1 << (7 - pixel)) ? ink : paper;
      if (color !== transparentColor) return true;
    }
  }
  return false;
}

function cropScreen2Result(result, bounds) {
  const cols = bounds.maxTileX - bounds.minTileX + 1;
  const rows = bounds.maxTileY - bounds.minTileY + 1;
  const width = cols * 8;
  const height = rows * 8;
  const tileRows = [];
  const nameTable = [];
  const patternTable = [];
  const colorTable = [];
  const strictViolations = [];
  let correctedPixels = 0;
  let conflictLines = 0;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const sourceTile = result.tileRows.find((tile) =>
        tile.x === bounds.minTileX + x &&
        tile.y === bounds.minTileY + y
      );
      if (!sourceTile) continue;

      const bank = Math.floor(y / 8);
      const localRow = y % 8;
      const charCode = localRow * 32 + x;
      const rowsCopy = sourceTile.rows.map((row) => {
        if (row.originalColorCount > 2) conflictLines += 1;
        correctedPixels += row.correctedPixels ?? 0;
        return { ...row };
      });
      const tileInfo = {
        ...sourceTile,
        x,
        y,
        bank,
        charCode,
        patternOffset: bank * 2048 + charCode * 8,
        colorOffset: bank * 2048 + charCode * 8,
        rows: rowsCopy,
      };
      tileRows.push(tileInfo);
      nameTable.push(charCode);
      patternTable.push(...rowsCopy.map((row) => row.patternByte));
      colorTable.push(...rowsCopy.map((row) => row.colorByte));
    }
  }

  for (const violation of result.strictViolations) {
    if (
      violation.tileX < bounds.minTileX ||
      violation.tileX > bounds.maxTileX ||
      violation.tileY < bounds.minTileY ||
      violation.tileY > bounds.maxTileY
    ) {
      continue;
    }
    strictViolations.push({
      ...violation,
      tileX: violation.tileX - bounds.minTileX,
      tileY: violation.tileY - bounds.minTileY,
    });
  }

  return {
    ...result,
    width,
    height,
    cols,
    rows,
    nameTable,
    patternTable,
    colorTable,
    tileRows,
    correctedPixels,
    conflictLines,
    strictViolations,
    strictFailed: result.conversionMode === "strict" && strictViolations.length > 0,
    correctedImageData: cropImageData(result.correctedImageData, result.width, bounds),
    trim: {
      sourceWidth: result.width,
      sourceHeight: result.height,
      sourceCols: result.cols,
      sourceRows: result.rows,
      minTileX: bounds.minTileX,
      minTileY: bounds.minTileY,
      maxTileX: bounds.maxTileX,
      maxTileY: bounds.maxTileY,
    },
  };
}

function cropImageData(imageData, sourceWidth, bounds) {
  const sourceX = bounds.minTileX * 8;
  const sourceY = bounds.minTileY * 8;
  const width = (bounds.maxTileX - bounds.minTileX + 1) * 8;
  const height = (bounds.maxTileY - bounds.minTileY + 1) * 8;
  const cropped = new ImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = ((sourceY + y) * sourceWidth + sourceX + x) * 4;
      const targetOffset = (y * width + x) * 4;
      cropped.data[targetOffset] = imageData.data[sourceOffset];
      cropped.data[targetOffset + 1] = imageData.data[sourceOffset + 1];
      cropped.data[targetOffset + 2] = imageData.data[sourceOffset + 2];
      cropped.data[targetOffset + 3] = imageData.data[sourceOffset + 3];
    }
  }

  return cropped;
}

function getActiveExportResult() {
  if (!latestResult) return null;
  if (!exportSelection) return latestResult;
  if (latestExportResult) return latestExportResult;

  const selected = cropScreen2Result(latestResult, exportSelection);
  selected.compactBanks = buildCompactBanks(selected);
  selected.similarTileMerges = latestResult.similarTileMerges ?? [];
  selected.asm = buildAsm(selected, elements.asmLabel.value);
  selected.json = buildJson(selected);
  latestExportResult = selected;
  return selected;
}

function clearExportSelection() {
  if (!exportSelection && !activeSelectionDrag) return;
  clearExportSelectionState();
  refreshExportSelection();
  if (latestResult) {
    elements.statusText.textContent = `Exporta todo ${latestResult.cols}x${latestResult.rows} tiles`;
  }
}

function clearExportSelectionState() {
  exportSelection = null;
  activeSelectionDrag = null;
  latestExportResult = null;
  updateSelectionInfo();
}

function beginExportSelection(event) {
  if (!latestResult || event.button !== 0) return;
  const cell = tileCellFromPointerEvent(event);
  if (!cell) return;

  event.preventDefault();
  elements.resultCanvas.setPointerCapture?.(event.pointerId);
  activeSelectionDrag = {
    pointerId: event.pointerId,
    start: cell,
  };
  setExportSelectionFromCells(cell, cell);
}

function updateExportSelectionDrag(event) {
  if (!activeSelectionDrag || activeSelectionDrag.pointerId !== event.pointerId) return;
  const cell = tileCellFromPointerEvent(event);
  if (!cell) return;
  event.preventDefault();
  setExportSelectionFromCells(activeSelectionDrag.start, cell);
}

function endExportSelectionDrag(event) {
  if (!activeSelectionDrag || activeSelectionDrag.pointerId !== event.pointerId) return;
  const cell = tileCellFromPointerEvent(event);
  if (cell) setExportSelectionFromCells(activeSelectionDrag.start, cell);
  activeSelectionDrag = null;
  elements.resultCanvas.releasePointerCapture?.(event.pointerId);
  refreshExportSelection();
  const result = getActiveExportResult();
  if (result && exportSelection) {
    elements.statusText.textContent = `Seleccion export ${result.cols}x${result.rows} tiles`;
  }
}

function setExportSelectionFromCells(start, end) {
  exportSelection = {
    minTileX: Math.min(start.x, end.x),
    minTileY: Math.min(start.y, end.y),
    maxTileX: Math.max(start.x, end.x),
    maxTileY: Math.max(start.y, end.y),
  };
  latestExportResult = null;
  updateSelectionInfo();
  redrawLatest();
}

function tileCellFromPointerEvent(event) {
  if (!latestResult) return null;
  const rect = elements.resultCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const canvasX = ((event.clientX - rect.left) / rect.width) * latestResult.width;
  const canvasY = ((event.clientY - rect.top) / rect.height) * latestResult.height;
  return {
    x: Math.max(0, Math.min(latestResult.cols - 1, Math.floor(canvasX / 8))),
    y: Math.max(0, Math.min(latestResult.rows - 1, Math.floor(canvasY / 8))),
  };
}

function refreshExportSelection() {
  latestExportResult = null;
  if (!latestResult) return;
  const result = getActiveExportResult();
  redrawLatest();
  updateOutput(result);
  enableOutputButtons(true);
}

function updateSelectionInfo() {
  if (!exportSelection) {
    elements.selectionInfo.textContent = "Exporta todo";
    elements.clearSelectionButton.disabled = true;
    return;
  }

  const cols = exportSelection.maxTileX - exportSelection.minTileX + 1;
  const rows = exportSelection.maxTileY - exportSelection.minTileY + 1;
  elements.selectionInfo.textContent =
    `Export ${cols}x${rows} chars X${exportSelection.minTileX}-${exportSelection.maxTileX} Y${exportSelection.minTileY}-${exportSelection.maxTileY}`;
  elements.clearSelectionButton.disabled = false;
}

function drawScaledImage(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = !elements.nearestScale.checked;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, imageData: ctx.getImageData(0, 0, width, height) };
}

function convertImageDataToScreen2(
  imageData,
  width,
  height,
  transparentColor,
  mode,
  pairStrategy,
  tonePresetId = "original",
  colorRemapConfig = { table: new Map(), remaps: [] },
  noiseCleanupConfig = { enabled: false, mode: "soft", sameNeighborLimit: 0, dominantNeighborMin: 4 },
) {
  const cols = width / 8;
  const rows = height / 8;
  const quantized = new Uint8Array(width * height);
  const opaquePixels = new Uint8Array(width * height);
  const originalRgb = imageData.data;
  const correctedRgb = new Uint8ClampedArray(width * height * 4);
  const patternTable = [];
  const colorTable = [];
  const nameTable = [];
  const tileRows = [];
  let correctedPixels = 0;
  let remappedPixels = 0;
  let noiseCleanedPixels = 0;
  let conflictLines = 0;
  const strictViolations = [];

  for (let i = 0, p = 0; i < originalRgb.length; i += 4, p += 1) {
    if (originalRgb[i + 3] < 128) {
      const remappedTransparent = colorRemapConfig.table.get(transparentColor);
      quantized[p] = remappedTransparent ?? transparentColor;
      if (remappedTransparent !== undefined) remappedPixels += 1;
      continue;
    }
    opaquePixels[p] = 1;
    const baseColor = nearestMsxColor(originalRgb[i], originalRgb[i + 1], originalRgb[i + 2]);
    const convertedColor = mode === "dither"
      ? applyOrderedDither(baseColor, originalRgb[i], originalRgb[i + 1], originalRgb[i + 2], p % width, Math.floor(p / width))
      : baseColor;
    const remappedColor = colorRemapConfig.table.get(convertedColor);
    if (remappedColor !== undefined) {
      quantized[p] = remappedColor;
      remappedPixels += 1;
    } else {
      quantized[p] = convertedColor;
    }
  }

  if (noiseCleanupConfig.enabled) {
    noiseCleanedPixels = cleanIsolatedQuantizedPixels(quantized, opaquePixels, width, height, noiseCleanupConfig);
  }

  for (let tileY = 0; tileY < rows; tileY += 1) {
    for (let tileX = 0; tileX < cols; tileX += 1) {
      const bank = Math.floor(tileY / 8);
      const localRow = tileY % 8;
      const charCode = localRow * 32 + tileX;
      nameTable.push(charCode);

      const tileInfo = {
        x: tileX,
        y: tileY,
        bank,
        charCode,
        patternOffset: bank * 2048 + charCode * 8,
        colorOffset: bank * 2048 + charCode * 8,
        rows: [],
      };

      for (let line = 0; line < 8; line += 1) {
        const y = tileY * 8 + line;
        const colors = [];
        for (let x = tileX * 8; x < tileX * 8 + 8; x += 1) {
          colors.push(quantized[y * width + x]);
        }

        const originalColorCount = new Set(colors).size;
        if (originalColorCount > 2) {
          conflictLines += 1;
          strictViolations.push({ tileX, tileY, line, colorCount: originalColorCount });
        }
        const [sourcePaper, sourceInk] = pickTwoLineColors(colors, pairStrategy);
        const [paper, ink] = applyTonePresetToLineColors(sourcePaper, sourceInk, tonePresetId);
        let patternByte = 0;
        let correctedLinePixels = 0;
        for (let pixel = 0; pixel < 8; pixel += 1) {
          const x = tileX * 8 + pixel;
          const sourceIndex = y * width + x;
          const chosenSourceColor = mode === "strict"
            ? quantized[sourceIndex]
            : chooseInkOrPaper(quantized[sourceIndex], sourceInk, sourcePaper) ? sourceInk : sourcePaper;
          const usesInk = chosenSourceColor === sourceInk && sourceInk !== sourcePaper;
          const chosen = usesInk ? ink : paper;
          if (usesInk && ink !== paper) {
            patternByte |= 1 << (7 - pixel);
          }
          if (chosenSourceColor !== quantized[sourceIndex]) {
            correctedPixels += 1;
            correctedLinePixels += 1;
          }

          const rgbOffset = sourceIndex * 4;
          const drawableColor = mode === "strict" && originalColorCount > 2
            ? quantized[sourceIndex]
            : chosen;
          const [r, g, b] = MSX_PALETTE[drawableColor].rgb;
          correctedRgb[rgbOffset] = r;
          correctedRgb[rgbOffset + 1] = g;
          correctedRgb[rgbOffset + 2] = b;
          correctedRgb[rgbOffset + 3] = 255;
        }

        const colorByte = (ink << 4) | paper;
        patternTable.push(patternByte);
        colorTable.push(colorByte);
        tileInfo.rows.push({
          line,
          ink,
          paper,
          patternByte,
          colorByte,
          originalColorCount,
          correctedPixels: correctedLinePixels,
        });
      }
      tileRows.push(tileInfo);
    }
  }

  return {
    width,
    height,
    cols,
    rows,
    nameTable,
    patternTable,
    colorTable,
    tileRows,
    correctedPixels,
    remappedPixels,
    noiseCleanedPixels,
    noiseCleanup: {
      enabled: Boolean(noiseCleanupConfig.enabled),
      mode: noiseCleanupConfig.mode,
    },
    conflictLines,
    strictViolations,
    strictFailed: mode === "strict" && strictViolations.length > 0,
    conversionMode: mode,
    pairStrategy,
    tonePreset: tonePresetId,
    colorRemaps: colorRemapConfig.remaps,
    correctedImageData: new ImageData(correctedRgb, width, height),
  };
}

function applyOrderedDither(baseColor, r, g, b, x, y) {
  const matrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const threshold = (matrix[y & 3][x & 3] - 7.5) * 7;
  const adjusted = [
    Math.max(0, Math.min(255, r + threshold)),
    Math.max(0, Math.min(255, g + threshold)),
    Math.max(0, Math.min(255, b + threshold)),
  ];
  const dithered = nearestMsxColor(adjusted[0], adjusted[1], adjusted[2]);
  return colorDistance(adjusted, MSX_PALETTE[dithered].rgb) < colorDistance([r, g, b], MSX_PALETTE[baseColor].rgb) * 1.2
    ? dithered
    : baseColor;
}

function cleanIsolatedQuantizedPixels(quantized, opaquePixels, width, height, config) {
  const source = new Uint8Array(quantized);
  const sameNeighborLimit = Number.isFinite(config.sameNeighborLimit) ? config.sameNeighborLimit : 0;
  const dominantNeighborMin = Number.isFinite(config.dominantNeighborMin) ? config.dominantNeighborMin : 4;
  let cleaned = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = y * width + x;
      if (!opaquePixels[offset]) continue;

      const current = source[offset];
      let sameNeighbors = 0;
      let neighborCount = 0;
      const counts = new Map();

      for (let dy = -1; dy <= 1; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const neighbor = source[ny * width + nx];
          neighborCount += 1;
          if (neighbor === current) sameNeighbors += 1;
          counts.set(neighbor, (counts.get(neighbor) ?? 0) + 1);
        }
      }

      if (neighborCount === 0 || sameNeighbors > sameNeighborLimit) continue;

      const [dominantColor, dominantCount] = [...counts.entries()].sort((a, b) =>
        b[1] - a[1] ||
        colorDistance(MSX_PALETTE[a[0]].rgb, MSX_PALETTE[current].rgb) -
        colorDistance(MSX_PALETTE[b[0]].rgb, MSX_PALETTE[current].rgb) ||
        a[0] - b[0]
      )[0] ?? [current, 0];

      if (dominantColor === current || dominantCount < dominantNeighborMin) continue;
      quantized[offset] = dominantColor;
      cleaned += 1;
    }
  }

  return cleaned;
}

function buildCompactBanks(result) {
  const banks = [];
  const totalBanks = Math.ceil(result.rows / 8);

  for (let bank = 0; bank < totalBanks; bank += 1) {
    const bankTiles = result.tileRows.filter((tile) => tile.bank === bank);
    const uniqueByKey = new Map();
    const uniqueTiles = [];
    const nameTable = [];

    for (const tile of bankTiles) {
      const pattern = tile.rows.map((row) => row.patternByte);
      const colors = tile.rows.map((row) => row.colorByte);
      const key = `${pattern.join(".")}|${colors.join(".")}`;
      let uniqueTile = uniqueByKey.get(key);

      if (!uniqueTile) {
        uniqueTile = {
          index: uniqueTiles.length,
          pattern,
          colors,
          uses: 0,
        };
        uniqueByKey.set(key, uniqueTile);
        uniqueTiles.push(uniqueTile);
      }

      uniqueTile.uses += 1;
      nameTable.push(uniqueTile.index);
    }

    banks.push({
      bank,
      cols: result.cols,
      rows: bankTiles.length / result.cols,
      uniqueTiles,
      nameTable,
      overflow: uniqueTiles.length > 256,
    });
  }

  return banks;
}

function nearestMsxColor(r, g, b) {
  let bestIndex = 1;
  let bestDistance = Infinity;
  for (const color of MSX_PALETTE) {
    if (color.index === 0) continue;
    const distance = colorDistance([r, g, b], color.rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = color.index;
    }
  }
  return bestIndex;
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
}

function applyTonePresetToLineColors(paper, ink, presetId) {
  const preset = TONE_PRESET_BY_ID.get(presetId) ?? TONE_PRESET_BY_ID.get("original");
  if (!preset || preset.id === "original") return [paper, ink];

  if (preset.map) {
    return [
      mapToneColor(paper, preset),
      mapToneColor(ink, preset),
    ];
  }

  if (!Array.isArray(preset.ramp) || preset.ramp.length === 0) return [paper, ink];

  let paperLevel = rampLevelForColor(paper, preset.ramp.length);
  let inkLevel = rampLevelForColor(ink, preset.ramp.length);

  if (paper !== ink && paper !== 0 && ink !== 0 && preset.ramp[paperLevel] === preset.ramp[inkLevel]) {
    if (colorLuma(paper) <= colorLuma(ink)) {
      if (paperLevel > 0) {
        paperLevel -= 1;
      } else {
        inkLevel = Math.min(preset.ramp.length - 1, inkLevel + 1);
      }
    } else if (inkLevel > 0) {
      inkLevel -= 1;
    } else {
      paperLevel = Math.min(preset.ramp.length - 1, paperLevel + 1);
    }
  }

  return [
    paper === 0 ? 0 : preset.ramp[paperLevel],
    ink === 0 ? 0 : preset.ramp[inkLevel],
  ];
}

function mapToneColor(colorIndex, preset) {
  if (colorIndex === 0) return 0;
  return preset.map[colorIndex] ?? colorIndex;
}

function rampLevelForColor(colorIndex, rampSize) {
  if (colorIndex === 0) return 0;
  return Math.max(0, Math.min(rampSize - 1, Math.round((colorLuma(colorIndex) / 255) * (rampSize - 1))));
}

function colorLuma(colorIndex) {
  const [r, g, b] = MSX_PALETTE[colorIndex]?.rgb ?? MSX_PALETTE[1].rgb;
  return r * 0.3 + g * 0.59 + b * 0.11;
}

function pickTwoLineColors(colors, strategy) {
  const counts = new Map();
  for (const color of colors) {
    counts.set(color, (counts.get(color) || 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  if (strategy === "bestPalette") {
    const paletteCandidates = MSX_PALETTE
      .map((color) => color.index)
      .filter((index) => index !== 0 || counts.has(0));
    return pickBestColorPair(colors, paletteCandidates);
  }
  if (strategy === "bestPresent" && ranked.length > 2) {
    return pickBestColorPair(colors, ranked.map(([color]) => color));
  }
  const paper = ranked[0]?.[0] ?? 1;
  const ink = ranked[1]?.[0] ?? paper;
  return [paper, ink];
}

function pickBestColorPair(colors, candidates) {
  const uniqueCandidates = [...new Set(candidates)];
  let bestPair = [colors[0] ?? 1, colors[0] ?? 1];
  let bestScore = Infinity;

  for (let a = 0; a < uniqueCandidates.length; a += 1) {
    for (let b = a; b < uniqueCandidates.length; b += 1) {
      const paper = uniqueCandidates[a];
      const ink = uniqueCandidates[b];
      let score = paper === ink ? 2 : 0;

      for (const source of colors) {
        const sourceRgb = MSX_PALETTE[source].rgb;
        score += Math.min(
          colorDistance(sourceRgb, MSX_PALETTE[paper].rgb),
          colorDistance(sourceRgb, MSX_PALETTE[ink].rgb),
        );
      }

      if (score < bestScore) {
        bestScore = score;
        bestPair = [paper, ink];
      }
    }
  }

  return bestPair;
}

function chooseInkOrPaper(source, ink, paper) {
  if (source === ink) return true;
  if (source === paper) return false;
  return colorDistance(MSX_PALETTE[source].rgb, MSX_PALETTE[ink].rgb) <
    colorDistance(MSX_PALETTE[source].rgb, MSX_PALETTE[paper].rgb);
}

function drawSourceCanvas(imageData, width, height) {
  setCanvasSize(elements.sourceCanvas, width, height);
  const ctx = elements.sourceCanvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  drawGrid(ctx, width, height);
  drawExportSelectionOverlay(ctx);
}

function drawResultCanvas(result) {
  setCanvasSize(elements.resultCanvas, result.width, result.height);
  const ctx = elements.resultCanvas.getContext("2d");
  ctx.putImageData(result.correctedImageData, 0, 0);
  drawGrid(ctx, result.width, result.height);
  drawSimilarSelectionOverlay(ctx, result);
  drawExportSelectionOverlay(ctx);
}

function drawHeaderPreview(result) {
  if (!result || result.width > 128 || result.height > 128) {
    elements.headerPreview.hidden = true;
    return;
  }

  const canvas = elements.headerPreviewCanvas;
  const ctx = canvas.getContext("2d");
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = result.width;
  sourceCanvas.height = result.height;
  sourceCanvas.getContext("2d").putImageData(result.correctedImageData, 0, 0);

  setCanvasSize(canvas, 128, 128);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, 128, 128);

  const scale = Math.max(1, Math.floor(Math.min(128 / result.width, 128 / result.height)));
  const width = result.width * scale;
  const height = result.height * scale;
  const x = Math.floor((128 - width) / 2);
  const y = Math.floor((128 - height) / 2);
  ctx.drawImage(sourceCanvas, x, y, width, height);
  elements.headerPreview.hidden = false;
}

function drawColorCanvas(result) {
  setCanvasSize(elements.colorCanvas, result.width, result.height);
  const ctx = elements.colorCanvas.getContext("2d");
  ctx.clearRect(0, 0, result.width, result.height);

  for (const tile of result.tileRows) {
    for (const row of tile.rows) {
      const y = tile.y * 8 + row.line;
      const x = tile.x * 8;
      ctx.fillStyle = MSX_PALETTE[row.paper].hex;
      ctx.fillRect(x, y, 4, 1);
      ctx.fillStyle = MSX_PALETTE[row.ink].hex;
      ctx.fillRect(x + 4, y, 4, 1);
    }
  }
  drawGrid(ctx, result.width, result.height);
  drawSimilarSelectionOverlay(ctx, result);
  drawExportSelectionOverlay(ctx);
}

function drawConflictCanvas(result) {
  setCanvasSize(elements.conflictCanvas, result.width, result.height);
  const ctx = elements.conflictCanvas.getContext("2d");
  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, result.width, result.height);

  for (const tile of result.tileRows) {
    for (const row of tile.rows) {
      const y = tile.y * 8 + row.line;
      const x = tile.x * 8;
      const conflict = row.originalColorCount > 2;
      if (!conflict && row.correctedPixels === 0) {
        ctx.fillStyle = "#22303c";
      } else {
        const alpha = Math.min(1, 0.25 + row.correctedPixels / 8);
        ctx.fillStyle = conflict
          ? `rgba(255, 88, 74, ${alpha})`
          : `rgba(231, 228, 116, ${alpha})`;
      }
      ctx.fillRect(x, y, 8, 1);
    }
  }
  drawGrid(ctx, result.width, result.height);
  drawSimilarSelectionOverlay(ctx, result);
  drawExportSelectionOverlay(ctx);
}

function setCanvasSize(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
}

function drawGrid(ctx, width, height) {
  if (!elements.showGrid.checked) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  for (let x = 8; x < width; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 8; y < height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSimilarSelectionOverlay(ctx, result) {
  const selection = currentSimilarTileSelection();
  if (!selection) return;

  const targetCells = getCompactTileCells(result, selection.bank, selection.targetIndex);
  const sourceCells = getCompactTileCells(result, selection.bank, selection.sourceIndex);
  ctx.save();
  drawTileCellHighlights(ctx, targetCells, "rgba(104, 210, 218, 0.24)", "#68d2da");
  drawTileCellHighlights(ctx, sourceCells, "rgba(255, 142, 129, 0.30)", "#ff8e81");
  ctx.restore();
}

function drawExportSelectionOverlay(ctx) {
  if (!exportSelection) return;

  const x = exportSelection.minTileX * 8;
  const y = exportSelection.minTileY * 8;
  const width = (exportSelection.maxTileX - exportSelection.minTileX + 1) * 8;
  const height = (exportSelection.maxTileY - exportSelection.minTileY + 1) * 8;
  ctx.save();
  ctx.fillStyle = "rgba(231, 228, 116, 0.16)";
  ctx.strokeStyle = "#e7e474";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 1, y + 1, Math.max(0, width - 2), Math.max(0, height - 2));
  ctx.restore();
}

function drawTileCellHighlights(ctx, cells, fillStyle, strokeStyle) {
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;
  for (const cell of cells) {
    const x = cell.x * 8;
    const y = cell.y * 8;
    ctx.fillRect(x, y, 8, 8);
    ctx.strokeRect(x + 1, y + 1, 6, 6);
  }
}

function redrawLatest() {
  if (!latestResult) return;
  if (latestSourceImageData) {
    drawSourceCanvas(latestSourceImageData, latestResult.width, latestResult.height);
  }
  drawResultCanvas(latestResult);
  drawHeaderPreview(latestResult);
  drawColorCanvas(latestResult);
  drawConflictCanvas(latestResult);
}

function clearSimilarTileSelection(message) {
  similarTileCandidates = [];
  similarTileSelectionIndex = -1;
  elements.similarTilesInfo.textContent = message;
  updateSimilarTileButtons();
}

function currentSimilarTileSelection() {
  if (similarTileSelectionIndex < 0) return null;
  return similarTileCandidates[similarTileSelectionIndex] ?? null;
}

function findSimilarTiles() {
  if (!latestResult) return;

  const threshold = getSimilarTileThreshold();
  similarTileCandidates = findSimilarTileCandidates(latestResult, threshold);
  similarTileSelectionIndex = similarTileCandidates.length ? 0 : -1;
  updateSimilarTileInfo();
  updateSimilarTileButtons();
  redrawLatest();
}

function findSimilarTileCandidates(result, threshold) {
  const candidates = [];
  for (const bank of result.compactBanks) {
    for (let leftIndex = 0; leftIndex < bank.uniqueTiles.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bank.uniqueTiles.length; rightIndex += 1) {
        const leftTile = bank.uniqueTiles[leftIndex];
        const rightTile = bank.uniqueTiles[rightIndex];
        const differences = countTilePixelDifferences(leftTile, rightTile, threshold);
        if (differences < 0 || differences > threshold) continue;

        const keepLeft = leftTile.uses > rightTile.uses ||
          (leftTile.uses === rightTile.uses && leftTile.index < rightTile.index);
        candidates.push({
          bank: bank.bank,
          targetIndex: keepLeft ? leftTile.index : rightTile.index,
          sourceIndex: keepLeft ? rightTile.index : leftTile.index,
          differences,
          targetUses: keepLeft ? leftTile.uses : rightTile.uses,
          sourceUses: keepLeft ? rightTile.uses : leftTile.uses,
        });
      }
    }
  }

  return candidates.sort((a, b) =>
    a.differences - b.differences ||
    b.sourceUses - a.sourceUses ||
    b.targetUses - a.targetUses ||
    a.bank - b.bank ||
    a.sourceIndex - b.sourceIndex);
}

function countTilePixelDifferences(leftTile, rightTile, threshold) {
  let differences = 0;
  for (let y = 0; y < 8; y += 1) {
    const leftPattern = leftTile.pattern[y];
    const rightPattern = rightTile.pattern[y];
    const leftColor = leftTile.colors[y];
    const rightColor = rightTile.colors[y];
    const leftInk = (leftColor >> 4) & 0x0f;
    const leftPaper = leftColor & 0x0f;
    const rightInk = (rightColor >> 4) & 0x0f;
    const rightPaper = rightColor & 0x0f;

    for (let x = 0; x < 8; x += 1) {
      const bit = 1 << (7 - x);
      const leftPixel = leftPattern & bit ? leftInk : leftPaper;
      const rightPixel = rightPattern & bit ? rightInk : rightPaper;
      if (leftPixel !== rightPixel) {
        differences += 1;
        if (differences > threshold) return -1;
      }
    }
  }
  return differences;
}

function getSimilarTileThreshold() {
  const rawValue = Number(elements.similarTileThreshold.value);
  const value = Number.isFinite(rawValue) ? rawValue : DEFAULT_SIMILAR_TILE_PIXEL_THRESHOLD;
  return clampToMultiple(value, 0, 64, 1);
}

function handleSimilarThresholdChange() {
  const threshold = getSimilarTileThreshold();
  elements.similarTileThreshold.value = String(threshold);
  updateSimilarTileSearchLabel();
  if (!latestResult) return;
  clearSimilarTileSelection("Pulsa buscar para localizar tiles casi iguales con el nuevo umbral.");
  redrawLatest();
}

function updateSimilarTileSearchLabel() {
  elements.findSimilarTilesButton.textContent = `Buscar similares <=${getSimilarTileThreshold()} px`;
}

function getCompactTileCells(result, bankIndex, compactIndex) {
  const bank = result.compactBanks.find((item) => item.bank === bankIndex);
  if (!bank) return [];

  const cells = [];
  for (let offset = 0; offset < bank.nameTable.length; offset += 1) {
    if (bank.nameTable[offset] !== compactIndex) continue;
    cells.push({
      x: offset % bank.cols,
      y: bank.bank * 8 + Math.floor(offset / bank.cols),
    });
  }
  return cells;
}

function updateSimilarTileInfo() {
  const selection = currentSimilarTileSelection();
  if (!selection) {
    elements.similarTilesInfo.textContent =
      `No hay tiles compactos con ${getSimilarTileThreshold()} pixeles distintos o menos.`;
    elements.statusText.textContent = "Sin tiles similares";
    return;
  }

  const mergePlan = buildSimilarMergePlan(latestResult, similarTileCandidates);
  const mergedTileCount = mergePlan.reduce((sum, merge) => sum + merge.sourceIndexes.length, 0);
  const targetCells = getCompactTileCells(latestResult, selection.bank, selection.targetIndex);
  const sourceCells = getCompactTileCells(latestResult, selection.bank, selection.sourceIndex);
  elements.similarTilesInfo.textContent =
    `${similarTileCandidates.length} candidatos en ${mergePlan.length} grupos; fusionara ${mergedTileCount} tiles de golpe. ` +
    `Vista ${similarTileSelectionIndex + 1}/${similarTileCandidates.length}: ` +
    `B${selection.bank} tile ${selection.sourceIndex} -> ${selection.targetIndex}, ` +
    `${selection.differences}/64 px distintos, ${sourceCells.length} usos reutilizables. ` +
    `Azul se conserva, rojo se fusiona.`;
  elements.statusText.textContent = `${similarTileCandidates.length} candidatos`;
}

function updateSimilarTileButtons() {
  const hasResult = latestResult !== null;
  elements.findSimilarTilesButton.disabled = !hasResult;
  elements.mergeSimilarTilesButton.disabled = !hasResult || currentSimilarTileSelection() === null;
}

function mergeAllSimilarTiles() {
  if (!latestResult) return;
  if (!similarTileCandidates.length) return;

  const mergePlan = buildSimilarMergePlan(latestResult, similarTileCandidates);
  if (!mergePlan.length) return;

  let mergedTileCount = 0;
  let mergedUseCount = 0;

  const plannedMergesByBank = new Map();
  for (const plannedMerge of mergePlan) {
    if (!plannedMergesByBank.has(plannedMerge.bank)) {
      plannedMergesByBank.set(plannedMerge.bank, []);
    }
    plannedMergesByBank.get(plannedMerge.bank).push(plannedMerge);
  }

  for (const [bankIndex, plannedMerges] of plannedMergesByBank) {
    const bank = latestResult.compactBanks.find((item) => item.bank === bankIndex);
    if (!bank) continue;

    const sourceToTarget = new Map();
    const useAddsByTarget = new Map();

    for (const plannedMerge of plannedMerges) {
      const targetTile = bank.uniqueTiles.find((tile) => tile.index === plannedMerge.targetIndex);
      if (!targetTile) continue;

      for (const sourceIndex of plannedMerge.sourceIndexes) {
        const sourceTile = bank.uniqueTiles.find((tile) => tile.index === sourceIndex);
        if (!sourceTile) continue;
        sourceToTarget.set(sourceIndex, targetTile.index);
        useAddsByTarget.set(targetTile.index, (useAddsByTarget.get(targetTile.index) ?? 0) + sourceTile.uses);
        latestResult.similarTileMerges.push({
          bank: plannedMerge.bank,
          sourceTile: sourceIndex,
          targetTile: plannedMerge.targetIndex,
          differences: plannedMerge.maxDifferences,
          sourceUses: sourceTile.uses,
        });
        mergedTileCount += 1;
        mergedUseCount += sourceTile.uses;
      }
    }

    if (!sourceToTarget.size) continue;

    for (const [targetIndex, addedUses] of useAddsByTarget) {
      const targetTile = bank.uniqueTiles.find((tile) => tile.index === targetIndex);
      if (targetTile) targetTile.uses += addedUses;
    }
    bank.nameTable = bank.nameTable.map((index) => sourceToTarget.get(index) ?? index);

    const finalIndexByOldIndex = new Map();
    const mergedTiles = [];
    for (const tile of bank.uniqueTiles) {
      if (sourceToTarget.has(tile.index)) continue;
      finalIndexByOldIndex.set(tile.index, mergedTiles.length);
      mergedTiles.push({ ...tile, index: mergedTiles.length });
    }
    bank.uniqueTiles = mergedTiles;
    bank.nameTable = bank.nameTable.map((index) => finalIndexByOldIndex.get(index) ?? index);
    bank.overflow = bank.uniqueTiles.length > 256;
  }

  latestResult.asm = buildAsm(latestResult, elements.asmLabel.value);
  latestResult.json = buildJson(latestResult);
  latestExportResult = null;
  updateOutput(getActiveExportResult());

  const threshold = getSimilarTileThreshold();
  similarTileCandidates = findSimilarTileCandidates(latestResult, threshold);
  similarTileSelectionIndex = similarTileCandidates.length ? 0 : -1;
  updateSimilarTileInfo();
  if (!similarTileCandidates.length) {
    elements.similarTilesInfo.textContent =
      `Fusionados ${mergedTileCount} tiles (${mergedUseCount} usos reutilizados). No quedan candidatos <=${threshold} px.`;
    elements.statusText.textContent = "Fusion terminado";
  } else {
    elements.statusText.textContent = `Fusionados ${mergedTileCount} tiles`;
  }
  updateSimilarTileButtons();
  redrawLatest();
}

function buildSimilarMergePlan(result, candidates) {
  const plan = [];
  for (const bank of result.compactBanks) {
    const bankCandidates = candidates.filter((candidate) => candidate.bank === bank.bank);
    if (!bankCandidates.length) continue;

    const parent = new Map();
    const usesByIndex = new Map(bank.uniqueTiles.map((tile) => [tile.index, tile.uses]));
    const maxDifferenceByIndex = new Map();

    for (const candidate of bankCandidates) {
      parent.set(candidate.targetIndex, candidate.targetIndex);
      parent.set(candidate.sourceIndex, candidate.sourceIndex);
      unionSimilarTileParents(parent, candidate.targetIndex, candidate.sourceIndex);
      maxDifferenceByIndex.set(
        candidate.targetIndex,
        Math.max(maxDifferenceByIndex.get(candidate.targetIndex) ?? 0, candidate.differences),
      );
      maxDifferenceByIndex.set(
        candidate.sourceIndex,
        Math.max(maxDifferenceByIndex.get(candidate.sourceIndex) ?? 0, candidate.differences),
      );
    }

    const groups = new Map();
    for (const index of parent.keys()) {
      const root = findSimilarTileParent(parent, index);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(index);
    }

    for (const indexes of groups.values()) {
      if (indexes.length < 2) continue;
      const sortedIndexes = [...indexes].sort((a, b) =>
        (usesByIndex.get(b) ?? 0) - (usesByIndex.get(a) ?? 0) ||
        a - b);
      const [targetIndex, ...sourceIndexes] = sortedIndexes;
      plan.push({
        bank: bank.bank,
        targetIndex,
        sourceIndexes,
        maxDifferences: Math.max(...indexes.map((index) => maxDifferenceByIndex.get(index) ?? 0)),
      });
    }
  }

  return plan;
}

function findSimilarTileParent(parent, index) {
  const current = parent.get(index);
  if (current === index) return index;
  const root = findSimilarTileParent(parent, current);
  parent.set(index, root);
  return root;
}

function unionSimilarTileParents(parent, leftIndex, rightIndex) {
  const leftRoot = findSimilarTileParent(parent, leftIndex);
  const rightRoot = findSimilarTileParent(parent, rightIndex);
  if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
}

function rebuildLatestOutput() {
  if (!latestResult) return;
  latestResult.asm = buildAsm(latestResult, elements.asmLabel.value);
  latestResult.json = buildJson(latestResult);
  latestExportResult = null;
  updateOutput(getActiveExportResult());
}

function updateOutput(result) {
  elements.asmOutput.value = result.asm;
  const totalPixels = result.width * result.height;
  const percent = totalPixels ? (result.correctedPixels / totalPixels) * 100 : 0;
  const totalUniqueTiles = result.compactBanks.reduce((sum, bank) => sum + bank.uniqueTiles.length, 0);
  const overflowBanks = result.compactBanks.filter((bank) => bank.overflow).map((bank) => bank.bank);
  elements.statsBox.innerHTML = [
    `<span>Tiles: ${result.cols}x${result.rows} = ${result.cols * result.rows}</span>`,
    `<span>Bytes patrones: ${result.patternTable.length}</span>`,
    `<span>Bytes colores: ${result.colorTable.length}</span>`,
    `<span>Pixeles sustituidos: ${result.remappedPixels}</span>`,
    `<span>Pixeles aislados limpiados: ${result.noiseCleanedPixels}</span>`,
    `<span>Colores corregidos: ${result.correctedPixels} (${percent.toFixed(1)}%)</span>`,
    `<span>Lineas con conflicto: ${result.conflictLines}</span>`,
    `<span>Modo: ${result.conversionMode}${result.strictFailed ? " (fallo)" : ""}</span>`,
    `<span>Par de colores: ${result.pairStrategy}</span>`,
    `<span>Tono MSX: ${formatTonePresetLabel(result.tonePreset)}</span>`,
    `<span>Sustituciones: ${formatRemapSummary(result.colorRemaps)}</span>`,
    `<span>Export: ${formatExportSelectionSummary()}</span>`,
    `<span>Trim: ${formatTrimSummary(result.trim)}</span>`,
    `<span>Tiles unicos por banco: ${result.compactBanks.map((bank) => `B${bank.bank}:${bank.uniqueTiles.length}`).join(" ")}</span>`,
    `<span>Tiles unicos total: ${totalUniqueTiles}</span>`,
    `<span>Bytes compactos: ${totalUniqueTiles * 8} patrones + ${totalUniqueTiles * 8} colores</span>`,
    `<span>Fusiones similares: ${result.similarTileMerges?.length ?? 0}</span>`,
    `<span>Banco >256 chars: ${overflowBanks.length ? overflowBanks.join(", ") : "no"}</span>`,
    `<span>Name table: ${result.nameTable.length} bytes</span>`,
  ].join("");
  updateSimilarTileButtons();
}

function formatRemapSummary(remaps) {
  if (!remaps.length) return "no";
  return remaps
    .map((remap) => `${remap.from.toString(16).toUpperCase()}>${remap.to.toString(16).toUpperCase()}`)
    .join(" ");
}

function formatTonePresetLabel(presetId) {
  return (TONE_PRESET_BY_ID.get(presetId) ?? TONE_PRESET_BY_ID.get("original")).label;
}

function formatNoiseCleanupSummary(noiseCleanup, cleanedPixels = 0) {
  if (!noiseCleanup?.enabled) return "no";
  return `${noiseCleanup.mode} (${cleanedPixels} pixeles)`;
}

function formatTrimSummary(trim) {
  if (!trim) return "no";
  return `${trim.sourceWidth}x${trim.sourceHeight} -> ${(trim.maxTileX - trim.minTileX + 1) * 8}x${(trim.maxTileY - trim.minTileY + 1) * 8} px`;
}

function formatExportSelectionSummary() {
  if (!exportSelection) return "todo";
  const cols = exportSelection.maxTileX - exportSelection.minTileX + 1;
  const rows = exportSelection.maxTileY - exportSelection.minTileY + 1;
  return `${cols}x${rows} chars, X${exportSelection.minTileX}-${exportSelection.maxTileX} Y${exportSelection.minTileY}-${exportSelection.maxTileY}`;
}

function enableOutputButtons(enabled) {
  const exportResult = getActiveExportResult();
  elements.trimButton.disabled = !enabled;
  elements.copyAsmButton.disabled = !enabled;
  elements.downloadAsmButton.disabled = !enabled;
  elements.downloadJsonButton.disabled = !enabled;
  elements.downloadScrButton.disabled = !enabled || !exportResult || exportResult.width !== 256 || exportResult.height !== 192;
  elements.downloadTilesJsonButton.disabled = !enabled;
  elements.downloadTablesButton.disabled = !enabled;
  elements.downloadSplitTablesButton.disabled = !enabled;
  elements.downloadBossButton.disabled = !enabled;
  elements.downloadPresentationButton.disabled = !enabled;
  elements.downloadPortraitButton.disabled = !enabled;
  elements.downloadPngButton.disabled = !enabled;
  updateSimilarTileButtons();
}

function buildAsm(result, rawLabel) {
  const label = sanitizeAsmLabel(rawLabel);
  const lines = [];
  lines.push("; PNG convertido a MSX1 Screen 2");
  lines.push("; Restriccion aplicada: maximo 2 colores por linea de 8 pixeles.");
  lines.push(`; Modo de conversion: ${result.conversionMode}`);
  lines.push(`; Par de colores por linea: ${result.pairStrategy}`);
  lines.push(`; Tono MSX: ${formatTonePresetLabel(result.tonePreset)}`);
  lines.push(`; Limpieza de pixeles aislados: ${formatNoiseCleanupSummary(result.noiseCleanup, result.noiseCleanedPixels)}`);
  lines.push(`; Sustituciones de color: ${formatRemapSummary(result.colorRemaps)} (${result.remappedPixels} pixeles)`);
  if (result.trim) {
    lines.push(`; Trim aplicado: origen ${result.trim.sourceWidth}x${result.trim.sourceHeight}px, caja chars X${result.trim.minTileX}-${result.trim.maxTileX} Y${result.trim.minTileY}-${result.trim.maxTileY}.`);
  }
  if (result.strictFailed) {
    lines.push(`; AVISO: validacion estricta fallida: ${result.strictViolations.length} lineas no cumplen Screen 2.`);
  }
  if (result.similarTileMerges?.length) {
    lines.push(`; Fusiones manuales de tiles similares: ${result.similarTileMerges.length}`);
    for (const merge of result.similarTileMerges) {
      lines.push(`;   B${merge.bank}: tile ${merge.sourceTile} reutiliza ${merge.targetTile} (${merge.differences}/64 px distintos, ${merge.sourceUses} usos).`);
    }
  }
  lines.push("; Byte color Screen 2: nibble alto = tinta/bit 1, nibble bajo = fondo/bit 0.");
  lines.push(`${label}_WIDTH_PIXELS:  EQU ${result.width}`);
  lines.push(`${label}_HEIGHT_PIXELS: EQU ${result.height}`);
  lines.push(`${label}_WIDTH_CHARS:   EQU ${result.cols}`);
  lines.push(`${label}_HEIGHT_CHARS:  EQU ${result.rows}`);
  lines.push("");
  lines.push(`${label}_NameTable:`);
  lines.push(...formatDbRows(result.nameTable, 16, toHexByte));
  lines.push("");
  lines.push(`${label}_PatternTable:`);
  lines.push(...formatDbRows(result.patternTable, 8, toBinaryByte));
  lines.push("");
  lines.push(`${label}_ColorTable:`);
  lines.push(...formatDbRows(result.colorTable, 16, toHexByte));

  if (elements.includeCompactAsm.checked) {
    lines.push("");
    lines.push("; Datos compactos por banco Screen 2.");
    lines.push("; Cada banco usa indices 0..N en su propia tabla de patrones/color.");
    for (const bank of result.compactBanks) {
      lines.push("");
      lines.push(`; Banco ${bank.bank}: ${bank.uniqueTiles.length} tiles unicos, ${bank.nameTable.length} entradas de mapa.`);
      if (bank.overflow) {
        lines.push("; AVISO: este banco supera 256 chars unicos y no cabe como chars Screen 2 directos.");
      }
      lines.push(`${label}_Bank${bank.bank}_NameTable:`);
      lines.push(...formatDbRows(bank.nameTable, 16, toHexByte));
      lines.push(`${label}_Bank${bank.bank}_PatternTable:`);
      lines.push(...formatDbRows(bank.uniqueTiles.flatMap((tile) => tile.pattern), 8, toBinaryByte));
      lines.push(`${label}_Bank${bank.bank}_ColorTable:`);
      lines.push(...formatDbRows(bank.uniqueTiles.flatMap((tile) => tile.colors), 16, toHexByte));
    }
  }

  lines.push("");
  lines.push("; Tabla de paleta MSX usada por indices 0..15");
  for (const color of MSX_PALETTE) {
    lines.push(`; ${color.index.toString(16).toUpperCase()}: ${color.name} ${color.hex}`);
  }
  return lines.join("\n");
}

function buildJson(result) {
  return JSON.stringify({
    format: "msx1-screen2-chars",
    mideasFormat: "mideas-msx1-screen2-char-image",
    width: result.width,
    height: result.height,
    cols: result.cols,
    rows: result.rows,
    tileSize: { width: 8, height: 8 },
    palette: MSX_PALETTE,
    nameTable: result.nameTable,
    patternTable: result.patternTable,
    colorTable: result.colorTable,
    compactBanks: result.compactBanks,
    mideas: {
      assetType: "screen2CharImage",
      screenMode: "SCREEN 2",
      widthPixels: result.width,
      heightPixels: result.height,
      widthChars: result.cols,
      heightChars: result.rows,
      palette: "MSX1",
      tonePreset: result.tonePreset,
      noiseCleanup: result.noiseCleanup,
      colorRemaps: result.colorRemaps,
      trim: result.trim ?? null,
    hardwareLimits: {
        colorsPerEightPixelLine: 2,
        maxCharsPerBank: 256,
        bankHeightChars: 8,
      },
      banks: result.compactBanks.map((bank) => ({
        bank: bank.bank,
        widthChars: bank.cols,
        heightChars: bank.rows,
        map: bank.nameTable,
        tiles: bank.uniqueTiles.map((tile) => ({
          id: tile.index,
          pattern: tile.pattern,
          colors: tile.colors,
          uses: tile.uses,
        })),
        fitsScreen2Bank: !bank.overflow,
      })),
    },
    tiles: result.tileRows,
    correctedPixels: result.correctedPixels,
    remappedPixels: result.remappedPixels,
    noiseCleanedPixels: result.noiseCleanedPixels,
    noiseCleanup: result.noiseCleanup,
    conflictLines: result.conflictLines,
    similarTileMerges: result.similarTileMerges ?? [],
    strictFailed: result.strictFailed,
    strictViolations: result.strictViolations,
    conversionMode: result.conversionMode,
    pairStrategy: result.pairStrategy,
    tonePreset: result.tonePreset,
    colorRemaps: result.colorRemaps,
  }, null, 2);
}

function formatDbRows(values, perRow, formatter) {
  const rows = [];
  for (let i = 0; i < values.length; i += perRow) {
    rows.push(`  DB ${values.slice(i, i + perRow).map(formatter).join(",")}`);
  }
  return rows;
}

function toHexByte(value) {
  return `$${value.toString(16).toUpperCase().padStart(2, "0")}`;
}

function toBinaryByte(value) {
  return `%${value.toString(2).padStart(8, "0")}`;
}

function sanitizeAsmLabel(value) {
  const cleaned = String(value || "PngMsxImage")
    .replace(/^[^A-Za-z_]+/, "")
    .replace(/[^A-Za-z0-9_]/g, "_");
  return cleaned || "PngMsxImage";
}

async function copyAsm() {
  const result = getActiveExportResult();
  if (!result) return;
  await navigator.clipboard.writeText(result.asm);
  elements.statusText.textContent = "ASM copiado";
}

function downloadText(kind) {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  const isAsm = kind === "asm";
  const content = isAsm ? result.asm : result.json;
  const extension = isAsm ? "asm" : "json";
  downloadBlob(`${label}.${extension}`, new Blob([content], { type: "text/plain;charset=utf-8" }));
}

function downloadPreviewPng() {
  const result = getActiveExportResult();
  if (!result) return;
  const canvas = document.createElement("canvas");
  canvas.width = result.width;
  canvas.height = result.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(result.correctedImageData, 0, 0);
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(`${sanitizeAsmLabel(elements.asmLabel.value)}_preview.png`, blob);
  }, "image/png");
}

function downloadTileEditorCompositeTileJson() {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  const tile = buildTileEditorCompositeTile(result, label);
  downloadBlob(
    `${label}_tile.json`,
    new Blob([JSON.stringify(tile, null, 2)], { type: "application/json;charset=utf-8" }),
  );
  elements.statusText.textContent = `Tile JSON ${tile.width}x${tile.height} descargado`;
}

function buildTileEditorCompositeTile(result, label) {
  const tileId = `${label}_tile`;
  const data = [];
  const lineAttributes = [];

  for (let y = 0; y < result.height; y += 1) {
    const pixelRow = [];
    const attributeRow = [];
    const tileY = Math.floor(y / 8);
    const localLine = y % 8;

    for (let tileX = 0; tileX < result.cols; tileX += 1) {
      const tileInfo = result.tileRows[tileY * result.cols + tileX];
      const rowInfo = tileInfo?.rows?.[localLine];
      const ink = rowInfo?.ink ?? 15;
      const paper = rowInfo?.paper ?? 1;
      const pattern = rowInfo?.patternByte ?? 0;
      const fg = MIDEAS_MSX1_HEX[ink];
      const bg = MIDEAS_MSX1_HEX[paper];
      attributeRow.push({ fg, bg });

      for (let x = 0; x < 8; x += 1) {
        pixelRow.push((pattern & (1 << (7 - x))) ? fg : bg);
      }
    }

    data.push(pixelRow);
    lineAttributes.push(attributeRow);
  }

  return {
    id: tileId,
    name: `${label} Tile`,
    width: result.width,
    height: result.height,
    data,
    lineAttributes,
    logicalProperties: {
      mapId: 0,
      familyId: 0,
      instanceId: 0,
      isSolid: false,
      isBreakable: false,
      isMovable: false,
      causesDamage: false,
      isInteractiveSwitch: false,
      isInteractable: false,
      interactionType: "none",
      interactionValue: 1,
      interactionTarget: "",
    },
  };
}

function downloadScr() {
  const result = getActiveExportResult();
  if (!result || result.width !== 256 || result.height !== 192) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  downloadBlob(`${label}.scr`, bytesToBlob([...result.patternTable, ...result.colorTable]));
}

function downloadTables() {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  const header = [
    0x4d, 0x53, 0x58, 0x32,
    result.width & 0xff,
    result.height & 0xff,
    result.cols & 0xff,
    result.rows & 0xff,
  ];
  const payload = [
    ...header,
    ...u16le(result.nameTable.length),
    ...u16le(result.patternTable.length),
    ...u16le(result.colorTable.length),
    ...result.nameTable,
    ...result.patternTable,
    ...result.colorTable,
  ];
  downloadBlob(`${label}_tables.bin`, bytesToBlob(payload));
}

function downloadSplitTables() {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  downloadBlob(`${label}.nt.bin`, bytesToBlob(result.nameTable));
  downloadBlob(`${label}.pt.bin`, bytesToBlob(result.patternTable));
  downloadBlob(`${label}.ct.bin`, bytesToBlob(result.colorTable));
}

function downloadBossPackage() {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  const bossPackage = buildBossPackage(result, label);
  downloadBlob(
    `${label}.boss.json`,
    new Blob([JSON.stringify(bossPackage, null, 2)], { type: "application/json;charset=utf-8" }),
  );
}

function downloadPresentationPackage() {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  try {
    const presentationPackage = buildPresentationScreenPackage(result, label);
    downloadBlob(
      `${label}_presentation_screen.json`,
      new Blob([JSON.stringify(presentationPackage, null, 2)], { type: "application/json;charset=utf-8" }),
    );
    elements.statusText.textContent = "Presentation JSON descargado";
  } catch (error) {
    elements.statusText.textContent = error instanceof Error ? error.message : "No se pudo crear Presentation";
  }
}

function downloadDialoguePortraitPackage() {
  const result = getActiveExportResult();
  if (!result) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  try {
    const portraitPackage = buildDialoguePortraitPackage(result, label);
    downloadBlob(
      `${label}_dialogue_portrait.json`,
      new Blob([JSON.stringify(portraitPackage, null, 2)], { type: "application/json;charset=utf-8" }),
    );
    elements.statusText.textContent = "Portrait descargado";
  } catch (error) {
    elements.statusText.textContent = error instanceof Error ? error.message : "No se pudo crear Portrait";
  }
}

function buildDialoguePortraitPackage(result, label) {
  if (result.cols < 1 || result.rows < 1) {
    throw new Error("Portrait vacio.");
  }
  if (result.cols > 8 || result.rows > 6) {
    throw new Error(`Portrait dialog admite maximo 8x6 tiles; actual ${result.cols}x${result.rows}.`);
  }

  const stamp = Date.now();
  const baseId = `pngmsx_portrait_${label}_${stamp}`.replace(/[^A-Za-z0-9_]/g, "_");
  const tileBankId = `${baseId}_tilebank`;
  const portraitId = `${baseId}_portrait`;
  const sourceBank = result.compactBanks.find((bank) => bank.bank === 0);
  if (!sourceBank) {
    throw new Error("No hay banco compacto para crear el portrait.");
  }

  const tileAssetByCompactIndex = new Map();
  const tileAssets = sourceBank.uniqueTiles.map((tile) => {
    const tileId = `${baseId}_tile_${tile.index.toString().padStart(3, "0")}`;
    tileAssetByCompactIndex.set(tile.index, tileId);
    const name = `${label}_Face_${tile.index.toString().padStart(3, "0")}`;
    return {
      id: tileId,
      name,
      type: "tile",
      data: buildBossTileData(tileId, name, tile),
    };
  });

  const cells = [];
  for (let y = 0; y < result.rows; y += 1) {
    for (let x = 0; x < result.cols; x += 1) {
      const compactIndex = sourceBank.nameTable[y * sourceBank.cols + x];
      cells.push(tileAssetByCompactIndex.get(compactIndex) ?? "");
    }
  }

  const tileBankAsset = {
    id: tileBankId,
    name: `${label} Dialogue Portrait Bank`,
    type: "tilebank",
    data: buildDialoguePortraitTileBank(tileBankId, `${label} Dialogue Portrait Bank`, tileAssets.map((asset) => asset.id)),
  };

  const portraitAsset = {
    id: portraitId,
    name: `${label} Portrait`,
    type: "portrait",
    data: {
      id: portraitId,
      name: `${label} Portrait`,
      widthChars: result.cols,
      heightChars: result.rows,
      tileBankAssetId: tileBankId,
      cells,
      dedupeIdenticalTiles: true,
    },
  };

  const assets = [...tileAssets, tileBankAsset, portraitAsset];
  return {
    schema: DIALOGUE_PORTRAIT_PACKAGE_SCHEMA,
    currentProjectName: `${label}_dialogue_portrait`,
    currentScreenMode: "SCREEN 2 (Graphics I)",
    assets,
    tileBanks: [tileBankAsset.data],
    portraitAssetId: portraitId,
    importHint: "Cargar este JSON como proyecto Mideas o copiar sus assets a un proyecto. El asset Portrait se puede seleccionar desde Dialogue > Graphic/Portrait.",
    source: {
      tool: "png-msx-chars",
      sourceFileName: loadedName ? `${loadedName}.png` : null,
      widthPixels: result.width,
      heightPixels: result.height,
      widthChars: result.cols,
      heightChars: result.rows,
      uniqueTiles: sourceBank.uniqueTiles.length,
      tonePreset: result.tonePreset,
      noiseCleanup: result.noiseCleanup,
      noiseCleanedPixels: result.noiseCleanedPixels,
      similarTileMerges: result.similarTileMerges ?? [],
    },
  };
}

function buildDialoguePortraitTileBank(id, name, tileIds) {
  const assignedTiles = {};
  tileIds.forEach((tileId, index) => {
    assignedTiles[tileId] = { charCode: 128 + index };
  });
  const ranges = [
    { id: "bank_0", name: "Bank 0 - Dialogue Portrait", y: 0, pattern: 0x0000, color: 0x2000, fg: 15, bg: 1 },
    { id: "bank_1", name: "Bank 1 - Dialogue Portrait", y: 8, pattern: 0x0800, color: 0x2800, fg: 15, bg: 1 },
    { id: "bank_2", name: "Bank 2 - Dialogue Portrait", y: 16, pattern: 0x1000, color: 0x3000, fg: 15, bg: 1 },
  ];

  return {
    id,
    name,
    banks: ranges.map((bank) => ({
      id: bank.id,
      name: bank.name,
      enabled: true,
      vramPatternStart: bank.pattern,
      vramColorStart: bank.color,
      screenZone: { x: 0, y: bank.y, width: 32, height: 8 },
      charsetRangeStart: 128,
      charsetRangeEnd: Math.min(255, 127 + tileIds.length),
      defaultFgColorIndex: bank.fg,
      defaultBgColorIndex: bank.bg,
      isLocked: false,
      assignedTiles: { ...assignedTiles },
    })),
  };
}

function buildPresentationScreenPackage(result, label) {
  const nameTable = Array(32 * 24).fill(0);
  const data = {
    nameTable,
    patternBank0: [],
    patternBank1: [],
    patternBank2: [],
    colorBank0: [],
    colorBank1: [],
    colorBank2: [],
    patternCountBank0: 0,
    patternCountBank1: 0,
    patternCountBank2: 0,
  };
  const uniqueCharsPerBank = [0, 0, 0];
  const usedColors = new Set([1]);
  const warnings = [];

  if (result.width !== 256 || result.height !== 192) {
    warnings.push("Imagen menor que SCREEN 2: colocada arriba izquierda y rellenada con negro.");
  }
  if (result.compactBanks.some((bank) => bank.overflow)) {
    warnings.push("Algun banco supera 256 chars unicos.");
  }
  if (result.similarTileMerges?.length) {
    warnings.push(`${result.similarTileMerges.length} fusiones de tiles similares aplicadas.`);
  }

  for (let bankIndex = 0; bankIndex < 3; bankIndex += 1) {
    const bank = result.compactBanks.find((item) => item.bank === bankIndex);
    const arrays = getPresentationBankArrays(data, bankIndex);
    const rowsInBank = Math.max(0, Math.min(8, result.rows - bankIndex * 8));
    const needsBlankTile = !bank || result.cols < 32 || rowsInBank < 8;
    const charOffset = needsBlankTile ? 1 : 0;
    const uniqueTiles = bank?.uniqueTiles ?? [];

    if (uniqueTiles.length + charOffset > 256) {
      throw new Error(`Banco ${bankIndex} no cabe en Presentation: ${uniqueTiles.length + charOffset} chars.`);
    }

    if (needsBlankTile) {
      arrays.patterns.push(0, 0, 0, 0, 0, 0, 0, 0);
      arrays.colors.push(0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11);
    }

    for (const tile of uniqueTiles) {
      arrays.patterns.push(...tile.pattern);
      arrays.colors.push(...tile.colors);
      for (const colorByte of tile.colors) {
        usedColors.add((colorByte >> 4) & 0x0f);
        usedColors.add(colorByte & 0x0f);
      }
    }

    uniqueCharsPerBank[bankIndex] = uniqueTiles.length + charOffset;
    setPresentationPatternCount(data, bankIndex, uniqueCharsPerBank[bankIndex]);

    if (!bank) continue;
    for (let localRow = 0; localRow < rowsInBank; localRow += 1) {
      const sourceRowOffset = localRow * bank.cols;
      const targetRowOffset = (bankIndex * 8 + localRow) * 32;
      for (let x = 0; x < result.cols; x += 1) {
        nameTable[targetRowOffset + x] = (bank.nameTable[sourceRowOffset + x] ?? 0) + charOffset;
      }
    }
  }

  const totalUniqueChars = uniqueCharsPerBank.reduce((sum, count) => sum + count, 0);
  if (totalUniqueChars > 700) {
    warnings.push("La imagen usa muchos caracteres unicos; la compresion ZX0 sera importante.");
  }

  return {
    enabled: true,
    name: label || "Presentation Screen",
    sourceFileName: `${loadedName || label}.png`,
    sourceImageWidth: result.width,
    sourceImageHeight: result.height,
    screenMode: "SCREEN 2",
    paletteMode: "MSX1",
    conversion: {
      dither: "none",
      backgroundColorIndex: Number(elements.transparentColor.value) || 1,
      preferExistingPalette: false,
      twoColorsPer8PixelRow: true,
      deduplicatePatterns: true,
      tonePreset: result.tonePreset,
      noiseCleanup: result.noiseCleanup,
    },
    preview: {
      paletteIndices: [...usedColors].sort((a, b) => a - b),
      uniqueCharsPerBank,
      totalUniqueChars,
      warning: warnings.length ? warnings.join(" ") : null,
    },
    data,
    compression: {
      codec: "ZX0",
      compressNameTable: true,
      compressPatterns: true,
      compressColors: true,
    },
    runtime: {
      showAtBoot: false,
      clearSpritesBeforeShow: true,
      waitForKey: true,
      waitForFrames: 0,
      romDataGroup: "auto",
    },
    updatedAt: Date.now(),
    lastImportError: null,
  };
}

function getPresentationBankArrays(data, bankIndex) {
  if (bankIndex === 0) return { patterns: data.patternBank0, colors: data.colorBank0 };
  if (bankIndex === 1) return { patterns: data.patternBank1, colors: data.colorBank1 };
  return { patterns: data.patternBank2, colors: data.colorBank2 };
}

function setPresentationPatternCount(data, bankIndex, count) {
  if (bankIndex === 0) data.patternCountBank0 = count;
  else if (bankIndex === 1) data.patternCountBank1 = count;
  else data.patternCountBank2 = count;
}

function buildBossPackage(result, label) {
  const stamp = Date.now();
  const baseId = `pngmsx_${label}_${stamp}`;
  const tileAssets = [];
  const matrixByBank = new Map();
  const tileIdByBankTile = new Map();

  for (const bank of result.compactBanks) {
    for (const tile of bank.uniqueTiles) {
      const tileId = `${baseId}_b${bank.bank}_t${tile.index}`;
      tileIdByBankTile.set(`${bank.bank}:${tile.index}`, tileId);
      tileAssets.push({
        id: tileId,
        name: `${label}_B${bank.bank}_${tile.index.toString().padStart(3, "0")}`,
        type: "tile",
        data: buildBossTileData(tileId, `${label}_B${bank.bank}_${tile.index.toString().padStart(3, "0")}`, tile),
      });
    }

    const bankRows = [];
    for (let y = 0; y < bank.rows; y += 1) {
      const row = [];
      for (let x = 0; x < bank.cols; x += 1) {
        const uniqueIndex = bank.nameTable[y * bank.cols + x];
        row.push(tileIdByBankTile.get(`${bank.bank}:${uniqueIndex}`) ?? null);
      }
      bankRows.push(row);
    }
    matrixByBank.set(bank.bank, bankRows);
  }

  const tileMatrix = [];
  for (let tileY = 0; tileY < result.rows; tileY += 1) {
    const bank = Math.floor(tileY / 8);
    const bankRow = tileY % 8;
    tileMatrix.push(matrixByBank.get(bank)?.[bankRow] ?? Array(result.cols).fill(null));
  }

  const collisionMatrix = tileMatrix.map((row) => row.map((tileId) => tileId !== null));
  const phaseId = `${baseId}_phase_1`;
  const boss = {
    id: `${baseId}_boss`,
    name: label,
    totalHealth: 100,
    phases: [{
      id: phaseId,
      name: "Phase 1",
      healthThreshold: 0,
      buildType: "tile",
      dimensions: { width: result.cols, height: result.rows },
      tileMatrix,
      collisionMatrix,
      weakPoints: [],
      forms: [],
      initialFormId: undefined,
      neckChain: {
        enabled: false,
        segments: [],
        amplitudeX: 0,
        amplitudeY: 0,
        speed: 1,
        segmentDelayFrames: 2,
        followStrength: 0.75,
      },
      crushMovement: {
        enabled: false,
        direction: "down",
        distance: 0,
        windupFrames: 0,
        slamFrames: 0,
        holdFrames: 0,
        returnFrames: 0,
        cooldownFrames: 0,
      },
      behaviorLoop: [],
      attackSequence: [],
    }],
    phasesEnabled: [true],
    attacks: [],
    runtimeUpdateIntervalFrames: 1,
    linkedScreenId: null,
  };

  return {
    schema: BOSS_PACKAGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    boss,
    assets: tileAssets,
    source: {
      tool: "png-msx-chars",
      width: result.width,
      height: result.height,
      conversionMode: result.conversionMode,
      pairStrategy: result.pairStrategy,
      tonePreset: result.tonePreset,
      noiseCleanup: result.noiseCleanup,
      noiseCleanedPixels: result.noiseCleanedPixels,
      colorRemaps: result.colorRemaps,
      note: "No TileBank is included. Assign imported tiles to a TileBank inside Mideas.",
    },
  };
}

function buildBossTileData(tileId, name, tile) {
  const data = [];
  const lineAttributes = [];

  for (let y = 0; y < 8; y += 1) {
    const pattern = tile.pattern[y];
    const colorByte = tile.colors[y];
    const ink = (colorByte >> 4) & 0x0f;
    const paper = colorByte & 0x0f;
    const fg = MIDEAS_MSX1_HEX[ink];
    const bg = MIDEAS_MSX1_HEX[paper];
    const row = [];

    for (let x = 0; x < 8; x += 1) {
      row.push((pattern & (1 << (7 - x))) ? fg : bg);
    }

    data.push(row);
    lineAttributes.push([{ fg, bg }]);
  }

  return {
    id: tileId,
    name,
    width: 8,
    height: 8,
    data,
    lineAttributes,
    logicalProperties: {
      mapId: 0,
      familyId: 0,
      instanceId: 0,
      isSolid: false,
      isBreakable: false,
      isMovable: false,
      causesDamage: false,
      isInteractiveSwitch: false,
      isInteractable: false,
      interactionType: "none",
      interactionValue: 1,
      interactionTarget: "",
    },
  };
}

function u16le(value) {
  return [value & 0xff, (value >> 8) & 0xff];
}

function bytesToBlob(bytes) {
  return new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resetCanvases(width, height) {
  for (const canvas of [elements.sourceCanvas, elements.resultCanvas, elements.colorCanvas, elements.conflictCanvas]) {
    setCanvasSize(canvas, width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, width, height);
  }
  elements.headerPreview.hidden = true;
}

init();
