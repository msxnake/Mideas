
export const deepCopy = <T,>(data: T): T => {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error("Deep copy failed:", e, "Data:", data);
    return data; 
  }
};

export const getFormattedDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateAsmFileHeader = (projectName: string, formattedDate: string, filename: string): string => {
  const effectiveProjectName = projectName || "Untitled Project";
  const header = `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; ${effectiveProjectName}
;; ${formattedDate}
;; ${filename}
;; version 0.1
;; MSX Retro Game IDE 1.0
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

`; 
  const bodyComment = `;; ${filename} - Content for ${effectiveProjectName}\n\n`;
  return header + bodyComment;
};

export const generateMainAsmContent = (projectName: string, formattedDate: string): string => {
  const header = `;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; ${projectName}
;; ${formattedDate}
;; main.asm
;; version 0.1
;; MSX Retro Game IDE 1.0

`; 
  const body = `
;; --- Game Structure Includes ---
;; Uncomment and use these files as needed for your project.
;; INCLUDE "data/graphics.asm"  ; Visual assets like sprites, tiles
;; INCLUDE "data/components.asm"; ECS Component Masks and System Masks
;; INCLUDE "data/entities.asm"  ; Initial entity data for levels
;; INCLUDE "data/world.asm"     ; World/level map data (tilemaps)
;; INCLUDE "data/fonts.asm"     ; Custom font data
;; INCLUDE "data/music.asm"     ; Music tracks and sound effects data
;; INCLUDE "data/hud.asm"       ; Heads-Up Display elements and logic
;; INCLUDE "data/effect_zones.asm" ; Effect Zone data

;; INCLUDE "code/behaviors.asm" ; Entity behavior scripts (systems)
;; INCLUDE "code/game_logic.asm"; Core game logic, state management
;; INCLUDE "code/menu.asm"      ; Game menus, title screen logic
;; INCLUDE "code/items.asm"     ; Item definitions and logic


`;
    return header + body;
};
