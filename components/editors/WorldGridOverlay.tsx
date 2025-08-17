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
            stroke="rgba(0, 0, 0, 0.7)"
            strokeWidth="2"
            strokeDasharray="2,3"
          />
          <rect
            width={screenWidth}
            height={screenHeight}
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="1"
            strokeDasharray="2,3"
          />
        </pattern>
      </defs>

      <rect width={worldWidth} height={worldHeight} fill={`url(#${patternId})`} />
    </svg>
  );
};
