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

const elements = {
  fileInput: document.getElementById("fileInput"),
  targetWidth: document.getElementById("targetWidth"),
  targetHeight: document.getElementById("targetHeight"),
  resolutionPreset: document.getElementById("resolutionPreset"),
  keepAspect: document.getElementById("keepAspect"),
  nearestScale: document.getElementById("nearestScale"),
  includeCompactAsm: document.getElementById("includeCompactAsm"),
  conversionMode: document.getElementById("conversionMode"),
  pairStrategy: document.getElementById("pairStrategy"),
  transparentColor: document.getElementById("transparentColor"),
  addColorRemapButton: document.getElementById("addColorRemapButton"),
  clearColorRemapsButton: document.getElementById("clearColorRemapsButton"),
  colorRemapRows: document.getElementById("colorRemapRows"),
  emptyRemapNote: document.getElementById("emptyRemapNote"),
  asmLabel: document.getElementById("asmLabel"),
  convertButton: document.getElementById("convertButton"),
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
  downloadTablesButton: document.getElementById("downloadTablesButton"),
  downloadSplitTablesButton: document.getElementById("downloadSplitTablesButton"),
  downloadPngButton: document.getElementById("downloadPngButton"),
  statsBox: document.getElementById("statsBox"),
  statusText: document.getElementById("statusText"),
};

let loadedImage = null;
let loadedName = "image";
let latestResult = null;

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
  elements.resolutionPreset.addEventListener("change", applyResolutionPreset);
  elements.conversionMode.addEventListener("change", convert);
  elements.pairStrategy.addEventListener("change", convert);
  elements.transparentColor.addEventListener("change", convert);
  elements.addColorRemapButton.addEventListener("click", () => addColorRemapRow());
  elements.clearColorRemapsButton.addEventListener("click", clearColorRemaps);
  elements.showGrid.addEventListener("change", () => redrawLatest());
  elements.includeCompactAsm.addEventListener("change", () => rebuildLatestOutput());
  elements.targetWidth.addEventListener("change", normalizeSizeInputs);
  elements.targetHeight.addEventListener("change", normalizeSizeInputs);
  elements.copyAsmButton.addEventListener("click", copyAsm);
  elements.downloadAsmButton.addEventListener("click", () => downloadText("asm"));
  elements.downloadJsonButton.addEventListener("click", () => downloadText("json"));
  elements.downloadScrButton.addEventListener("click", downloadScr);
  elements.downloadTablesButton.addEventListener("click", downloadTables);
  elements.downloadSplitTablesButton.addEventListener("click", downloadSplitTables);
  elements.downloadPngButton.addEventListener("click", downloadPreviewPng);

  resetCanvases(256, 192);
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

function normalizeSizeInputs() {
  elements.targetWidth.value = String(clampToMultiple(Number(elements.targetWidth.value), 8, 256, 8));
  elements.targetHeight.value = String(clampToMultiple(Number(elements.targetHeight.value), 8, 192, 8));
  elements.resolutionPreset.value = presetForSize(Number(elements.targetWidth.value), Number(elements.targetHeight.value));
}

function applyResolutionPreset() {
  if (elements.resolutionPreset.value === "custom") return;
  const [width, height] = elements.resolutionPreset.value.split("x").map(Number);
  elements.targetWidth.value = String(width);
  elements.targetHeight.value = String(height);
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
    getColorRemaps(),
  );
  result.compactBanks = buildCompactBanks(result);
  result.asm = buildAsm(result, elements.asmLabel.value);
  result.json = buildJson(result);

  latestResult = result;
  drawSourceCanvas(scaled.imageData, width, height);
  drawResultCanvas(result);
  drawColorCanvas(result);
  drawConflictCanvas(result);
  updateOutput(result);
  enableOutputButtons(true);
  elements.statusText.textContent = result.strictFailed
    ? `No valido ${width}x${height}`
    : `Convertido ${width}x${height}`;
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

