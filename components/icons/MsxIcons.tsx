

import React from 'react';

interface IconProps {
  className?: string;
}

export const GridIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
    <line x1="3" x2="21" y1="9" y2="9"></line>
    <line x1="3" x2="21" y1="15" y2="15"></line>
    <line x1="9" x2="9" y1="3" y2="21"></line>
    <line x1="15" x2="15" y1="3" y2="21"></line>
  </svg>
);

export const SphereIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
  </svg>
);

export const PlaceholderIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.599.484-1.087 1.087-1.087h.001c.599 0 1.087.488 1.087 1.087v11.826c0 .599-.484 1.087-1.087 1.087h-.001c-.599 0-1.087-.488-1.087-1.087V6.087ZM6.087 17.913c-.599 0-1.087-.488-1.087-1.087V6.087c0-.599.484-1.087 1.087-1.087h.001c.599 0 1.087.488 1.087 1.087v10.739c0 .599-.484 1.087-1.087 1.087h-.001Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 4.509a2.552 2.552 0 0 0-2.386-2.038 2.543 2.543 0 0 0-2.66 2.303A2.552 2.552 0 0 0 2.66 6.811a2.543 2.543 0 0 0 2.043 2.657c.16.02.323.031.487.031h4.62c.164 0 .328-.01.487-.03a2.544 2.544 0 0 0 2.043-2.658 2.552 2.552 0 0 0-2.043-2.302 2.543 2.543 0 0 0-2.66-2.303Z" />
  </svg>
);

export const TilesetIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

export const SpriteIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const MapIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-6.998 4.277-1.948a.75.75 0 0 1 1.004.735v11.012a.75.75 0 0 1-1.004.735L15.503 17.002M3 17.25V8.25m0 0L7.277 6.302a.75.75 0 0 1 1.004.735v11.012a.75.75 0 0 1-1.004.735L3 17.25Zm0 0h18" />
  </svg>
);

export const WorldMapIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25M12 12l1.5 1.5M12 12l-1.5 1.5M12 12l1.5-1.5M12 12l-1.5-1.5M7.5 12h9M12 7.5v9" />
    <circle cx="12" cy="12" r="2.25" strokeWidth="1.5" />
  </svg>
);

export const WorldViewIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5M3.75 15h16.5M9.75 3.75c.496-1.5.75-3.75 0-3.75M14.25 3.75c-.496-1.5-.75-3.75 0-3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75a13.407 13.407 0 0 1 6 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25a13.407 13.407 0 0 0 6 0" />
  </svg>
);


export const CodeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>
);
export const ASMIcon = CodeIcon; // Alias for ASM-specific contexts

export const SoundIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

export const MusicNoteIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.07 1.918l-7.5 4.25a2.25 2.25 0 01-2.36 0L3.07 19.418A2.25 2.25 0 012.25 17.5v-2.131m17.25-6.553l-3.75-2.25M9 9V3.75M9 15V9m0 0l10.5 3M9 9l-10.5-3m0 0l3.75 2.25" />
  </svg>
);

export const PuzzlePieceIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 0 1 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756c-.399-.05-.803-.091-1.22-.122a4.5 4.5 0 0 0-4.06 0C8.53 7.665 8.126 7.706 7.725 7.756m6.525 8.488c.399.05.803.091 1.22.122a4.5 4.5 0 0 0 4.06 0c.424-.03.828-.072 1.225-.122m-11.96-4.244a4.5 4.5 0 0 0-4.06 0c-.424.03-.828.071-1.225.121" />
  </svg>
);

export const PatternBrushIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={`w-4 h-4 ${className}`}>
    <path d="M0 0h4v4H0V0zm4 4h4v4H4V4zm4 0h4v4H8V4zm4 4h4v4h-4V8zM8 8h4v4H8V8zM4 12h4v4H4v-4zm4 0h4v4H8v-4z" fill="currentColor"/>
    <path d="M4 0h4v4H4V0zm8 0h4v4h-4V0zM0 4h4v4H0V4zm0 8h4v4H0v-4zm8 4h4v4h-4v-4zm4-8h4v4h-4V4z" fill="currentColor" fillOpacity=".5"/>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
  </svg>
);

