import React from 'react';

interface PngIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /** The source of the PNG image (imported file). */
    src: string;
    /** Alt text for accessibility. */
    alt: string;
    /** Optional CSS classes. */
    className?: string;
    /** Optional size (width/height) in pixels. Defaults to 20px to match SVG icons (w-5 h-5). */
    size?: number;
}

/**
 * A wrapper component for using PNG icons in a way that feels similar to SVG icons.
 * 
 * Usage:
 * import myIcon from '../../assets/icons/my-icon.png';
 * <PngIcon src={myIcon} alt="My Icon" />
 */
export const PngIcon: React.FC<PngIconProps> = ({ src, alt, className = '', size = 20, style, ...props }) => {
    return (
        <img
            src={src}
            alt={alt}
            className={`inline-block object-contain ${className}`}
            style={{
                width: size,
                height: size,
                ...style,
            }}
            {...props}
        />
    );
};
