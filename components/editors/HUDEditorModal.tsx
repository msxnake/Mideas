
import React, { useState, useEffect } from 'react';
import { HUDConfiguration, HUDElement, HUDElementType, HUDElementProperties_Base, MSXColorValue, MSX1ColorValue, MSXFont, MSXFontColorAttributes } from '../../types';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';
import { MSX1_PALETTE, MSX1_PALETTE_IDX_MAP, MSX1_DEFAULT_COLOR } from '../../constants'; 
import { renderMSX1TextToDataURL, getTextDimensionsMSX1, DEFAULT_MSX_FONT } from '../utils/msxFontRenderer'; 

interface HUDEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  hudConfiguration: HUDConfiguration;
  onUpdateHUDConfiguration: (newConfig: HUDConfiguration) => void;
  currentScreenMode: string;
  screenMapWidth: number;
  screenMapHeight: number;
  screenMapActiveAreaX: number;
  screenMapActiveAreaY: number;
  screenMapActiveAreaWidth: number;
  screenMapActiveAreaHeight: number;
  baseCellDimension: number; 
  msxFont: MSXFont; 
  msxFontColorAttributes: MSXFontColorAttributes; // Added prop
}

type HudTab = "Basic Stats" | "Game Elements" | "Boss Battle" | "Custom";

const DEFAULT_HUD_ELEMENT_PROPS: Omit<HUDElementProperties_Base, 'name'> = {
  position: { x: 8, y: 8 },
  visible: true,
  text: "", 
  details: {},
  memoryAddress: "0xF000", 
};

const hudElementTemplates: Record<HudTab, { type: HUDElementType; name: string; defaultText?: string; defaultDetails?: Record<string, any> }[]> = {
  "Basic Stats": [
    { type: HUDElementType.Score, name: "Score", defaultText: "SCORE: 000000", defaultDetails: { digits: 6, textColor: MSX1_PALETTE[15].hex, textBackgroundColor: 'transparent' } },
    { type: HUDElementType.HighScore, name: "High Score", defaultText: "HI-SCORE: 000000", defaultDetails: { digits: 6, textColor: MSX1_PALETTE[15].hex, textBackgroundColor: 'transparent' } },
    { type: HUDElementType.Lives, name: "Lives", defaultText: "LIVES:", defaultDetails: { icon: 'ship', max: 3, iconTileId: null, textColor: MSX1_PALETTE[15].hex, textBackgroundColor: 'transparent' } },
    { 
      type: HUDElementType.EnergyBar, 
      name: "Energy Bar", 
      defaultText: "",
      defaultDetails: { 
        style: 'simple', 
        orientation: 'horizontal', 
        maxValue: 16, 
        currentValue: 12,
        width: 64, 
        height: 8, 
        filledColor: MSX1_PALETTE[3].hex, 
        emptyColor: MSX1_PALETTE[6].hex, 
        borderColor: MSX1_PALETTE[15].hex, 
        borderThickness: 1 
      } 
    },
  ],
  "Game Elements": [
    { 
      type: HUDElementType.ItemDisplay, 
      name: "Item Display", 
      defaultText: "",
      defaultDetails: { 
        gridSize: '3x1', 
        itemIconSize: 16, 
        showCounter: true, 
        counterDigits: 1, 
        spacing: 2,
        slotBackgroundColor: 'rgba(200,200,200,0.1)' as MSXColorValue,
        slotBorderColor: MSX1_PALETTE[15].hex,
        counterColor: MSX1_PALETTE[11].hex, 
        overallBorderColor: 'rgba(255,255,255,0.3)' as MSXColorValue,
        overallBackgroundColor: 'rgba(0,0,100,0.3)' as MSXColorValue,
      } 
    },
    { type: HUDElementType.SceneName, name: "Scene Name Display", defaultText: "STAGE 1", defaultDetails: { animation: 'static', textColor: MSX1_PALETTE[15].hex, textBackgroundColor: 'transparent' } },
    { type: HUDElementType.MiniMap, name: "Mini-Map", defaultDetails: { style: 'grid', size: "64x64" } }, 
    { type: HUDElementType.CoinCounter, name: "Coin Counter", defaultText: "$00", defaultDetails: { symbol: '$', format: 'X00', textColor: MSX1_PALETTE[11].hex, textBackgroundColor: 'transparent' } },
  ],
  "Boss Battle": [
    { 
      type: HUDElementType.BossEnergyBar, 
      name: "Boss Energy", 
      defaultText: "",
      defaultDetails: { 
        style: 'megaman', 
        orientation: 'horizontal', 
        maxValue: 28, 
        currentValue: 28,
        width: 128, 
        height: 12, 
        filledColorPrimary: MSX1_PALETTE[9].hex, 
        filledColorSecondary: MSX1_PALETTE[11].hex, 
        criticalThresholdPercent: 25, 
        emptyColor: MSX1_PALETTE[4].hex, 
        borderColor: MSX1_PALETTE[15].hex,
        borderThickness: 1,
        segmentSpacing: 1, 
      } 
    },
    { type: HUDElementType.PhaseIndicator, name: "Boss Phase", defaultDetails: { icons: 3, iconTileId: null } },
    { type: HUDElementType.AttackAlert, name: "Attack Alert", defaultText: "WARNING!", defaultDetails: { blink: true, textColor: MSX1_PALETTE[8].hex, textBackgroundColor: 'transparent' } },
  ],
  "Custom": [
    { type: HUDElementType.TextBox, name: "Custom Text Box", defaultText: "Your text here...", defaultDetails: { border: 'decorative', textColor: MSX1_PALETTE[15].hex, textBackgroundColor: MSX1_PALETTE[4].hex } },
    { type: HUDElementType.NumericField, name: "Custom Numeric Field", defaultText: "DATA: 123", defaultDetails: { label: 'DATA:', textColor: MSX1_PALETTE[15].hex, textBackgroundColor: 'transparent' } },
    { type: HUDElementType.CustomCounter, name: "Custom Counter", defaultText: "00", defaultDetails: { format: 'decimal', textColor: MSX1_PALETTE[15].hex, textBackgroundColor: 'transparent' } },
  ],
};