export const BugIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
     <path strokeLinecap="round" strokeLinejoin="round" d="m15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.608a8.287 8.287 0 0 0 3 2.472A8.305 8.305 0 0 0 15 9.608 M15.362 5.214A8.252 8.252 0 0 0 12 3a8.25 8.25 0 0 0-3.362 2.214m0 0L9.638 7.047M12 12.75a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75h0a.75.75 0 0 0-.75.75v.001c0 .02.002.039.005.058a.751.751 0 0 0 .295.493l.001.001.001.001A.75.75 0 0 0 12 12.75Zm3-6.32a.75.75 0 0 0-.65.363l-1.44 2.472a.75.75 0 0 0 .65 1.137h2.88a.75.75 0 0 0 .65-1.137l-1.44-2.472a.75.75 0 0 0-.65-.363Zm-6 0a.75.75 0 0 0-.65.363l-1.44 2.472a.75.75 0 0 0 .65 1.137h2.88a.75.75 0 0 0 .65-1.137l-1.44-2.472a.75.75 0 0 0-.65-.363Z" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const SaveFloppyIcon: React.FC<IconProps> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3h-5.25A2.25 2.25 0 0 0 5.25 5.25v10.5M15 3H9m0 0v3.75M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V6.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9H9V5.25h6V9Z" />
 </svg>
);

export const FolderOpenIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 6 7.5h12A2.25 2.25 0 0 1 20.25 9.75M3.75 9.75v7.5A2.25 2.25 0 0 0 6 19.5h12a2.25 2.25 0 0 0 2.25-2.25v-7.5m-16.5 0v-2.25A2.25 2.25 0 0 1 6 5.25h4.5c.761 0 1.444.308 1.95.808L13.5 7.5H18a2.25 2.25 0 0 1 2.25 2.25v.75" />
  </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
);

export const DocumentPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);


export const CogIcon: React.FC<IconProps> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.11-1.226.55-.223 1.159-.223 1.71 0 .55.223 1.02.684 1.11 1.226M9.594 9.387c.09.542.56 1.003 1.11 1.226.55.223 1.159-.223 1.71 0 .55-.223 1.02-.684 1.11-1.226m-2.16 0A2.25 2.25 0 0 1 12 7.137V6.387c0-.221-.179-.401-.401-.401S11.199 6.166 11.199 6.387v.75c0 .94-.692 1.732-1.606 1.936M14.406 9.387c-.09.542-.56 1.003-1.11 1.226-.55.223-1.159.223-1.71 0-.55.223-1.02.684-1.11-1.226m2.16 0A2.25 2.25 0 0 0 12 7.137V6.387c0-.221.179-.401.401-.401S12.801 6.166 12.801 6.387v.75c0 .94.692 1.732 1.606 1.936M12 12.75a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008ZM12 12.75a.75.75 0 0 0-.75-.75H11.25a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75v-.008ZM12 12.75a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008c0-.414.336.75.75.75h.008a.75.75 0 0 1 .75.75v.008ZM12 12.75a.75.75 0 0 0 .75.75h.008a.75.75 0 0 0 .75-.75v-.008a.75.75 0 0 0-.75-.75h-.008a.75.75 0 0 0-.75.75v.008ZM14.25 15a2.25 2.25 0 0 0-2.25-2.25V12c0-.414-.336-.75-.75-.75s-.75.336-.75.75v.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h4.5c.414 0 .75-.336.75-.75Zm0 0h.001M9.75 15a2.25 2.25 0 0 1 2.25-2.25V12c0-.414.336-.75.75-.75s.75.336.75.75v.75a2.25 2.25 0 0 1 2.25 2.25c0 .414-.336-.75-.75.75h-4.5c-.414 0-.75-.336-.75-.75Zm0 0H9.75M12 3.75a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75V3.75Zm0 0V3M12 20.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm0 0v-.001M3.75 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75V11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75V12Zm0 0h-.001M20.25 12a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75V11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75V12Zm0 0h-.001m-7.425 4.268c.09.542.56 1.003 1.11 1.226.55.223 1.159.223 1.71 0 .55-.223 1.02-.684 1.11-1.226m-2.16 0A2.25 2.25 0 0 1 12 14.387v-.75c0-.221-.179-.401-.401-.401S11.199 13.416 11.199 13.637v.75c0 .94-.692 1.732-1.606 1.936M14.406 16.268c-.09.542-.56 1.003-1.11 1.226-.55.223-1.159.223-1.71 0-.55.223-1.02.684-1.11-1.226m2.16 0A2.25 2.25 0 0 0 12 14.387v-.75c0-.221.179-.401.401-.401S12.801 13.416 12.801 13.637v.75c0 .94.692 1.732 1.606 1.936" />
</svg>
);

export const QuestionMarkCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.086 3.305.247m-3.305-.247a48.63 48.63 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export const ListBulletIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
  </svg>
);

export const CaretDownIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const CaretRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75 6.75M19.5 12l-6.75-6.75" />
  </svg>
);

export const RotateCcwIcon: React.FC<IconProps> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6-6m0 0l6-6m-6 6h12a6 6 0 010 12h-3" />
  </svg>
);

