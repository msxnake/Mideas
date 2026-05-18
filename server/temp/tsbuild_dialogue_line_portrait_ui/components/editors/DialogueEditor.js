"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueEditor = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Button_1 = require("../common/Button");
const Panel_1 = require("../common/Panel");
const MsxIcons_1 = require("../icons/MsxIcons");
const DEFAULT_BORDER_CHAR_CODES = {
    topLeft: 43,
    topRight: 43,
    bottomLeft: 43,
    bottomRight: 43,
    horizontal: 45,
    vertical: 124,
};
const DEFAULT_TILE_GRAPHIC = {
    enabled: false,
    side: 'left',
    width: 4,
    height: 3,
    padding: 1,
    tileIds: [],
};
const inputClassName = 'w-full p-2 text-sm text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const compactInputClassName = 'w-full p-1.5 text-xs text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const labelClassName = 'block text-xs text-msx-textsecondary mb-1';
function clampNumber(value, min, max) {
    if (!Number.isFinite(value))
        return min;
    return Math.max(min, Math.min(max, value));
}
function getUnsupportedDialogueChars(text) {
    return Array.from(new Set(Array.from(text || '').filter(char => {
        const code = char.charCodeAt(0);
        return code < 32 || code > 126;
    })));
}
function ensureDialogue(dialogue) {
    return {
        ...dialogue,
        lines: Array.isArray(dialogue.lines) && dialogue.lines.length > 0
            ? dialogue.lines
            : [{ id: `line_${Date.now()}`, speaker: '', text: '', waitForInput: true }],
        box: {
            x: 0,
            y: 20,
            width: 32,
            height: 4,
            borderSource: 'generated',
            ...dialogue.box,
            borderCharCodes: {
                ...DEFAULT_BORDER_CHAR_CODES,
                ...(dialogue.box?.borderCharCodes || {}),
            },
            borderTiles: {
                ...(dialogue.box?.borderTiles || {}),
            },
            graphic: {
                ...DEFAULT_TILE_GRAPHIC,
                ...(dialogue.box?.graphic || {}),
                tileIds: Array.isArray(dialogue.box?.graphic?.tileIds) ? dialogue.box.graphic.tileIds : [],
            },
        },
        exportOptions: {
            maxCharsPerLine: 28,
            maxLinesPerBox: 3,
            stripUnsupportedChars: true,
            charDelayFrames: 2,
            ...dialogue.exportOptions,
        },
    };
}
const DialogueEditor = ({ dialogue, onUpdate, allAssets, tileBanks, onCreateAsset, }) => {
    const data = ensureDialogue(dialogue);
    const fontAssets = (0, react_1.useMemo)(() => allAssets.filter(asset => asset.type === 'font'), [allAssets]);
    const tileAssets = (0, react_1.useMemo)(() => allAssets.filter(asset => asset.type === 'tile'), [allAssets]);
    const portraitAssets = (0, react_1.useMemo)(() => allAssets.filter(asset => asset.type === 'portrait' && asset.data), [allAssets]);
    const availableTileBanks = (0, react_1.useMemo)(() => {
        const tileBankAssets = allAssets
            .filter(asset => asset.type === 'tilebank' && asset.data)
            .map(asset => asset.data);
        const byId = new Map();
        [...tileBanks, ...tileBankAssets].forEach(bank => {
            if (bank?.id)
                byId.set(bank.id, bank);
        });
        return Array.from(byId.values());
    }, [allAssets, tileBanks]);
    const update = (patch) => {
        onUpdate({ ...data, ...patch });
    };
    const updateBox = (patch) => {
        update({ box: { ...data.box, ...patch } });
    };
    const updateGraphic = (patch) => {
        const currentGraphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
        updateBox({
            graphic: {
                ...currentGraphic,
                ...patch,
                tileIds: patch.tileIds || currentGraphic.tileIds || [],
            },
        });
    };
    const updateExportOptions = (patch) => {
        update({ exportOptions: { ...data.exportOptions, ...patch } });
    };
    const updateLine = (lineId, patch) => {
        update({
            lines: data.lines.map(line => line.id === lineId ? { ...line, ...patch } : line),
        });
    };
    const getLineGraphic = (line) => {
        if (!line.graphic)
            return undefined;
        return {
            ...DEFAULT_TILE_GRAPHIC,
            ...line.graphic,
            tileIds: Array.isArray(line.graphic.tileIds) ? line.graphic.tileIds : [],
        };
    };
    const updateLineGraphic = (lineId, patch) => {
        const line = data.lines.find(candidate => candidate.id === lineId);
        const currentGraphic = {
            ...DEFAULT_TILE_GRAPHIC,
            ...(line?.graphic || {}),
            tileIds: Array.isArray(line?.graphic?.tileIds) ? line.graphic.tileIds : [],
        };
        updateLine(lineId, {
            graphic: {
                ...currentGraphic,
                ...patch,
                tileIds: patch.tileIds || currentGraphic.tileIds || [],
            },
        });
    };
    const updateLineGraphicSize = (lineId, width, height) => {
        const line = data.lines.find(candidate => candidate.id === lineId);
        const currentGraphic = {
            ...DEFAULT_TILE_GRAPHIC,
            ...(line?.graphic || {}),
            tileIds: Array.isArray(line?.graphic?.tileIds) ? line.graphic.tileIds : [],
        };
        const nextWidth = clampNumber(width, 1, 8);
        const nextHeight = clampNumber(height, 1, 6);
        updateLineGraphic(lineId, {
            width: nextWidth,
            height: nextHeight,
            tileIds: Array.from({ length: nextWidth * nextHeight }, (_, index) => currentGraphic.tileIds?.[index] || ''),
        });
    };
    const updateLineGraphicTile = (lineId, tileIndex, value) => {
        const line = data.lines.find(candidate => candidate.id === lineId);
        const currentGraphic = {
            ...DEFAULT_TILE_GRAPHIC,
            ...(line?.graphic || {}),
            tileIds: Array.isArray(line?.graphic?.tileIds) ? line.graphic.tileIds : [],
        };
        const nextTileIds = [...currentGraphic.tileIds];
        nextTileIds[tileIndex] = value;
        updateLineGraphic(lineId, { tileIds: nextTileIds });
    };
    const addLine = () => {
        update({
            lines: [
                ...data.lines,
                { id: `line_${Date.now()}`, speaker: '', text: '', waitForInput: true },
            ],
        });
    };
    const removeLine = (lineId) => {
        if (data.lines.length <= 1)
            return;
        update({ lines: data.lines.filter(line => line.id !== lineId) });
    };
    const createAndAssignFont = () => {
        const created = onCreateAsset?.('font', { select: false });
        if (created?.id) {
            updateBox({ fontAssetId: created.id });
        }
    };
    const createAndAssignTileBank = () => {
        const created = onCreateAsset?.('tilebank', { select: false });
        if (created?.id) {
            updateBox({ borderSource: 'tilebank', tileBankAssetId: created.id });
        }
    };
    const createAndAssignGraphicTileBank = () => {
        const created = onCreateAsset?.('tilebank', { select: false });
        if (created?.id) {
            updateGraphic({ enabled: true, tileBankAssetId: created.id });
        }
    };
    const createAndAssignPortrait = () => {
        const created = onCreateAsset?.('portrait', { select: false });
        if (created?.id && created.data) {
            const portrait = created.data;
            updateGraphic({
                enabled: true,
                portraitAssetId: created.id,
                tileBankAssetId: portrait.tileBankAssetId,
                width: portrait.widthChars,
                height: portrait.heightChars,
                tileIds: portrait.cells || [],
            });
        }
    };
    const applyPortraitToGraphic = (currentGraphic, portraitAssetId) => {
        const portrait = portraitAssets.find(asset => asset.id === portraitAssetId)?.data;
        if (!portrait) {
            return { portraitAssetId: undefined };
        }
        return {
            enabled: true,
            portraitAssetId,
            tileBankAssetId: portrait.tileBankAssetId || currentGraphic.tileBankAssetId,
            width: portrait.widthChars,
            height: portrait.heightChars,
            tileIds: Array.isArray(portrait.cells) ? portrait.cells : [],
        };
    };
    const updateBorderCharCode = (field, value) => {
        updateBox({
            borderCharCodes: {
                ...DEFAULT_BORDER_CHAR_CODES,
                ...data.box.borderCharCodes,
                [field]: clampNumber(value, 0, 255),
            },
        });
    };
    const updateBorderTile = (field, value) => {
        updateBox({
            borderTiles: {
                ...(data.box.borderTiles || {}),
                [field]: value || undefined,
            },
        });
    };
    const updateGraphicTile = (tileIndex, value) => {
        const graphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
        const nextTileIds = [...(graphic.tileIds || [])];
        nextTileIds[tileIndex] = value;
        updateGraphic({ tileIds: nextTileIds });
    };
    const updateGraphicSize = (width, height) => {
        const graphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
        const nextWidth = clampNumber(width, 1, 8);
        const nextHeight = clampNumber(height, 1, 6);
        const nextCount = nextWidth * nextHeight;
        updateGraphic({
            width: nextWidth,
            height: nextHeight,
            tileIds: Array.from({ length: nextCount }, (_, index) => graphic.tileIds?.[index] || ''),
        });
    };
    const borderCodes = { ...DEFAULT_BORDER_CHAR_CODES, ...data.box.borderCharCodes };
    const graphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
    const selectedGraphicPortrait = portraitAssets.find(asset => asset.id === graphic.portraitAssetId)?.data;
    const updateLinePortrait = (line, portraitAssetId) => {
        if (!portraitAssetId) {
            updateLine(line.id, { graphic: undefined });
            return;
        }
        const baseGraphic = getLineGraphic(line) || {
            ...graphic,
            enabled: true,
            tileIds: Array.isArray(graphic.tileIds) ? graphic.tileIds : [],
        };
        updateLineGraphic(line.id, applyPortraitToGraphic(baseGraphic, portraitAssetId));
    };
    const selectedBank = availableTileBanks.find(bank => bank.id === data.box.tileBankAssetId);
    const bankTileIds = selectedBank
        ? Array.from(new Set(selectedBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
        : [];
    const selectableTiles = tileAssets.filter(asset => bankTileIds.length === 0 || bankTileIds.includes(asset.id));
    const selectedGraphicBank = availableTileBanks.find(bank => bank.id === graphic.tileBankAssetId);
    const graphicBankTileIds = selectedGraphicBank
        ? Array.from(new Set(selectedGraphicBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
        : [];
    const graphicSelectableTiles = tileAssets.filter(asset => graphicBankTileIds.length === 0 || graphicBankTileIds.includes(asset.id));
    const maxBoxX = 28;
    const maxBoxY = 21;
    const maxBoxWidth = Math.max(4, 32 - data.box.x);
    const maxBoxHeight = Math.max(3, 24 - data.box.y);
    const previewLine = data.lines.find(line => line.text.trim()) || data.lines[0];
    const previewSpeaker = previewLine?.speaker?.trim();
    const previewText = `${previewSpeaker ? `${previewSpeaker}: ` : ''}${previewLine?.text || ''}`;
    const textColumnCapacity = Math.max(1, data.box.width - 2);
    const graphicReservedColumns = graphic.enabled ? Math.min(textColumnCapacity - 1, Math.max(1, graphic.width) + Math.max(0, graphic.padding)) : 0;
    const textColumnCapacityForExport = Math.max(1, textColumnCapacity - graphicReservedColumns);
    const textRowCapacity = Math.max(1, data.box.height - 2);
    const dialogueValidationIssues = [
        ...(data.exportOptions.maxCharsPerLine > textColumnCapacityForExport
            ? [`Max Chars / Line exceeds the available text width (${textColumnCapacityForExport}).`]
            : []),
        ...(data.exportOptions.maxLinesPerBox > textRowCapacity
            ? [`Max Lines / Box exceeds the box interior height (${textRowCapacity}).`]
            : []),
        ...data.lines.flatMap((line, index) => {
            const speakerPrefix = line.speaker?.trim() ? `${line.speaker.trim()}: ` : '';
            const rawLineText = `${speakerPrefix}${line.text || ''}`;
            const totalChars = rawLineText.length;
            const estimatedRows = Math.max(1, Math.ceil(totalChars / Math.max(1, data.exportOptions.maxCharsPerLine)));
            const unsupportedChars = getUnsupportedDialogueChars(rawLineText);
            return [
                ...(estimatedRows > data.exportOptions.maxLinesPerBox
                    ? [`Line ${index + 1} needs about ${estimatedRows} rows with the current export limits.`]
                    : []),
                ...(unsupportedChars.length > 0
                    ? [`Line ${index + 1} contains non-ASCII chars (${unsupportedChars.join(' ')}). Export will ${data.exportOptions.stripUnsupportedChars ? 'normalize or replace them' : 'replace unsupported bytes with spaces'}.`]
                    : []),
            ];
        }),
    ];
    return ((0, jsx_runtime_1.jsx)(Panel_1.Panel, { title: `Dialogue Editor: ${data.name || 'Dialogue'}`, className: "flex-grow flex flex-col min-h-0", children: (0, jsx_runtime_1.jsx)("div", { className: "p-4 flex-grow overflow-y-auto space-y-4", children: (0, jsx_runtime_1.jsxs)("section", { className: "grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-msx-highlight", children: "Lines" }), (0, jsx_runtime_1.jsx)(Button_1.Button, { size: "sm", onClick: addLine, icon: (0, jsx_runtime_1.jsx)(MsxIcons_1.PlusCircleIcon, { className: "w-4 h-4" }), children: "Add Line" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: data.lines.map((line, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "border border-msx-border bg-msx-bgcolor rounded p-3 space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-msx-textsecondary", children: ["Line ", index + 1] }), (0, jsx_runtime_1.jsx)(Button_1.Button, { size: "sm", variant: "danger", onClick: () => removeLine(line.id), disabled: data.lines.length <= 1, icon: (0, jsx_runtime_1.jsx)(MsxIcons_1.TrashIcon, { className: "w-3.5 h-3.5" }), children: "Remove" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-[180px_220px_1fr] gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Speaker" }), (0, jsx_runtime_1.jsx)("input", { className: inputClassName, value: line.speaker || '', onChange: event => updateLine(line.id, { speaker: event.target.value }), placeholder: "NPC" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Line Portrait / NPC" }), (0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: line.graphic?.portraitAssetId || (line.graphic ? '__manual__' : ''), onChange: event => {
                                                                if (event.target.value === '__manual__')
                                                                    return;
                                                                updateLinePortrait(line, event.target.value);
                                                            }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Global portrait" }), line.graphic && !line.graphic.portraitAssetId && ((0, jsx_runtime_1.jsx)("option", { value: "__manual__", children: "Manual line grid" })), portraitAssets.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] })] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-end gap-2 text-xs text-msx-textsecondary pb-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: line.waitForInput ?? true, onChange: event => updateLine(line.id, { waitForInput: event.target.checked }) }), "Wait for SPC on this line"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Text" }), (0, jsx_runtime_1.jsx)("textarea", { className: `${inputClassName} min-h-[88px] resize-y`, value: line.text, onChange: event => updateLine(line.id, { text: event.target.value }), placeholder: "Write dialogue text..." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-msx-border/70 bg-msx-bgcolor-dark/70 rounded p-2 space-y-2", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-xs text-msx-textsecondary", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: Boolean(line.graphic), onChange: event => updateLine(line.id, { graphic: event.target.checked ? { ...DEFAULT_TILE_GRAPHIC, enabled: true } : undefined }) }), "Override tile graphic for this line"] }), getLineGraphic(line) && (() => {
                                                    const lineGraphic = getLineGraphic(line);
                                                    const lineGraphicBank = availableTileBanks.find(bank => bank.id === lineGraphic.tileBankAssetId);
                                                    const lineGraphicBankTileIds = lineGraphicBank
                                                        ? Array.from(new Set(lineGraphicBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
                                                        : [];
                                                    const lineGraphicSelectableTiles = tileAssets.filter(asset => lineGraphicBankTileIds.length === 0 || lineGraphicBankTileIds.includes(asset.id));
                                                    const selectedLineGraphicPortrait = portraitAssets.find(asset => asset.id === lineGraphic.portraitAssetId)?.data;
                                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Portrait Asset" }), (0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: lineGraphic.portraitAssetId || '', onChange: event => {
                                                                            const portraitAssetId = event.target.value;
                                                                            updateLineGraphic(line.id, portraitAssetId
                                                                                ? applyPortraitToGraphic(lineGraphic, portraitAssetId)
                                                                                : { portraitAssetId: undefined });
                                                                        }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Manual tile grid" }), portraitAssets.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Side" }), (0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: lineGraphic.side, onChange: event => updateLineGraphic(line.id, { side: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "left", children: "Left of text" }), (0, jsx_runtime_1.jsx)("option", { value: "right", children: "Right of text" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Padding" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 0, max: 4, className: compactInputClassName, value: lineGraphic.padding, onChange: event => updateLineGraphic(line.id, { padding: clampNumber(Number(event.target.value), 0, 4) }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Width" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 1, max: 8, className: compactInputClassName, value: lineGraphic.width, disabled: Boolean(lineGraphic.portraitAssetId), onChange: event => updateLineGraphicSize(line.id, Number(event.target.value), lineGraphic.height) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Height" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 1, max: 6, className: compactInputClassName, value: lineGraphic.height, disabled: Boolean(lineGraphic.portraitAssetId), onChange: event => updateLineGraphicSize(line.id, lineGraphic.width, Number(event.target.value)) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "TileBank" }), (0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: lineGraphic.tileBankAssetId || '', onChange: event => updateLineGraphic(line.id, { tileBankAssetId: event.target.value || undefined }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Use no TileBank" }), availableTileBanks.map(bank => ((0, jsx_runtime_1.jsx)("option", { value: bank.id, children: bank.name }, bank.id)))] })] }), lineGraphic.portraitAssetId ? ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-msx-textsecondary", children: ["Using portrait \"", selectedLineGraphicPortrait?.name || 'missing', "\" (", lineGraphic.width, " x ", lineGraphic.height, " chars)."] })) : ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-1", style: { gridTemplateColumns: `repeat(${Math.max(1, lineGraphic.width)}, minmax(0, 1fr))` }, children: Array.from({ length: Math.max(1, lineGraphic.width) * Math.max(1, lineGraphic.height) }).map((_, tileIndex) => ((0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: lineGraphic.tileIds?.[tileIndex] || '', onChange: event => updateLineGraphicTile(line.id, tileIndex, event.target.value), title: `Line ${index + 1} graphic tile ${tileIndex + 1}`, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Empty" }), lineGraphicSelectableTiles.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] }, tileIndex))) }))] }));
                                                })()] })] }, line.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("section", { className: "border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-msx-highlight", children: "Text Box" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "X" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 0, max: maxBoxX, className: compactInputClassName, value: data.box.x, onChange: event => {
                                                            const nextX = clampNumber(Number(event.target.value), 0, maxBoxX);
                                                            updateBox({ x: nextX, width: clampNumber(data.box.width, 4, 32 - nextX) });
                                                        } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Y" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 0, max: maxBoxY, className: compactInputClassName, value: data.box.y, onChange: event => {
                                                            const nextY = clampNumber(Number(event.target.value), 0, maxBoxY);
                                                            updateBox({ y: nextY, height: clampNumber(data.box.height, 3, 24 - nextY) });
                                                        } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Width" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 4, max: maxBoxWidth, className: compactInputClassName, value: data.box.width, onChange: event => updateBox({ width: clampNumber(Number(event.target.value), 4, maxBoxWidth) }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Height" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 3, max: maxBoxHeight, className: compactInputClassName, value: data.box.height, onChange: event => updateBox({ height: clampNumber(Number(event.target.value), 3, maxBoxHeight) }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "relative aspect-[4/3] border border-msx-border bg-msx-bgcolor-dark overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "absolute border border-msx-accent bg-msx-bgcolor/95 p-1 text-[10px] leading-tight text-msx-textprimary font-mono overflow-hidden", style: {
                                                left: `${(data.box.x / 32) * 100}%`,
                                                top: `${(data.box.y / 24) * 100}%`,
                                                width: `${(data.box.width / 32) * 100}%`,
                                                height: `${(data.box.height / 24) * 100}%`,
                                            }, children: (0, jsx_runtime_1.jsxs)("div", { className: `flex h-full gap-1 ${graphic.side === 'right' ? 'flex-row-reverse' : ''}`, children: [graphic.enabled && ((0, jsx_runtime_1.jsx)("div", { className: "grid shrink-0 gap-px", style: {
                                                            width: `${Math.max(1, graphic.width) * 12}px`,
                                                            gridTemplateColumns: `repeat(${Math.max(1, graphic.width)}, minmax(0, 1fr))`,
                                                        }, children: Array.from({ length: Math.max(1, graphic.width) * Math.max(1, graphic.height) }).map((_, index) => {
                                                            const tileId = graphic.tileIds?.[index];
                                                            const tileName = tileAssets.find(asset => asset.id === tileId)?.name || '';
                                                            return ((0, jsx_runtime_1.jsx)("div", { className: "aspect-square bg-msx-accent/30 border border-msx-accent/40 text-[7px] text-msx-textsecondary overflow-hidden", title: tileName || 'Empty graphic tile', children: tileName.slice(0, 1) }, index));
                                                        }) })), (0, jsx_runtime_1.jsx)("div", { className: "min-w-0 flex-1 overflow-hidden", children: previewText || '...' })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Font" }), (0, jsx_runtime_1.jsxs)("select", { className: inputClassName, value: data.box.fontAssetId || '', onChange: event => updateBox({ fontAssetId: event.target.value || undefined }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Default project font" }), fontAssets.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] }), fontAssets.length === 0 && onCreateAsset && ((0, jsx_runtime_1.jsx)(Button_1.Button, { size: "sm", variant: "secondary", className: "mt-2", onClick: createAndAssignFont, children: "Create and Use Font" }))] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-msx-highlight", children: "Tile Graphic" }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-xs text-msx-textsecondary", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: graphic.enabled, onChange: event => updateGraphic({ enabled: event.target.checked }) }), "Enabled"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Portrait Asset" }), (0, jsx_runtime_1.jsxs)("select", { className: inputClassName, value: graphic.portraitAssetId || '', onChange: event => {
                                                    const portraitAssetId = event.target.value;
                                                    updateGraphic(portraitAssetId
                                                        ? applyPortraitToGraphic(graphic, portraitAssetId)
                                                        : { portraitAssetId: undefined });
                                                }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Manual tile grid" }), portraitAssets.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] }), portraitAssets.length === 0 && onCreateAsset && ((0, jsx_runtime_1.jsx)(Button_1.Button, { size: "sm", variant: "secondary", className: "mt-2", onClick: createAndAssignPortrait, children: "Create and Use Portrait" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Side" }), (0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: graphic.side, onChange: event => updateGraphic({ side: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "left", children: "Left of text" }), (0, jsx_runtime_1.jsx)("option", { value: "right", children: "Right of text" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Padding Columns" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 0, max: 4, className: compactInputClassName, value: graphic.padding, onChange: event => updateGraphic({ padding: clampNumber(Number(event.target.value), 0, 4) }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Width Tiles" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 1, max: 8, className: compactInputClassName, value: graphic.width, disabled: Boolean(graphic.portraitAssetId), onChange: event => updateGraphicSize(Number(event.target.value), graphic.height) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Height Tiles" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 1, max: 6, className: compactInputClassName, value: graphic.height, disabled: Boolean(graphic.portraitAssetId), onChange: event => updateGraphicSize(graphic.width, Number(event.target.value)) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "TileBank" }), (0, jsx_runtime_1.jsxs)("select", { className: inputClassName, value: graphic.tileBankAssetId || '', onChange: event => updateGraphic({ tileBankAssetId: event.target.value || undefined }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select TileBank" }), availableTileBanks.map(bank => ((0, jsx_runtime_1.jsx)("option", { value: bank.id, children: bank.name }, bank.id)))] }), availableTileBanks.length === 0 && onCreateAsset && ((0, jsx_runtime_1.jsx)(Button_1.Button, { size: "sm", variant: "secondary", className: "mt-2", onClick: createAndAssignGraphicTileBank, children: "Create and Use TileBank" }))] }), graphic.enabled && graphic.portraitAssetId ? ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-msx-textsecondary", children: ["Using portrait \"", selectedGraphicPortrait?.name || 'missing', "\" (", graphic.width, " x ", graphic.height, " chars)."] })) : graphic.enabled && ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-1", style: { gridTemplateColumns: `repeat(${Math.max(1, graphic.width)}, minmax(0, 1fr))` }, children: Array.from({ length: Math.max(1, graphic.width) * Math.max(1, graphic.height) }).map((_, index) => ((0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: graphic.tileIds?.[index] || '', onChange: event => updateGraphicTile(index, event.target.value), title: `Graphic tile ${index + 1}`, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Empty" }), graphicSelectableTiles.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] }, index))) }))] }), (0, jsx_runtime_1.jsxs)("section", { className: "border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-msx-highlight", children: "Border" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Source" }), (0, jsx_runtime_1.jsxs)("select", { className: inputClassName, value: data.box.borderSource, onChange: event => updateBox({ borderSource: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "generated", children: "Generated simple line chars" }), (0, jsx_runtime_1.jsx)("option", { value: "tilebank", children: "TileBank tiles" })] })] }), data.box.borderSource === 'generated' ? ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: [
                                            ['topLeft', 'Top Left'],
                                            ['topRight', 'Top Right'],
                                            ['bottomLeft', 'Bottom Left'],
                                            ['bottomRight', 'Bottom Right'],
                                            ['horizontal', 'Horizontal'],
                                            ['vertical', 'Vertical'],
                                        ].map(([field, label]) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: label }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 0, max: 255, className: compactInputClassName, value: borderCodes[field], onChange: event => updateBorderCharCode(field, Number(event.target.value)) })] }, field))) })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "TileBank" }), (0, jsx_runtime_1.jsxs)("select", { className: inputClassName, value: data.box.tileBankAssetId || '', onChange: event => updateBox({ tileBankAssetId: event.target.value || undefined }), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select TileBank" }), availableTileBanks.map(bank => ((0, jsx_runtime_1.jsx)("option", { value: bank.id, children: bank.name }, bank.id)))] }), availableTileBanks.length === 0 && onCreateAsset && ((0, jsx_runtime_1.jsx)(Button_1.Button, { size: "sm", variant: "secondary", className: "mt-2", onClick: createAndAssignTileBank, children: "Create and Use TileBank" }))] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
                                                    ['topLeftTileId', 'Top Left'],
                                                    ['topRightTileId', 'Top Right'],
                                                    ['bottomLeftTileId', 'Bottom Left'],
                                                    ['bottomRightTileId', 'Bottom Right'],
                                                    ['horizontalTileId', 'Horizontal'],
                                                    ['verticalTileId', 'Vertical'],
                                                ].map(([field, label]) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: label }), (0, jsx_runtime_1.jsxs)("select", { className: compactInputClassName, value: data.box.borderTiles?.[field] || '', onChange: event => updateBorderTile(field, event.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Omitted" }), selectableTiles.map(asset => ((0, jsx_runtime_1.jsx)("option", { value: asset.id, children: asset.name }, asset.id)))] })] }, field))) })] }))] }), (0, jsx_runtime_1.jsxs)("section", { className: "border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-msx-highlight", children: "Playback / Export Metadata" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Char Delay Frames" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 0, max: 255, className: compactInputClassName, value: data.exportOptions.charDelayFrames, onChange: event => updateExportOptions({ charDelayFrames: clampNumber(Number(event.target.value), 0, 255) }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Max Chars / Line" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 4, max: 64, className: compactInputClassName, value: data.exportOptions.maxCharsPerLine, onChange: event => updateExportOptions({ maxCharsPerLine: clampNumber(Number(event.target.value), 4, 64) }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: labelClassName, children: "Max Lines / Box" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 1, max: 8, className: compactInputClassName, value: data.exportOptions.maxLinesPerBox, onChange: event => updateExportOptions({ maxLinesPerBox: clampNumber(Number(event.target.value), 1, 8) }) })] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-end gap-2 text-xs text-msx-textsecondary pb-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: data.exportOptions.stripUnsupportedChars, onChange: event => updateExportOptions({ stripUnsupportedChars: event.target.checked }) }), "Strip unsupported chars"] })] }), dialogueValidationIssues.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "border border-yellow-500/50 bg-yellow-950/40 text-yellow-100 text-xs rounded p-2", children: (0, jsx_runtime_1.jsx)("ul", { className: "list-disc list-inside space-y-0.5", children: dialogueValidationIssues.map(issue => ((0, jsx_runtime_1.jsx)("li", { children: issue }, issue))) }) }))] })] })] }) }) }));
};
exports.DialogueEditor = DialogueEditor;
