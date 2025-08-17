import React from 'react';

interface WorldGridOverlayProps {
  worldWidth: number;
  worldHeight: number;
  screenWidth: number;
  screenHeight: number;
}

export const WorldGridOverlay: React.FC<WorldGridOverlayProps> = ({
  worldWidth,
  worldHeight,
  screenWidth,
  screenHeight,
}) => {
  const patternId = "grid-pattern";

  return (
    <svg
      width={worldWidth}
      height={worldHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: worldWidth,
        height: worldHeight,
        pointerEvents: 'none', // Make sure it doesn't interfere with mouse events
      }}
    >
      <defs>
        <pattern
          id={patternId}
          width={screenWidth}
          height={screenHeight}
          patternUnits="userSpaceOnUse"
        >
          <rect
            width={screenWidth}
            height={screenHeight}
            fill="none"
            stroke="rgba(128, 128, 128, 0.5)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </pattern>
      </defs>

      <rect width={worldWidth} height={worldHeight} fill={`url(#${patternId})`} />
    </svg>
  );
};