const PREVIEW_WIDTH_PX = 256;
const PREVIEW_HEIGHT_PX = 192;


export const HUDEditorModal: React.FC<HUDEditorModalProps> = ({
  isOpen,
  onClose,
  hudConfiguration,
  onUpdateHUDConfiguration,
  currentScreenMode,
  screenMapWidth, 
  screenMapHeight, 
  screenMapActiveAreaX, 
  screenMapActiveAreaY, 
  screenMapActiveAreaWidth, 
  screenMapActiveAreaHeight, 
  baseCellDimension, 
  msxFont, 
  msxFontColorAttributes, // Received prop
}) => {
  const [activeTab, setActiveTab] = useState<HudTab>("Basic Stats");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [localHudConfig, setLocalHudConfig] = useState<HUDConfiguration>(hudConfiguration);

  useEffect(() => {
    setLocalHudConfig(hudConfiguration);
  }, [hudConfiguration]);

  useEffect(() => {
    if (localHudConfig.elements.length > 0) {
      const currentSelectionStillExists = localHudConfig.elements.some(el => el.id === selectedElementId);
      if (!selectedElementId || !currentSelectionStillExists) {
        setSelectedElementId(localHudConfig.elements[0].id);
      }
    } else {
      setSelectedElementId(null); 
    }
  }, [localHudConfig.elements, selectedElementId]);


  const handleAddElement = (elementType: HUDElementType, elementNameSeed: string, defaultText?: string, defaultDetails?: Record<string, any>) => {
    const numElements = localHudConfig.elements.length;
    const posX = 8; 
    let posY = 8 + (numElements * 16); 

    const screenTotalPixelHeight = screenMapHeight * baseCellDimension;
    if (posY > screenTotalPixelHeight - 16) { 
        posY = Math.max(8, (posY % Math.max(1, screenTotalPixelHeight - 16)) + 8 - ( (posY % Math.max(1,screenTotalPixelHeight -16)) < 8 ? 8 : 0)  ) ;
        if(posY >= screenTotalPixelHeight - 16) posY = 8;
    }
    
    const finalPosX = Math.round(posX / 8) * 8;
    const finalPosY = Math.round(posY / 8) * 8;

    const newElement: HUDElement = {
      id: `hud_${elementType.toLowerCase()}_${Date.now()}`,
      type: elementType,
      name: `${elementNameSeed} ${localHudConfig.elements.filter(el => el.type === elementType).length + 1}`,
      ...DEFAULT_HUD_ELEMENT_PROPS,
      position: { x: finalPosX, y: finalPosY },
      text: elementType === HUDElementType.EnergyBar || elementType === HUDElementType.BossEnergyBar || elementType === HUDElementType.ItemDisplay ? "" : (defaultText ?? `${elementNameSeed}`),
      details: defaultDetails || {},
    };
    const updatedConfig = { ...localHudConfig, elements: [...localHudConfig.elements, newElement] };
    setLocalHudConfig(updatedConfig);
    onUpdateHUDConfiguration(updatedConfig);
    setSelectedElementId(newElement.id);
  };

  const handleRemoveElement = (elementId: string) => {
    const updatedElements = localHudConfig.elements.filter(el => el.id !== elementId);
    const updatedConfig = { ...localHudConfig, elements: updatedElements };
    setLocalHudConfig(updatedConfig);
    onUpdateHUDConfiguration(updatedConfig);
  };

  const handlePropertyChange = (elementId: string, propertyPath: string, value: any) => {
    const pathParts = propertyPath.split('.');
    
    const updatedElements = localHudConfig.elements.map(el => {
      if (el.id === elementId) {
        let newEl = { ...el };
        let currentLevel: any = newEl;

        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!currentLevel[pathParts[i]] || typeof currentLevel[pathParts[i]] !== 'object') {
            currentLevel[pathParts[i]] = {}; 
          }
          currentLevel = currentLevel[pathParts[i]];
        }
        
        let valToSet = value;
        if (propertyPath === "position.x" || propertyPath === "position.y") {
            const numVal = parseInt(value, 10);
            valToSet = isNaN(numVal) ? (currentLevel[pathParts[pathParts.length - 1]] || 0) : Math.round(numVal / 8) * 8; 
        } else if ( (propertyPath.endsWith('Value') && propertyPath.startsWith('details.')) || 
                    (propertyPath.endsWith('Width') && propertyPath.startsWith('details.')) ||
                    (propertyPath.endsWith('Height') && propertyPath.startsWith('details.')) ||
                    (propertyPath.endsWith('Thickness') && propertyPath.startsWith('details.')) ||
                    (propertyPath.endsWith('Spacing') && propertyPath.startsWith('details.')) ||
                    (propertyPath.endsWith('Digits') && propertyPath.startsWith('details.')) ||
                     propertyPath === 'details.itemIconSize' || 
                     propertyPath === 'details.spacing' ||
                     propertyPath === 'details.criticalThresholdPercent'
                   ) {
            const numVal = parseInt(value, 10);
            valToSet = isNaN(numVal) ? 0 : numVal;
        } else if (propertyPath.startsWith('details.') && (propertyPath.endsWith('Color') || propertyPath.endsWith('ColorPrimary') || propertyPath.endsWith('ColorSecondary'))) {
            if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgba') || value === 'transparent')) {
            } else if (typeof value === 'string' && value.trim() === '') {
                valToSet = undefined; 
            } 
        }


        currentLevel[pathParts[pathParts.length - 1]] = valToSet;
        return newEl;
      }
      return el;
    });
    const updatedConfig = { ...localHudConfig, elements: updatedElements };
    setLocalHudConfig(updatedConfig);
    onUpdateHUDConfiguration(updatedConfig);
  };

  const selectedElement = localHudConfig.elements.find(el => el.id === selectedElementId);

  if (!isOpen) return null;

  const renderPropertyField = (element: HUDElement, key: string, value: any, pathPrefix: string) => {
    const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    const inputId = `${element.id}-${fullPath}`;

    if (typeof value === 'boolean') {
      return (
        <div key={fullPath} className="flex items-center">
          <input type="checkbox" id={inputId} checked={value} onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.checked)}
            className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent mr-2" />
          <label htmlFor={inputId} className="text-msx-textsecondary">{label}</label>
        </div>
      );
    } else if (typeof value === 'number' || 
               ( (key.endsWith('Value') || key.endsWith('Width') || key.endsWith('Height') || key.endsWith('Thickness') || key.endsWith('Spacing') || key.endsWith('Digits') || key === 'itemIconSize' || key === 'criticalThresholdPercent') && pathPrefix === 'details')) {
      const isPositionCoordinate = (pathPrefix === "position" && (key === "x" || key === "y"));
      return (
        <div key={fullPath}>
          <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
          <input type="number" id={inputId} value={value} step={isPositionCoordinate ? 8 : 1}
            min={key === 'criticalThresholdPercent' ? 0 : undefined}
            max={key === 'criticalThresholdPercent' ? 100 : undefined}
            onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
            className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent" />
        </div>
      );
    } else if ( (key.endsWith('Color') && pathPrefix === 'details') || (key.endsWith('ColorPrimary') && pathPrefix === 'details') || (key.endsWith('ColorSecondary') && pathPrefix === 'details') ) {
        return (
          <div key={fullPath}>
            <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
            <div className="flex items-center">
                <input type="text" id={inputId} value={String(value || '')} 
                    onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
                    className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded-l text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                    placeholder="e.g., #RRGGBB or transparent" />
                <div className="w-6 h-6 border border-msx-border rounded-r" style={{backgroundColor: String(value || 'transparent')}}></div>
            </div>
          </div>
        );
    } else if (key === 'orientation' && pathPrefix === 'details' && (element.type === HUDElementType.EnergyBar || element.type === HUDElementType.BossEnergyBar)) {
        return (
            <div key={fullPath}>
                <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
                <select id={inputId} value={String(value)} onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
                    className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent">
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                </select>
            </div>
        );
    } else if (key === 'style' && pathPrefix === 'details' && (element.type === HUDElementType.EnergyBar || element.type === HUDElementType.BossEnergyBar)) {
        const options = element.type === HUDElementType.EnergyBar ? ['simple', 'cyber', 'medieval'] : ['megaman', 'simple'];
        return (
            <div key={fullPath}>
                <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
                <select id={inputId} value={String(value)} onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
                    className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent">
                    {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                </select>
            </div>
        );
    } else if (key === 'gridSize' && pathPrefix === 'details' && element.type === HUDElementType.ItemDisplay) {
        const options = ['2x1', '3x1', '3x2', '4x2']; 
        return (
             <div key={fullPath}>
                <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
                <select id={inputId} value={String(value)} onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
                    className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent">
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        );
    } else if (key === 'itemIconSize' && pathPrefix === 'details' && element.type === HUDElementType.ItemDisplay) {
         const options = [8, 16];
        return (
             <div key={fullPath}>
                <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label} (px):</label>
                <select id={inputId} value={String(value)} onChange={(e) => handlePropertyChange(element.id, fullPath, parseInt(e.target.value,10))}
                    className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent">
                    {options.map(opt => <option key={opt} value={opt}>{opt}x{opt}</option>)}
                </select>
            </div>
        );
    } else if (key === 'counterDigits' && pathPrefix === 'details' && element.type === HUDElementType.ItemDisplay) {
        const options = [1, 2];
        return (
            <div key={fullPath}>
                <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
                <select id={inputId} value={String(value)} 
                        onChange={(e) => handlePropertyChange(element.id, fullPath, parseInt(e.target.value,10))}
                        disabled={!element.details?.showCounter}
                        className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent disabled:opacity-50">
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        );
    }


    if (typeof value === 'object' && value !== null) {
        if (pathPrefix === '' && (key === 'details' || key === 'position')) {
            return (
                <div key={fullPath} className="pl-2 border-l border-msx-border/30 my-1">
                    <p className="text-xs text-msx-highlight -ml-2 mb-0.5">{label}:</p>
                    {Object.entries(value).map(([subKey, subValue]) => renderPropertyField(element, subKey, subValue, fullPath))}
                </div>
            );
        }
        return <p className="text-xs text-msx-textsecondary">{label}: [Object]</p>;
    }
    const isTextarea = key === 'text' && typeof value === 'string' && (value.length > 30 || value.includes('\n'));
    if (isTextarea) {
        return (
            <div key={fullPath}>
                <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
                <textarea id={inputId} value={String(value)} onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
                    className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent min-h-[40px]"
                    rows={2} />
            </div>
        );
    }
    return (
      <div key={fullPath}>
        <label htmlFor={inputId} className="block text-xs text-msx-textsecondary mb-0.5">{label}:</label>
        <input type="text" id={inputId} value={String(value)} onChange={(e) => handlePropertyChange(element.id, fullPath, e.target.value)}
          className="w-full p-1 text-xs bg-msx-bgcolor border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent" />
      </div>
    );
  };

  const commonProperties: (keyof HUDElementProperties_Base)[] = ['name', 'text', 'position', 'visible', 'memoryAddress'];

  const screenTotalPixelWidth = screenMapWidth * baseCellDimension;
  const screenTotalPixelHeight = screenMapHeight * baseCellDimension;

  const previewScaleX = PREVIEW_WIDTH_PX / screenTotalPixelWidth;
  const previewScaleY = PREVIEW_HEIGHT_PX / screenTotalPixelHeight;
  const finalPreviewScale = Math.min(previewScaleX, previewScaleY, 1); 

  const scaledTileW = baseCellDimension * finalPreviewScale;
  const scaledTileH = baseCellDimension * finalPreviewScale;

  const isTextBasedElement = (elType: HUDElementType) => {
    return [
        HUDElementType.Score, HUDElementType.HighScore, HUDElementType.Lives,
        HUDElementType.SceneName, HUDElementType.CoinCounter, HUDElementType.AttackAlert,
        HUDElementType.TextBox, HUDElementType.NumericField, HUDElementType.CustomCounter
    ].includes(elType);
  };


  const renderHudPreview = () => {
    const previewElements: React.ReactNode[] = [];
    
    for (let r = 0; r < screenMapHeight; r++) {
        for (let c = 0; c < screenMapWidth; c++) {
            const isCellInActiveArea = 
                c >= screenMapActiveAreaX && c < (screenMapActiveAreaX + screenMapActiveAreaWidth) &&
                r >= screenMapActiveAreaY && r < (screenMapActiveAreaY + screenMapActiveAreaHeight);
            
            previewElements.push(
                <div key={`preview-tile-${r}-${c}`}
                    style={{
                        position: 'absolute', left: c * scaledTileW, top: r * scaledTileH,
                        width: scaledTileW, height: scaledTileH,
                        backgroundColor: isCellInActiveArea ? 'rgba(0, 50, 100, 0.3)' : 'rgba(100, 100, 0, 0.3)',
                        border: '0.5px solid rgba(255,255,255,0.1)',
                    }}
                    title={`Tile (${c},${r}) - ${isCellInActiveArea ? 'Active Game Area' : 'HUD Area'}`}
                />
            );
        }
    }

    localHudConfig.elements.forEach(el => {
        if (!el.visible) return;
        const elBaseX = el.position.x * finalPreviewScale;
        const elBaseY = el.position.y * finalPreviewScale;
        const isSelected = selectedElementId === el.id;
        
        const details = el.details || {};
        const isMSX1Screen = currentScreenMode === "SCREEN 2 (Graphics I)";

        if (isTextBasedElement(el.type) && (el.text || el.name)) {
            const textToRender = el.text || el.name || "TEXT";
            const charSpacing = typeof details.charSpacing === 'number' ? details.charSpacing : 0;
            const fontToUse = msxFont || DEFAULT_MSX_FONT;
             // Pass fontColorAttributes directly
            const textImageSrc = renderMSX1TextToDataURL(textToRender, fontToUse, msxFontColorAttributes, 1, charSpacing);
            const dimensions = getTextDimensionsMSX1(textToRender, charSpacing);
            
            let bgColorForPreview = 'transparent';
            if (isMSX1Screen && msxFontColorAttributes) {
                const firstCharAttrs = msxFontColorAttributes[textToRender.charCodeAt(0)];
                if (firstCharAttrs && firstCharAttrs[0]) { // Use first row's BG for the image container if defined
                    bgColorForPreview = firstCharAttrs[0].bg;
                }
            }


            previewElements.push(
                <img
                    key={`preview-hudel-text-${el.id}`}
                    src={textImageSrc}
                    alt={el.name}
                    style={{
                        position: 'absolute', left: elBaseX, top: elBaseY,
                        width: dimensions.width * finalPreviewScale,
                        height: dimensions.height * finalPreviewScale,
                        imageRendering: 'pixelated',
                        border: isSelected ? `1px dashed #FFFF00` : undefined,
                        outline: isSelected ? `1px solid #FFDD00` : undefined, 
                        backgroundColor: bgColorForPreview !== 'transparent' ? bgColorForPreview : undefined, 
                    }}
                    title={`${el.name} @ (${el.position.x},${el.position.y}) - Text: ${el.text || ''}. Colors per MSX1 char data.`}
                />
            );

        } else if (el.type === HUDElementType.EnergyBar || el.type === HUDElementType.BossEnergyBar) {
            const orientation = details.orientation === 'vertical' ? 'vertical' : 'horizontal';
            const barWidth = (details.width || (el.type === HUDElementType.EnergyBar ? 64 : 128)) * finalPreviewScale;
            const barHeight = (details.height || (el.type === HUDElementType.EnergyBar ? 8 : 12)) * finalPreviewScale;
            const maxValue = details.maxValue || (el.type === HUDElementType.EnergyBar ? 16 : 28);
            let currentValue = details.currentValue ?? maxValue * (el.type === HUDElementType.EnergyBar ? 0.75 : 1);
            if (currentValue > maxValue) currentValue = maxValue;
            if (currentValue < 0) currentValue = 0;

            const filledColor = (details.filledColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[3].hex : '#74D07D');
            const filledColorPrimary = (details.filledColorPrimary as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[9].hex : '#FF8E81');
            const filledColorSecondary = (details.filledColorSecondary as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[11].hex : '#E7E474');
            const emptyColor = (details.emptyColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[6].hex : '#B63125');
            const borderColor = (details.borderColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[15].hex : '#FFFFFF');
            const borderThickness = Math.max(0.5, (details.borderThickness || 1) * finalPreviewScale);
            const segmentSpacing = (details.segmentSpacing || 1) * finalPreviewScale;
            const style = details.style || (el.type === HUDElementType.EnergyBar ? 'simple' : 'megaman');
            const fillRatio = Math.max(0, Math.min(1, currentValue / maxValue));
            
            const outerStyle: React.CSSProperties = {
                position: 'absolute', left: elBaseX, top: elBaseY,
                width: barWidth, height: barHeight,
                backgroundColor: emptyColor,
                border: `${borderThickness}px solid ${borderColor}`,
                boxSizing: 'border-box',
                outline: isSelected ? `1px solid #FFFF00` : undefined,
            };

            if (el.type === HUDElementType.EnergyBar && style === 'cyber') {
                const numSegments = details.numSegments ?? 8;
                const pipActualWidth = (barWidth - (numSegments -1) * segmentSpacing - 2 * borderThickness) / numSegments;
                const pipActualHeight = barHeight - 2 * borderThickness;
                const segments: React.ReactNode[] = [];
                for(let i=0; i<numSegments; i++) {
                    const isFilled = (i + 1) / numSegments <= fillRatio;
                    segments.push(
                        <div key={i} style={{
                            width: pipActualWidth, height: pipActualHeight, backgroundColor: isFilled ? filledColor : emptyColor,
                            marginRight: orientation === 'horizontal' && i < numSegments -1 ? segmentSpacing : 0,
                            marginBottom: orientation === 'vertical' && i < numSegments -1 ? segmentSpacing : 0,
                            border: `${Math.max(0.5, borderThickness/2)}px solid ${borderColor}`,
                        }} /> );
                }
                 previewElements.push( <div key={`preview-hudel-${el.id}`} style={outerStyle} title={`${el.name} ${currentValue}/${maxValue}`}> <div style={{ display: 'flex', flexDirection: orientation === 'vertical' ? 'column-reverse' : 'row', width: '100%', height: '100%', padding:borderThickness }}> {segments} </div> </div> );
            } else if (el.type === HUDElementType.BossEnergyBar && style === 'megaman') {
                const numRows = details.numDisplayRows ?? 2; 
                const pipsPerActualRow = Math.ceil(maxValue / numRows);
                const pipOuterHeight = (barHeight - (numRows - 1) * segmentSpacing - 2 * borderThickness) / numRows;
                const pipActualHeight = Math.max(1, pipOuterHeight - 2 * Math.max(0.25, borderThickness / 2));
                const pipOuterWidth = (barWidth - (pipsPerActualRow - 1) * segmentSpacing - 2 * borderThickness) / pipsPerActualRow;
                const pipActualWidth = Math.max(1, pipOuterWidth - 2 * Math.max(0.25, borderThickness / 2));
                const effectiveFilledColor = (details.criticalThresholdPercent && filledColorSecondary && (currentValue / maxValue) * 100 <= details.criticalThresholdPercent) ? filledColorSecondary : filledColorPrimary;
                const rowsOfPips: React.ReactNode[] = [];
                for (let r = 0; r < numRows; r++) {
                    const pipsInThisRow: React.ReactNode[] = [];
                    const healthStartForThisRow = r * pipsPerActualRow;
                    for (let i = 0; i < pipsPerActualRow; i++) {
                        const pipOverallIndex = healthStartForThisRow + i;
                        if (pipOverallIndex >= maxValue) continue;
                        const isFilled = pipOverallIndex < currentValue;
                        pipsInThisRow.push( <div key={`pip-${r}-${i}`} style={{ width: pipActualWidth, height: pipActualHeight, backgroundColor: isFilled ? effectiveFilledColor : emptyColor, border: `${Math.max(0.25, borderThickness/2)}px solid ${borderColor}`, marginRight: i < pipsPerActualRow - 1 ? segmentSpacing : 0, }} /> );
                    }
                    rowsOfPips.push( <div key={`row-${r}`} style={{display: 'flex', flexDirection: 'row', marginBottom: r < numRows - 1 ? segmentSpacing : 0}}> {pipsInThisRow} </div> );
                }
                 previewElements.push( <div key={`preview-hudel-${el.id}`} style={outerStyle} title={`${el.name} ${currentValue}/${maxValue}`}> <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', padding: borderThickness }}> {rowsOfPips} </div> </div> );
            } else { 
                 const filledStyle: React.CSSProperties = {
                    width: orientation === 'horizontal' ? `${fillRatio * 100}%` : '100%',
                    height: orientation === 'vertical' ? `${fillRatio * 100}%` : '100%',
                    backgroundColor: el.type === HUDElementType.BossEnergyBar ? filledColorPrimary : filledColor, 
                    position: 'absolute', bottom: orientation === 'vertical' ? 0 : undefined, left: orientation === 'horizontal' ? 0 : undefined,
                };
                previewElements.push( <div key={`preview-hudel-${el.id}`} style={outerStyle} title={`${el.name} ${currentValue}/${maxValue}`}> <div style={filledStyle}></div> </div> );
            }
        } else if (el.type === HUDElementType.ItemDisplay) {
            const itemDetails = el.details || {};
            const [itemRowsStr, itemColsStr] = (itemDetails.gridSize || '3x1').split('x');
            const itemRows = parseInt(itemRowsStr, 10) || 1;
            const itemCols = parseInt(itemColsStr, 10) || 3;
            const itemIconSize = (itemDetails.itemIconSize || 16) * finalPreviewScale;
            const itemSpacing = (itemDetails.spacing || 2) * finalPreviewScale;
            const showCounter = itemDetails.showCounter === true;
            const counterDigits = itemDetails.counterDigits || 1;
            const slotBg = (itemDetails.slotBackgroundColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[1_4].hex+'33' : 'rgba(200,200,200,0.1)');
            const slotBorder = (itemDetails.slotBorderColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[15].hex : '#FFFFFF');
            const counterTxtColor = (itemDetails.counterColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[11].hex : '#E7E474');
            let overallBg = (itemDetails.overallBackgroundColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[4].hex+'66' : 'rgba(0,0,100,0.3)');
            let overallBorder = (itemDetails.overallBorderColor as MSX1ColorValue) || (isMSX1Screen ? MSX1_PALETTE[5].hex+'99' : 'rgba(255,255,255,0.3)');
            
            if (isSelected) { overallBg = 'rgba(255, 0, 0, 0.3)'; overallBorder = '#FFFF00'; }

            const totalItemDisplayWidth = itemCols * itemIconSize + Math.max(0, itemCols - 1) * itemSpacing;
            const totalItemDisplayHeight = itemRows * itemIconSize + Math.max(0, itemRows - 1) * itemSpacing;
            const itemPadding = Math.max(1 * finalPreviewScale, 1);
            
            const itemSlots: React.ReactNode[] = [];
            for(let r=0; r<itemRows; r++){
                for(let c=0; c<itemCols; c++){
                    itemSlots.push( <div key={`item-${r}-${c}`} style={{ width: itemIconSize, height: itemIconSize, backgroundColor: slotBg, border: `1px solid ${slotBorder}`, position: 'relative', boxSizing: 'border-box', }}> {showCounter && <span style={{ position: 'absolute', bottom: 0, right: 0, fontSize: Math.max(4, (baseCellDimension / 2) * 0.6 * finalPreviewScale), backgroundColor: 'rgba(0,0,0,0.5)', padding: `0 ${Math.max(0.5, 1*finalPreviewScale)}px`, lineHeight: '1', color: counterTxtColor, }}>x{counterDigits === 1 ? '0' : '00'}</span>} </div> );
                }
            }
            previewElements.push( <div key={`preview-hudel-${el.id}`} title={`${el.name} - ${itemRows}x${itemCols} grid`} style={{ position: 'absolute', left: elBaseX, top: elBaseY, width: totalItemDisplayWidth + 2 * itemPadding, height: totalItemDisplayHeight + 2 * itemPadding, display: 'grid', gridTemplateColumns: `repeat(${itemCols}, ${itemIconSize}px)`, gridTemplateRows: `repeat(${itemRows}, ${itemIconSize}px)`, gap: itemSpacing, backgroundColor: overallBg, border: `1px solid ${overallBorder}`, padding: itemPadding, boxSizing: 'content-box', outline: isSelected ? `1px solid #FFFF00` : undefined, }} > {itemSlots} </div> );
        } else { 
            const placeholderWidth = Math.max(16 * finalPreviewScale, (el.name.length * (baseCellDimension/2) * 0.6 * finalPreviewScale) ); 
            const placeholderHeight = Math.max(8 * finalPreviewScale, (baseCellDimension/2) * finalPreviewScale);
            previewElements.push(
                <div key={`preview-hudel-placeholder-${el.id}`}
                    style={{
                        position: 'absolute', left: elBaseX, top: elBaseY,
                        width: placeholderWidth, height: placeholderHeight,
                        backgroundColor: isSelected ? 'rgba(255,0,0,0.5)' : 'rgba(128,128,128,0.5)',
                        border: isSelected ? `1px solid #FFFF00` : '1px dashed #AAAAAA',
                        boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: `${Math.max(4, (baseCellDimension/2) * 0.7 * finalPreviewScale)}px`, color: '#FFFFFF',
                        overflow: 'hidden', whiteSpace: 'nowrap',
                    }}
                    title={`${el.name} @ (${el.position.x},${el.position.y}) - Type: ${el.type}`}
                >
                   <span style={{textOverflow: 'ellipsis', overflow:'hidden'}}>{el.name.substring(0,10)}</span>
                </div>
            );
        }
    });
    return (
        <div className="relative bg-msx-darkblue/20 border border-dashed border-msx-lightyellow/50 mt-2 overflow-hidden"
            style={{ 
                width: screenMapWidth * scaledTileW, 
                height: screenMapHeight * scaledTileH, 
                maxWidth: PREVIEW_WIDTH_PX, 
                maxHeight: PREVIEW_HEIGHT_PX,
                margin: 'auto'
            }}
            aria-label="HUD Preview"
        >
            {previewElements}
        </div>
    );
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hudEditorModalTitle"
    >
      <div
        className="bg-msx-black border-4 border-msx-lightyellow text-msx-lightyellow w-full max-w-4xl h-[80vh] flex flex-col pixel-font shadow-2xl animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="hudEditorModalTitle" className="text-lg p-2 border-b-2 border-msx-lightyellow text-center select-none">
          HUD Configuration Editor (Screen: {currentScreenMode})
        </h2>

        <div className="flex flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
          {/* Left Panel: Element List and Add Buttons per Tab */}
          <div className="w-1/4 border-r-2 border-msx-lightyellow flex flex-col">
            <div className="flex border-b-2 border-msx-lightyellow select-none">
              {(Object.keys(hudElementTemplates) as HudTab[]).map(tabName => (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName)}
                  className={`flex-1 py-1.5 px-1 text-xs truncate ${activeTab === tabName ? 'bg-msx-lightyellow text-msx-black' : 'hover:bg-msx-darkblue/50'}`}
                >
                  {tabName}
                </button>
              ))}
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-shrink-0 border-b-2 border-msx-lightyellow/50">
              <h3 className="text-sm text-msx-highlight mb-1 select-none">Add New ({activeTab}):</h3>
              {hudElementTemplates[activeTab].map(template => (
                <Button
                  key={template.type}
                  onClick={() => handleAddElement(template.type, template.name, template.defaultText, template.defaultDetails)}
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs justify-start"
                  icon={<PlusCircleIcon className="w-3 h-3"/>}
                  disabled={(template.type === HUDElementType.MiniMap || template.type === HUDElementType.PhaseIndicator || template.name.includes("(Soon)"))} 
                  title={(template.type === HUDElementType.MiniMap || template.type === HUDElementType.PhaseIndicator || template.name.includes("(Soon)")) ? "Feature coming soon" : `Add ${template.name}`}
                >
                  {template.name}
                </Button>
              ))}
            </div>
            <div className="p-2 flex-grow overflow-y-auto">
              <h3 className="text-sm text-msx-highlight mb-1 select-none">Screen HUD Elements:</h3>
              {localHudConfig.elements.length === 0 && <p className="text-xs text-msx-textsecondary italic">No HUD elements added yet.</p>}
              <ul className="space-y-1">
                {localHudConfig.elements.map(el => (
                  <li key={el.id}
                      className={`w-full flex justify-between items-center p-1.5 rounded text-xs 
                                  ${selectedElementId === el.id ? 'bg-msx-lightyellow text-msx-black' : 'bg-msx-darkblue/30 hover:bg-msx-darkblue/60'}`}
                  >
                    <div
                        className="truncate flex-grow cursor-pointer"
                        onClick={() => setSelectedElementId(el.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedElementId(el.id); }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedElementId === el.id}
                    >
                        {el.name} ({el.type})
                    </div>
                     <Button
                        onClick={(e) => { e.stopPropagation(); handleRemoveElement(el.id);}}
                        variant="ghost"
                        size="sm"
                        className={`!p-0.5 !ml-1 !min-w-0 flex-shrink-0 ${selectedElementId === el.id ? 'text-msx-darkred hover:text-red-700' : 'text-red-500 hover:text-red-700'}`}
                        icon={<TrashIcon className="w-3.5 h-3.5" />}
                        aria-label={`Delete ${el.name}`}
                        title={`Delete ${el.name}`}
                    >
                        {null}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Center Panel: Preview */}
          <div className="w-1/2 border-r-2 border-msx-lightyellow flex flex-col items-center justify-center p-2">
            <p className="text-sm text-msx-textsecondary select-none mb-1">HUD Preview (Approx. {PREVIEW_WIDTH_PX}x{PREVIEW_HEIGHT_PX}px Canvas)</p>
            {renderHudPreview()}
            {selectedElement && <p className="text-xs mt-2">Selected: <span className="text-msx-cyan">{selectedElement.name}</span> at ({selectedElement.position.x},{selectedElement.position.y}) MSX Pixels</p>}
             <p className="text-[0.6rem] text-msx-textsecondary mt-1">Note: Previsualización de texto usa fuente MSX1. Colores y posicionamiento son aproximados.</p>
          </div>

          {/* Right Panel: Properties Editor */}
          <div className="w-1/4 p-2 overflow-y-auto">
            <h3 className="text-sm text-msx-highlight mb-2 select-none">Properties:</h3>
            {selectedElement ? (
              <div className="space-y-2 text-xs">
                {commonProperties.map(propKey => renderPropertyField(selectedElement, propKey as string, selectedElement[propKey as keyof HUDElement], ''))}
                
                <div className="pt-2 mt-2 border-t border-msx-lightyellow/30">
                  <p className="text-xs text-msx-highlight mb-1">{selectedElement.type} Specifics:</p>
                  {selectedElement.details && Object.keys(selectedElement.details).length > 0 ? 
                    Object.entries(selectedElement.details).map(([key, value]) => renderPropertyField(selectedElement, key, value, 'details'))
                    : <p className="text-xs text-msx-textsecondary italic">No type-specific properties defined yet for this element.</p>
                  }
                </div>
                <div className="pt-2 mt-2 border-t border-msx-lightyellow/30 text-msx-textsecondary text-[0.65rem]">
                    <p>VRAM Used: (calc...)</p>
                    <p>Sprites/Line: (calc...)</p>
                </div>

              </div>
            ) : (
              <p className="text-xs text-msx-textsecondary italic">Select an element to edit its properties.</p>
            )}
          </div>
        </div>

        <div className="p-2 border-t-2 border-msx-lightyellow flex justify-end">
          <Button onClick={onClose} variant="primary" size="md">Close</Button>
        </div>
      </div>
    </div>
  );
};
