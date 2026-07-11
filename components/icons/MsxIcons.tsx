import React from 'react';
import * as Lucide from 'lucide-react';

interface IconProps {
  className?: string;
}

const wrapIcon = (IconComponent: React.ComponentType<any>, defaultClass: string = "w-5 h-5") => {
  const WrappedIcon: React.FC<IconProps> = ({ className }) => (
    <IconComponent className={`${defaultClass} ${className || ''}`} strokeWidth={1.5} />
  );
  return WrappedIcon;
};

export const GridIcon = wrapIcon(Lucide.Grid);
export const SphereIcon = wrapIcon(Lucide.Globe);
export const PlaceholderIcon = wrapIcon(Lucide.FileQuestion);
export const TilesetIcon = wrapIcon(Lucide.LayoutGrid);
export const SpriteIcon = wrapIcon(Lucide.Ghost);
export const MapIcon = wrapIcon(Lucide.Map);
export const WorldMapIcon = wrapIcon(Lucide.MapPin);
export const WorldViewIcon = wrapIcon(Lucide.MonitorSmartphone);
export const GameFlowIcon = wrapIcon(Lucide.MapPin);
export const CodeIcon = wrapIcon(Lucide.Code2);
export const ASMIcon = wrapIcon(Lucide.Code2);
export const SoundIcon = wrapIcon(Lucide.Volume2);
export const MusicNoteIcon = wrapIcon(Lucide.Music);
export const PuzzlePieceIcon = wrapIcon(Lucide.Puzzle);
export const PatternBrushIcon = wrapIcon(Lucide.Brush, "w-4 h-4");
export const PlayIcon = wrapIcon(Lucide.PlayCircle);
export const StopIcon = wrapIcon(Lucide.StopCircle);
export const BugIcon = wrapIcon(Lucide.Bug);
export const LoadIcon = wrapIcon(Lucide.Upload);
export const SaveIcon = wrapIcon(Lucide.Download);
export const SaveFloppyIcon = wrapIcon(Lucide.Save);
export const FolderOpenIcon = wrapIcon(Lucide.FolderOpen);
export const ImageIcon = wrapIcon(Lucide.Image);
export const PlusCircleIcon = wrapIcon(Lucide.PlusCircle);
export const DocumentPlusIcon = wrapIcon(Lucide.FilePlus);
export const CogIcon = wrapIcon(Lucide.Settings);
export const QuestionMarkCircleIcon = wrapIcon(Lucide.HelpCircle);
export const TrashIcon = wrapIcon(Lucide.Trash2);
export const ListBulletIcon = wrapIcon(Lucide.List);
export const CaretDownIcon = wrapIcon(Lucide.ChevronDown, "w-3 h-3");
export const CaretRightIcon = wrapIcon(Lucide.ChevronRight, "w-3 h-3");
export const ArrowUpIcon = wrapIcon(Lucide.ArrowUp);
export const ArrowDownIcon = wrapIcon(Lucide.ArrowDown);
export const ArrowLeftIcon = wrapIcon(Lucide.ArrowLeft);
export const ArrowRightIcon = wrapIcon(Lucide.ArrowRight);
export const RotateCcwIcon = wrapIcon(Lucide.RotateCcw);
export const RotateCwIcon = wrapIcon(Lucide.RotateCw);
export const FlipHorizontalIcon = wrapIcon(Lucide.FlipHorizontal2);
export const FlipVerticalIcon = wrapIcon(Lucide.FlipVertical2);
export const ArrowUturnLeftIcon = wrapIcon(Lucide.Undo2);
export const ArrowUturnRightIcon = wrapIcon(Lucide.Redo2);
export const DocumentDuplicateIcon = wrapIcon(Lucide.Copy);
export const CopyIcon = wrapIcon(Lucide.Copy);
export const CheckCircleIcon = wrapIcon(Lucide.CheckCircle2);
export const XCircleIcon = wrapIcon(Lucide.XCircle);
export const PencilIcon = wrapIcon(Lucide.Pencil);
export const EraserIcon = wrapIcon(Lucide.Eraser);
export const CompressVerticalIcon = wrapIcon(Lucide.Minimize2);
export const CompressHorizontalIcon = wrapIcon(Lucide.Shrink);
export const FireIcon = wrapIcon(Lucide.Flame);
export const ShieldIcon = wrapIcon(Lucide.Shield);
export const LockIcon = wrapIcon(Lucide.Lock);
export const SparklesIcon = wrapIcon(Lucide.Sparkles);
export const HudIcon = wrapIcon(Lucide.AppWindow);
export const ZoomInIcon = wrapIcon(Lucide.ZoomIn);
export const ZoomOutIcon = wrapIcon(Lucide.ZoomOut);
export const ArrowPathIcon = wrapIcon(Lucide.RefreshCw);
export const RefreshCwIcon = wrapIcon(Lucide.RefreshCw);
export const ClockIcon = wrapIcon(Lucide.Clock);
export const ClipboardDocumentListIcon = wrapIcon(Lucide.ClipboardList);
export const PasteIcon = wrapIcon(Lucide.ClipboardList);
export const ViewfinderCircleIcon = wrapIcon(Lucide.Focus);
export const ContourIcon = wrapIcon(Lucide.BoxSelect);
export const StopCircleIcon = wrapIcon(Lucide.Ban);
export const PaintBrushIcon = wrapIcon(Lucide.PaintBucket);
export const ArrowsPointingOutIcon = wrapIcon(Lucide.Maximize2);
export const SwapHorizIcon = wrapIcon(Lucide.ArrowRightLeft);
export const SwapVertIcon = wrapIcon(Lucide.ArrowUpDown);
export const ExpandAllIcon = wrapIcon(Lucide.Maximize);
export const CollapseAllIcon = wrapIcon(Lucide.Minimize);
export const EyeIcon = wrapIcon(Lucide.Eye, "w-4 h-4");
export const EyeOffIcon = wrapIcon(Lucide.EyeOff, "w-4 h-4");
export const CompilerIcon = wrapIcon(Lucide.Cpu);
export const ScissorsIcon = wrapIcon(Lucide.Scissors);
export const WaveformIcon = wrapIcon(Lucide.Activity);
