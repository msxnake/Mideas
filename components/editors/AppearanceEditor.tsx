import React, { useState } from 'react';
import { MainMenu, GameScreen, Asset, Sprite, Font, GameData, MainMenuAppearance } from '../../../types';
import Panel from '../common/Panel';
import { Button } from '../common/Button';
import ColorPicker from '../theme_config/ColorPicker';
import AssetPickerModal from '../modals/AssetPickerModal';

interface AppearanceEditorProps {
  appearance: MainMenuAppearance;
  onAppearanceChange: (newAppearance: MainMenuAppearance) => void;
  gameData: GameData;
  setScreenToEdit: (screen: GameScreen) => void;
}

const AppearanceEditor: React.FC<AppearanceEditorProps> = ({
  appearance,
  onAppearanceChange,
  gameData,
  setScreenToEdit
}) => {

  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [assetTypeToPick, setAssetTypeToPick] = useState<'screen' | 'sprite' | null>(null);

  const handleSelectAsset = (asset: Asset) => {
    let newAppearance = { ...appearance };
    if (assetTypeToPick === 'screen') {
      newAppearance.backgroundScreen = asset as GameScreen;
    } else if (assetTypeToPick === 'sprite') {
      newAppearance.cursorSprite = asset as Sprite;
    }
    onAppearanceChange(newAppearance);
    setIsAssetPickerOpen(false);
    setAssetTypeToPick(null);
  };

  const handleColorChange = (color: string, property: keyof MainMenuAppearance['colors']) => {
    const newAppearance = {
      ...appearance,
      colors: {
        ...appearance.colors,
        [property]: color
      }
    };
    onAppearanceChange(newAppearance);
  };

  const openAssetPicker = (type: 'screen' | 'sprite') => {
    setAssetTypeToPick(type);
    setIsAssetPickerOpen(true);
  };

  const handleEditScreen = (screen: GameScreen) => {
    setScreenToEdit(screen);
  };

  return (
    <div className="p-4">
      <Panel title="Visuals">
        <div className="flex items-center space-x-4">
          <Button onClick={() => openAssetPicker('screen')}>
            Select Background Screen
          </Button>
          {appearance.backgroundScreen && (
            <div className="flex items-center space-x-2">
              <span>{appearance.backgroundScreen.id}</span>
              <Button onClick={() => handleEditScreen(appearance.backgroundScreen as GameScreen)} size="sm">
                Edit
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4 mt-4">
          <Button onClick={() => openAssetPicker('sprite')}>
            Select Cursor Sprite
          </Button>
          {appearance.cursorSprite && (
            <span>{appearance.cursorSprite.name}</span>
          )}
        </div>
      </Panel>

      <Panel title="Colors" className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <label>Text</label>
            <ColorPicker
              color={appearance.colors.text}
              onChange={(color) => handleColorChange(color, 'text')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label>Background</label>
            <ColorPicker
              color={appearance.colors.background}
              onChange={(color) => handleColorChange(color, 'background')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label>Highlight Text</label>
            <ColorPicker
              color={appearance.colors.highlightText}
              onChange={(color) => handleColorChange(color, 'highlightText')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label>Highlight BG</label>
            <ColorPicker
              color={appearance.colors.highlightBG}
              onChange={(color) => handleColorChange(color, 'highlightBG')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label>Border</label>
            <ColorPicker
              color={appearance.colors.border}
              onChange={(color) => handleColorChange(color, 'border')}
            />
          </div>
        </div>
      </Panel>

      {isAssetPickerOpen && assetTypeToPick && (
        <AssetPickerModal
          isOpen={isAssetPickerOpen}
          onClose={() => setIsAssetPickerOpen(false)}
          onSelectAsset={handleSelectAsset}
          assetType={assetTypeToPick}
          gameData={gameData}
        />
      )}
    </div>
  );
};

export default AppearanceEditor;
