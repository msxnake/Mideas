import React from 'react';

/**
 * Props for the icon components.
 */
interface IconProps {
    /** Optional CSS classes to apply to the icon. */
    className?: string;
}

/**
 * Cartridge icon (ROM).
 */
export const CartridgeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h15v15a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5V2.25h6V4.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9h9" />
    </svg>
);

/**
 * Cassette icon (Tape).
 */
export const CassetteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <rect x="3" y="6" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="12" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="12" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 18h14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14" />
    </svg>
);

/**
 * Joystick icon.
 */
export const JoystickIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10" />
        <circle cx="12" cy="3" r="1.5" fill="currentColor" />
        <rect x="5" y="13" width="14" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="17" r="1" fill="currentColor" />
        <circle cx="16" cy="17" r="1" fill="currentColor" />
    </svg>
);

/**
 * Chip icon (Z80/VDP).
 */
export const ChipIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <rect x="5" y="5" width="14" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 15h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 9H3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12H3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H3" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
);

/**
 * Keyboard icon.
 */
export const KeyboardIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <rect x="2" y="6" width="20" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 9h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 13h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 13h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16h10" />
    </svg>
);

/**
 * Palette icon.
 */
export const PaletteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
);

/**
 * Layer icon.
 */
export const LayerIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L12 7.5l4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
    </svg>
);

/**
 * Ghost icon (Sprite).
 */
export const GhostIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-1h2v1c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
    </svg>
);
