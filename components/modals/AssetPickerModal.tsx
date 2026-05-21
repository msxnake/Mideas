
import React, { useState, useMemo } from 'react';
import { ProjectAsset, Sprite, EntityTemplate } from '../../types';
import { Button } from '../common/Button';
import { createSpriteDataURL } from '../utils/screenUtils';
import { SoundIcon, PuzzlePieceIcon, SpriteIcon as EntityIcon } from '../icons/MsxIcons';

export type AssetPickerType = ProjectAsset['type'] | 'screenBackground';

/**
 * A component that renders a small preview of a sprite's first frame.
 */
const SpritePreview: React.FC<{ sprite: Sprite }> = ({ sprite }) => {
    const dataUrl = useMemo(() => {
        if (!sprite || !sprite.frames[0]) return '';
        return createSpriteDataURL(sprite.frames[0].data, sprite.size.width, sprite.size.height);
    }, [sprite]);

    if (!dataUrl) return <div className="w-8 h-8 bg-msx-panelbg border border-dashed border-msx-border flex-shrink-0"></div>;
    return <img src={dataUrl} alt={sprite.name} className="w-8 h-8 object-contain border border-msx-border bg-msx-panelbg flex-shrink-0" style={{ imageRendering: 'pixelated' }} />;
};

/**
 * A component that displays an appropriate icon for a given asset type.
 */
const AssetTypeIcon: React.FC<{ type: ProjectAsset['type'] }> = ({ type }) => {
    const iconClass = "w-4 h-4 text-msx-textsecondary";
    switch (type) {
        case 'sprite': return <EntityIcon className={iconClass} />;
        case 'sound': return <SoundIcon className={iconClass} />;
        case 'behavior': return <PuzzlePieceIcon className={iconClass} />;
        case 'dialogue': return <PuzzlePieceIcon className={iconClass} />;
        case 'entitytemplate': return <EntityIcon className={iconClass} />;
        default: return <div className="w-4 h-4" />;
    }
};

const TEMPLATE_SPRITE_PROP_KEYS = ['spriteAssetId', 'renderSpriteAssetId', 'render', 'sprite'];

const getSpriteForTemplate = (template: EntityTemplate, allAssets: ProjectAsset[]): Sprite | undefined => {
    for (const component of template.components) {
        const defaults = component.defaultValues || {};
        for (const key of TEMPLATE_SPRITE_PROP_KEYS) {
            const reference = defaults[key];
            if (typeof reference !== 'string') continue;
            const match = allAssets.find(asset =>
                asset.type === 'sprite' && (asset.id === reference || asset.name === reference)
            );
            if (match?.data) {
                return match.data as Sprite;
            }
        }
    }
    return undefined;
};

const EntityTemplatePreview: React.FC<{ template: EntityTemplate; allAssets: ProjectAsset[] }> = ({ template, allAssets }) => {
    const sprite = useMemo(() => getSpriteForTemplate(template, allAssets), [template, allAssets]);
    if (!sprite || !sprite.frames?.length) {
        return <div className="w-8 h-8 flex items-center justify-center bg-msx-panelbg border border-dashed border-msx-border flex-shrink-0">
            <EntityIcon className="w-4 h-4 text-msx-textsecondary" />
        </div>;
    }
    return <SpritePreview sprite={sprite} />;
};

/**
 * Props for the AssetPickerModal component.
 */
interface AssetPickerModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** Callback function when an asset is selected. */
    onSelectAsset: (assetId: string) => void;
    /** The type of asset to display in the picker. */
    assetTypeToPick: AssetPickerType;
    /** A list of all project assets to choose from. */
    allAssets: ProjectAsset[];
    /** The ID of the currently selected asset, for highlighting. */
    currentSelectedId: string | null;
}

/**
 * A modal dialog for selecting a project asset of a specific type.
 * It includes a search filter and displays previews for certain asset types.
 */
export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({
    isOpen,
    onClose,
    onSelectAsset,
    assetTypeToPick,
    allAssets,
    currentSelectedId,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAssets = useMemo(() => {
        const acceptedTypes: ProjectAsset['type'][] = assetTypeToPick === 'screenBackground'
            ? ['screenmap', 'msx2screen']
            : [assetTypeToPick];
        return allAssets
            .filter(asset => acceptedTypes.includes(asset.type))
            .filter(asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allAssets, assetTypeToPick, searchTerm]);

    if (!isOpen) return null;

    const handleSelect = (assetId: string) => {
        onSelectAsset(assetId);
        onClose();
    };
    
    const assetTypeName = assetTypeToPick === 'screenBackground'
        ? 'Screen Background'
        : assetTypeToPick.charAt(0).toUpperCase() + assetTypeToPick.slice(1);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assetPickerModalTitle"
        >
            <div
                className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh] animate-slideIn"
                onClick={e => e.stopPropagation()}
            >
                <h2 id="assetPickerModalTitle" className="text-lg text-msx-highlight mb-4 pixel-font">Select {assetTypeName} Asset</h2>
                <input
                    type="text"
                    placeholder={`Search ${assetTypeName}s...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 mb-3 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent text-sm"
                    autoFocus
                />
                <div className="flex-grow overflow-y-auto pr-1">
                    <ul className="space-y-1">
                        {filteredAssets.map(asset => (
                            <li key={asset.id}>
                                <button
                                    onClick={() => handleSelect(asset.id)}
                                    className={`w-full flex items-center p-2 rounded text-left text-sm transition-colors
                                        ${currentSelectedId === asset.id 
                                            ? 'bg-msx-accent text-white' 
                                            : 'bg-msx-bgcolor hover:bg-msx-border text-msx-textprimary'}`
                                    }
                                >
                                    {asset.type === 'sprite' ? (
                                        <div className="w-8 h-8 mr-2 flex-shrink-0">
                                            <SpritePreview sprite={asset.data as Sprite} />
                                        </div>
                                    ) : asset.type === 'entitytemplate' ? (
                                        <div className="w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0">
                                            <EntityTemplatePreview template={asset.data as EntityTemplate} allAssets={allAssets} />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0"><AssetTypeIcon type={asset.type} /></div>
                                    )}
                                    <span className="truncate ml-2">{asset.name}</span>
                                </button>
                            </li>
                        ))}
                        {filteredAssets.length === 0 && (
                            <p className="p-4 text-center text-msx-textsecondary text-sm">No matching assets found.</p>
                        )}
                    </ul>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={() => handleSelect("")} variant="secondary" size="md">Clear Selection</Button>
                    <Button onClick={onClose} variant="ghost" size="md" className="ml-2">Cancel</Button>
                </div>
            </div>
        </div>
    );
};