export const ArrowUturnLeftIcon: React.FC<IconProps> = ({ className }) => ( // For Undo
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

export const ArrowUturnRightIcon: React.FC<IconProps> = ({ className }) => ( // For Redo
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
  </svg>
);


export const DocumentDuplicateIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376H3.375M15.75 17.25H18v2.25h-2.25v-2.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 3v14.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V7.875c0-.621-.504-1.125-1.125-1.125H13.5A2.25 2.25 0 0 0 11.25 4.5Z" />
  </svg>
);
export const CopyIcon = DocumentDuplicateIcon; // Alias for Copy contexts


export const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const XCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const PencilIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export const EraserIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12.75H4.5m15 0a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25H19.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.36 8.132A4.495 4.495 0 0 0 15.75 7.5h-7.5a4.495 4.495 0 0 0-1.61.632M17.36 8.132l-2.915-2.915a1.122 1.122 0 0 0-1.587 0L11.25 6.828m6.11 1.304 1.612 1.612m-7.722-2.916-1.612-1.612" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 5.25H11.25L5.25 11.25V12.75h13.5V11.25L12.75 5.25Z" />
  </svg>
);

export const CompressVerticalIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M8 18h8" /> 
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10V7.5m0 0L10 9m2-1.5L14 9" /> 
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v2.5m0 0L10 15m2 1.5L14 15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" strokeDasharray="2 2" opacity="0.5"/>
  </svg>
);

export const CompressHorizontalIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8v8M18 8v8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 12H7.5m0 0L9 10m-1.5 2L9 14" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 12h2.5m0 0L15 10m1.5 2L15 14" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16" strokeDasharray="2 2" opacity="0.5"/>
  </svg>
);

export const FireIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.608a8.287 8.287 0 0 0 3 2.472A8.305 8.305 0 0 0 15 9.608V9.608c0-2.384-1.435-4.468-3.528-5.214C9.785 3.611 7.863 3 6 3c-1.862 0-3.828.318-5.097 1.009A7.483 7.483 0 0 1 6 15.75c0 1.32.333 2.573.923 3.691" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.947 0 5.614.82 7.786 2.214M18 6c-.934 2.253-3.396 3.75-6 3.75S6.934 8.253 6 6" />
  </svg>
);
export const SparklesIcon = FireIcon; // Alias for ZigZag fill, using Fire as placeholder

export const HudIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className={`w-5 h-5 ${className}`}>
    <rect x="1.5" y="1.5" width="13" height="11" stroke="currentColor" strokeWidth="1"/>
    <rect x="3" y="3" width="4" height="2" fill="currentColor" opacity="0.7"/>
    <rect x="3" y="10" width="10" height="1.5" fill="currentColor" opacity="0.7"/>
    <path d="M 10 4 L 13 4 L 13 5 L 10 5 Z" fill="currentColor" opacity="0.7" />
    <path d="M 10 6 L 13 6 L 13 7 L 10 7 Z" fill="currentColor" opacity="0.7" />
  </svg>
);

export const ZoomInIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
  </svg>
);

export const ZoomOutIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 10.5h6" />
  </svg>
);

export const ArrowPathIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ className }) => ( // Added RefreshCwIcon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a.75.75 0 00-.529-.632l-1.956-.489a.75.75 0 01.358-1.464l2.336.585a2.25 2.25 0 011.586 1.94V12a9 9 0 11-9-9h2.252a.75.75 0 000-1.5H9a.75.75 0 00-.75.75v3.036c0 .414.336.75.75.75h1.5a.75.75 0 000-1.5H9.375a7.5 7.5 0 017.363-6.79" />
  </svg>
);

export const ClipboardDocumentListIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);
export const PasteIcon = ClipboardDocumentListIcon; // Alias for Paste contexts

// Icons for Screen Editor Selection tools
export const ViewfinderCircleIcon: React.FC<IconProps> = ({ className }) => ( // For "Select Area" tool
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const ContourIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M9.75 9.75h4.5v4.5h-4.5z" />
  </svg>
);


export const StopCircleIcon: React.FC<IconProps> = ({ className }) => ( // For "Unselect Area"
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.254 9.254 9 9.563 9h4.874c.309 0 .563.254.563.563v4.874c0 .309-.254.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
  </svg>
);

export const PaintBrushIcon: React.FC<IconProps> = ({ className }) => ( // For "Fill Selection"
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);

export const ArrowsPointingOutIcon: React.FC<IconProps> = ({ className }) => ( // For "Clone Grid" (previously Copy)
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

export const SwapHorizIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-3-10.5L21 12m0 0L16.5 7.5M21 12H3" />
  </svg>
);

export const SwapVertIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 7.5 4.5 4.5M7.5 12l4.5-4.5M3 7.5h18m-4.5 9L21 12m0 0-4.5 4.5M16.5 12h-18" />
  </svg>
);
