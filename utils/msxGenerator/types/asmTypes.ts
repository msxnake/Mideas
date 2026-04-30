/**
 * @fileoverview Shared types for MSX ASM Generator
 */

import { ProjectAsset, ComponentDefinition, EntityTemplate, Sprite, Tile, ScreenMap, EntityInstance, GameFlowGraph, TrackerSongData, TileBank, PresentationScreenConfig, Boss } from '../../../types';
import { MideasGlobalVariable } from '../../../constants';

/**
 * Project Summary interfaces (extracted from summary system)
 */
export interface ProjectSummary {
  schema: string;
  projectInfo: {
    name: string;
    extractedFrom: string;
    extractionDate: string;
    mideasVersion: string;
    summaryVersion: string;
  };
  execution: {
    mainGameFlow: {
      id: string;
      name: string;
      startNodeId: string;
      nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        worldAssetId?: string;
      }>;
      connections: Array<{
        id: string;
        fromNodeId: string;
        toNodeId: string;
      }>;
    };
    startBehavior: string;
    initialState: string;
    hasMenus: boolean;
  };
  assets: {
    worldMaps: Array<{
      id: string;
      name: string;
      startScreenId: string;
      screens: any[];
      connections: any[];
    }>;
    screens: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      layers: any;
      tileBank: any;
      entityInstances: any[];
    }>;
    tiles: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      data: any;
    }>;
    sprites: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      frames: any[];
    }>;
    entities: Array<{
      id: string;
      name: string;
      components: any;
    }>;
    menus: Array<{
      id: string;
      name: string;
      options: any[];
    }>;
    fonts: Array<{
      id: string;
      name: string;
      characters: any[];
    }>;
    tracks?: TrackerSongData[];
    bosses?: Boss[];
  };
}

/**
 * Generated ASM Files structure
 */
export interface GeneratedASMFiles {
  'page0.asm': string;
  'bios.asm': string;
  'constants.asm': string;
  'variables.asm': string;
  'mapper.asm': string;
  'resource_ids.asm': string;
  'resource_table.asm': string;
  'resource_manager.asm': string;
  'interrupt.asm': string;
  'header.asm': string;
  'patterns.asm': string;
  'colors.asm': string;
  'sprites.asm': string;
  'worlds.asm': string;
  'screens.asm': string;
  'components.asm': string;
  'entities.asm': string;
  'sound.asm': string;
  'scroll.asm': string;
  'animtiles.asm': string;
  'bosses.asm': string;
  'gameflow.asm': string;
  'menus.asm': string;
  'statemachine.asm': string;
  'font.asm': string;
  'hud.asm': string;
  'main.asm': string;
  'unitedFiles.asm': string;
}

/**
 * Project Analysis (from asmTemplateGenerator)
 */
export interface ProjectAnalysis {
  hasSprites: boolean;
  hasTiles: boolean;
  hasScreens: boolean;
  hasEntities: boolean;
  hasComponents: boolean;
  hasGameFlow: boolean;
  hasMenus: boolean;
  hasFonts: boolean;
  components: ComponentDefinition[];
  entities: EntityTemplate[];
  sprites: Sprite[];
  tiles: Tile[];
  tileBanks: TileBank[];
  screens: ScreenMap[];
  gameFlow?: GameFlowGraph;
  projectName: string;
  globalVariables: MideasGlobalVariable[];  // Global variables (defaults + custom)
  screenMaps?: ScreenMap[];  // Alias for screens (compatibility)
  tracks?: TrackerSongData[];
  trackIndexByAssetId?: Record<string, number>;
  presentationScreen?: PresentationScreenConfig;
  bosses?: Boss[];
}