function convertImageDataToScreen2(imageData, width, height, transparentColor, mode, pairStrategy, colorRemapConfig = { table: new Map(), remaps: [] }) {
  const cols = width / 8;
  const rows = height / 8;
  const quantized = new Uint8Array(width * height);
  const originalRgb = imageData.data;
  const correctedRgb = new Uint8ClampedArray(width * height * 4);
  const patternTable = [];
  const colorTable = [];
  const nameTable = [];
  const tileRows = [];
  let correctedPixels = 0;
  let remappedPixels = 0;
  let conflictLines = 0;
  const strictViolations = [];

  for (let i = 0, p = 0; i < originalRgb.length; i += 4, p += 1) {
    if (originalRgb[i + 3] < 128) {
      const remappedTransparent = colorRemapConfig.table.get(transparentColor);
      quantized[p] = remappedTransparent ?? transparentColor;
      if (remappedTransparent !== undefined) remappedPixels += 1;
      continue;
    }
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
        const [paper, ink] = pickTwoLineColors(colors, pairStrategy);
        let patternByte = 0;
        let correctedLinePixels = 0;
        for (let pixel = 0; pixel < 8; pixel += 1) {
          const x = tileX * 8 + pixel;
          const sourceIndex = y * width + x;
          const chosen = mode === "strict"
            ? quantized[sourceIndex]
            : chooseInkOrPaper(quantized[sourceIndex], ink, paper) ? ink : paper;
          if (chosen === ink && ink !== paper) {
            patternByte |= 1 << (7 - pixel);
          }
          if (chosen !== quantized[sourceIndex]) {
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
    conflictLines,
    strictViolations,
    strictFailed: mode === "strict" && strictViolations.length > 0,
    conversionMode: mode,
    pairStrategy,
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
}

function drawResultCanvas(result) {
  setCanvasSize(elements.resultCanvas, result.width, result.height);
  const ctx = elements.resultCanvas.getContext("2d");
  ctx.putImageData(result.correctedImageData, 0, 0);
  drawGrid(ctx, result.width, result.height);
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

function redrawLatest() {
  if (!latestResult) return;
  drawResultCanvas(latestResult);
  drawColorCanvas(latestResult);
  drawConflictCanvas(latestResult);
}

function rebuildLatestOutput() {
  if (!latestResult) return;
  latestResult.asm = buildAsm(latestResult, elements.asmLabel.value);
  latestResult.json = buildJson(latestResult);
  updateOutput(latestResult);
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
    `<span>Colores corregidos: ${result.correctedPixels} (${percent.toFixed(1)}%)</span>`,
    `<span>Lineas con conflicto: ${result.conflictLines}</span>`,
    `<span>Modo: ${result.conversionMode}${result.strictFailed ? " (fallo)" : ""}</span>`,
    `<span>Par de colores: ${result.pairStrategy}</span>`,
    `<span>Sustituciones: ${formatRemapSummary(result.colorRemaps)}</span>`,
    `<span>Tiles unicos por banco: ${result.compactBanks.map((bank) => `B${bank.bank}:${bank.uniqueTiles.length}`).join(" ")}</span>`,
    `<span>Tiles unicos total: ${totalUniqueTiles}</span>`,
    `<span>Banco >256 chars: ${overflowBanks.length ? overflowBanks.join(", ") : "no"}</span>`,
    `<span>Name table: ${result.nameTable.length} bytes</span>`,
  ].join("");
}

function formatRemapSummary(remaps) {
  if (!remaps.length) return "no";
  return remaps
    .map((remap) => `${remap.from.toString(16).toUpperCase()}>${remap.to.toString(16).toUpperCase()}`)
    .join(" ");
}

function enableOutputButtons(enabled) {
  elements.copyAsmButton.disabled = !enabled;
  elements.downloadAsmButton.disabled = !enabled;
  elements.downloadJsonButton.disabled = !enabled;
  elements.downloadScrButton.disabled = !enabled || !latestResult || latestResult.width !== 256 || latestResult.height !== 192;
  elements.downloadTablesButton.disabled = !enabled;
  elements.downloadSplitTablesButton.disabled = !enabled;
  elements.downloadPngButton.disabled = !enabled;
}

function buildAsm(result, rawLabel) {
  const label = sanitizeAsmLabel(rawLabel);
  const lines = [];
  lines.push("; PNG convertido a MSX1 Screen 2");
  lines.push("; Restriccion aplicada: maximo 2 colores por linea de 8 pixeles.");
  lines.push(`; Modo de conversion: ${result.conversionMode}`);
  lines.push(`; Par de colores por linea: ${result.pairStrategy}`);
  lines.push(`; Sustituciones de color: ${formatRemapSummary(result.colorRemaps)} (${result.remappedPixels} pixeles)`);
  if (result.strictFailed) {
    lines.push(`; AVISO: validacion estricta fallida: ${result.strictViolations.length} lineas no cumplen Screen 2.`);
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
      colorRemaps: result.colorRemaps,
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
    conflictLines: result.conflictLines,
    strictFailed: result.strictFailed,
    strictViolations: result.strictViolations,
    conversionMode: result.conversionMode,
    pairStrategy: result.pairStrategy,
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
  if (!latestResult) return;
  await navigator.clipboard.writeText(latestResult.asm);
  elements.statusText.textContent = "ASM copiado";
}

function downloadText(kind) {
  if (!latestResult) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  const isAsm = kind === "asm";
  const content = isAsm ? latestResult.asm : latestResult.json;
  const extension = isAsm ? "asm" : "json";
  downloadBlob(`${label}.${extension}`, new Blob([content], { type: "text/plain;charset=utf-8" }));
}

function downloadPreviewPng() {
  if (!latestResult) return;
  elements.resultCanvas.toBlob((blob) => {
    if (blob) downloadBlob(`${sanitizeAsmLabel(elements.asmLabel.value)}_preview.png`, blob);
  }, "image/png");
}

function downloadScr() {
  if (!latestResult || latestResult.width !== 256 || latestResult.height !== 192) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  downloadBlob(`${label}.scr`, bytesToBlob([...latestResult.patternTable, ...latestResult.colorTable]));
}

function downloadTables() {
  if (!latestResult) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  const header = [
    0x4d, 0x53, 0x58, 0x32,
    latestResult.width & 0xff,
    latestResult.height & 0xff,
    latestResult.cols & 0xff,
    latestResult.rows & 0xff,
  ];
  const payload = [
    ...header,
    ...u16le(latestResult.nameTable.length),
    ...u16le(latestResult.patternTable.length),
    ...u16le(latestResult.colorTable.length),
    ...latestResult.nameTable,
    ...latestResult.patternTable,
    ...latestResult.colorTable,
  ];
  downloadBlob(`${label}_tables.bin`, bytesToBlob(payload));
}

function downloadSplitTables() {
  if (!latestResult) return;
  const label = sanitizeAsmLabel(elements.asmLabel.value);
  downloadBlob(`${label}.nt.bin`, bytesToBlob(latestResult.nameTable));
  downloadBlob(`${label}.pt.bin`, bytesToBlob(latestResult.patternTable));
  downloadBlob(`${label}.ct.bin`, bytesToBlob(latestResult.colorTable));
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
}

init();
