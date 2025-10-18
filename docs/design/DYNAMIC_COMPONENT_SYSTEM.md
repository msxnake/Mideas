# Dynamic Component System - Diseño Técnico

## 🎯 Objetivo
Permitir crear y modificar componentes de juego en tiempo real dentro de Mideas, con integración completa de variables globales y hot-reload.

## 📋 Características Principales

### 1. Component Builder UI
- Editor visual para crear componentes custom
- Selector de propiedades con tipos (byte, word, boolean, string, position, sprite, etc.)
- Integración con Global Variables (read/write desde componentes)
- Preview en tiempo real del componente
- Hot-reload automático al guardar cambios

### 2. Component Property System
```typescript
interface DynamicComponentProperty {
  name: string;
  type: 'byte' | 'word' | 'boolean' | 'position' | 'sprite' | 'globalVar';
  defaultValue: any;
  globalVarLink?: {
    assetId: string;      // ID del GlobalVariables asset
    variableName: string; // Nombre de la variable global
    syncMode: 'read' | 'write' | 'readwrite';
  };
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
}
```

### 3. Component Behavior System

#### Opción A: Visual Scripting (Recomendado)
```typescript
interface ComponentBehaviorNode {
  id: string;
  type: 'condition' | 'action' | 'event' | 'globalVarOp';
  config: {
    // Para conditions
    operator?: 'gt' | 'lt' | 'eq' | 'neq';
    compareValue?: number | string;
    compareProperty?: string;

    // Para globalVarOp
    globalVarAssetId?: string;
    globalVarName?: string;
    operation?: 'read' | 'write' | 'increment' | 'decrement';

    // Para actions
    action?: 'move' | 'animate' | 'spawn' | 'destroy' | 'sound';
    params?: Record<string, any>;
  };
  connections: {
    onTrue?: string;  // Next node ID if condition is true
    onFalse?: string; // Next node ID if condition is false
    next?: string;    // Next node ID for sequential actions
  };
}

interface DynamicComponentBehavior {
  name: string;
  trigger: 'onUpdate' | 'onCollision' | 'onSpawn' | 'onDestroy' | 'onInput';
  nodes: ComponentBehaviorNode[];
  entryNodeId: string;
}
```

#### Opción B: Script ASM Embebido
```typescript
interface ComponentASMScript {
  name: string;
  trigger: 'onUpdate' | 'onCollision' | 'onSpawn' | 'onDestroy';
  asmCode: string;
  globalVarAccess: {
    reads: string[];   // Variables globales que lee
    writes: string[];  // Variables globales que escribe
  };
}
```

### 4. Tipo de Datos: DynamicComponent

```typescript
interface DynamicComponent {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji o nombre de icono
  category: 'gameplay' | 'visual' | 'audio' | 'ai' | 'custom';

  // Propiedades del componente
  properties: DynamicComponentProperty[];

  // Comportamiento (elegir uno)
  behaviors?: ComponentBehaviorNode[];  // Visual scripting
  asmScripts?: ComponentASMScript[];    // ASM directo

  // Metadata
  createdAt: number;
  modifiedAt: number;
  author?: string;
  version: string;

  // Hot-reload
  isEnabled: boolean;
  isDirty: boolean; // Cambios sin guardar
}
```

## 🏗️ Estructura de Archivos

### Nuevo Asset Type
```typescript
// types.ts
export type ProjectAssetType =
  | 'tile'
  | 'sprite'
  | 'screen'
  | 'code'
  | 'pt3'
  | 'font'
  | 'globalVariables'
  | 'componentDefinition'  // Existente
  | 'dynamicComponent';     // NUEVO

export interface DynamicComponentAsset extends ProjectAsset {
  type: 'dynamicComponent';
  data: DynamicComponent;
}
```

## 🎨 UI Components

### 1. DynamicComponentEditor.tsx
```
┌─────────────────────────────────────────────────────────┐
│ Dynamic Component Editor                         [Save] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Component Name: [Health System_________________]       │
│  Category: [Gameplay ▼]                                 │
│  Icon: 💚                                                │
│                                                          │
│  ┌─ Properties ────────────────────────────────────┐   │
│  │ [+ Add Property]                                │   │
│  │                                                  │   │
│  │ ⚙️  currentHealth                               │   │
│  │    Type: byte        Range: 0-255              │   │
│  │    Default: 100                                │   │
│  │    🔗 Link to Global: [Lives ▼]               │   │
│  │                                                  │   │
│  │ ⚙️  maxHealth                                   │   │
│  │    Type: byte        Range: 0-255              │   │
│  │    Default: 100                                │   │
│  │                                                  │   │
│  │ ⚙️  isInvulnerable                              │   │
│  │    Type: boolean                               │   │
│  │    Default: false                              │   │
│  │    🔗 Link to Global: [Shield ▼]              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Behaviors ──────────────────────────────────────┐   │
│  │ [Visual Script] [ASM Code]                      │   │
│  │                                                  │   │
│  │ onUpdate:                                       │   │
│  │   ┌──────────────────────────────────────────┐ │   │
│  │   │  [IF] currentHealth <= 0                 │ │   │
│  │   │    ├─[WRITE] globalVar.Lives -= 1       │ │   │
│  │   │    └─[ACTION] Destroy Entity             │ │   │
│  │   │                                           │ │   │
│  │   │  [IF] globalVar.Shield == true           │ │   │
│  │   │    └─[SET] isInvulnerable = true         │ │   │
│  │   └──────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ onCollision:                                    │   │
│  │   ┌──────────────────────────────────────────┐ │   │
│  │   │  [IF] !isInvulnerable                    │ │   │
│  │   │    └─[MODIFY] currentHealth -= 10        │ │   │
│  │   └──────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Preview ───────────────────────────────────────┐   │
│  │  [Test Entity with this component]             │   │
│  │                                                  │   │
│  │  Current Values:                                │   │
│  │    currentHealth: 85/100                       │   │
│  │    isInvulnerable: false                       │   │
│  │                                                  │   │
│  │  Global Vars Linked:                            │   │
│  │    ✓ Lives (write)                             │   │
│  │    ✓ Shield (read)                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2. ComponentPropertyEditor.tsx
Modal para editar una propiedad individual:
```
┌─────────────────────────────────────────────┐
│ Edit Property                        [Save] │
├─────────────────────────────────────────────┤
│                                              │
│  Name: [currentHealth______________]        │
│                                              │
│  Type: [byte ▼]                             │
│    ○ byte (0-255)                           │
│    ○ word (0-65535)                         │
│    ○ boolean                                │
│    ○ position {x,y}                         │
│    ○ sprite reference                       │
│    ● Global Variable Link                   │
│                                              │
│  Default Value: [100___]                    │
│                                              │
│  ┌─ Global Variable Link ────────────────┐ │
│  │ ☑ Link to Global Variable             │ │
│  │                                         │ │
│  │ Asset: [Player Stats ▼]               │ │
│  │ Variable: [Health ▼]                   │ │
│  │                                         │ │
│  │ Sync Mode:                             │ │
│  │   ○ Read Only                          │ │
│  │   ○ Write Only                         │ │
│  │   ● Read/Write                         │ │
│  │                                         │ │
│  │ Update Frequency:                      │ │
│  │   ○ Every Frame                        │ │
│  │   ● On Change                          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌─ Validation ───────────────────────────┐ │
│  │ Min: [0___]  Max: [100___]             │ │
│  │ ☑ Required                             │ │
│  └────────────────────────────────────────┘ │
│                                              │
│          [Cancel]           [Save]          │
└─────────────────────────────────────────────┘
```

### 3. VisualScriptEditor.tsx
Editor visual de comportamiento (similar a Blueprint de Unreal):
```
┌───────────────────────────────────────────────────────────────┐
│ Behavior: onUpdate                              [Add Node] │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│    START                                                       │
│      │                                                         │
│      ▼                                                         │
│  ┌────────────────────┐                                       │
│  │ [IF] Condition     │                                       │
│  │ currentHealth <= 0 │                                       │
│  └────────────────────┘                                       │
│      │ true    │ false                                        │
│      ▼         ▼                                              │
│  ┌───────┐  [SKIP]                                           │
│  │ [SET] │                                                    │
│  │ Global│                                                    │
│  │ Lives │                                                    │
│  │ -= 1  │                                                    │
│  └───────┘                                                    │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────┐                                              │
│  │ [ACTION]    │                                              │
│  │ Destroy     │                                              │
│  │ Entity      │                                              │
│  └─────────────┘                                              │
│      │                                                         │
│      ▼                                                         │
│    END                                                         │
│                                                                │
│  [Available Nodes:]                                           │
│  • Condition (IF/ELSE)                                        │
│  • Global Var Read                                            │
│  • Global Var Write                                           │
│  • Property Get/Set                                           │
│  • Math Operation                                             │
│  • Action (Move, Animate, Sound, etc.)                       │
│  • Event Trigger                                              │
└───────────────────────────────────────────────────────────────┘
```

## 🔧 Implementación Técnica

### 1. Runtime System (Play Mode)

```typescript
// dynamicComponentRuntime.ts

export class DynamicComponentRuntime {
  private components: Map<string, DynamicComponent> = new Map();
  private globalVarCache: Map<string, any> = new Map();

  /**
   * Ejecuta el comportamiento de un componente dinámico
   */
  executeComponentBehavior(
    entityId: string,
    componentId: string,
    trigger: string,
    context: ExecutionContext
  ): void {
    const component = this.components.get(componentId);
    if (!component || !component.isEnabled) return;

    const behaviors = component.behaviors?.filter(b => b.trigger === trigger);
    if (!behaviors) return;

    for (const behavior of behaviors) {
      this.executeBehaviorGraph(behavior, entityId, context);
    }
  }

  /**
   * Ejecuta un grafo de nodos de comportamiento
   */
  private executeBehaviorGraph(
    behavior: DynamicComponentBehavior,
    entityId: string,
    context: ExecutionContext
  ): void {
    let currentNodeId = behavior.entryNodeId;

    while (currentNodeId) {
      const node = behavior.nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      switch (node.type) {
        case 'condition':
          currentNodeId = this.executeCondition(node, entityId, context);
          break;
        case 'globalVarOp':
          this.executeGlobalVarOp(node, entityId, context);
          currentNodeId = node.connections.next;
          break;
        case 'action':
          this.executeAction(node, entityId, context);
          currentNodeId = node.connections.next;
          break;
        default:
          currentNodeId = null;
      }
    }
  }

  /**
   * Ejecuta operación sobre variable global
   */
  private executeGlobalVarOp(
    node: ComponentBehaviorNode,
    entityId: string,
    context: ExecutionContext
  ): void {
    const { globalVarAssetId, globalVarName, operation } = node.config;

    if (!globalVarAssetId || !globalVarName) return;

    const globalVarAsset = context.getGlobalVariableAsset(globalVarAssetId);
    if (!globalVarAsset) return;

    const variable = globalVarAsset.data.customVariables.find(
      v => v.name === globalVarName
    );
    if (!variable) return;

    switch (operation) {
      case 'read':
        this.globalVarCache.set(
          `${globalVarAssetId}.${globalVarName}`,
          variable.value
        );
        break;
      case 'write':
        variable.value = node.config.value;
        break;
      case 'increment':
        variable.value = (variable.value || 0) + 1;
        break;
      case 'decrement':
        variable.value = (variable.value || 0) - 1;
        break;
    }
  }

  /**
   * Hot-reload de un componente
   */
  hotReload(componentId: string, updatedComponent: DynamicComponent): void {
    console.log(`🔥 Hot-reloading component: ${componentId}`);
    this.components.set(componentId, updatedComponent);

    // Notificar a todas las entidades que usan este componente
    this.notifyComponentUpdate(componentId);
  }
}
```

### 2. ASM Code Generation

```typescript
// dynamicComponentASMGenerator.ts

export function generateDynamicComponentASM(
  component: DynamicComponent,
  globalVariableAssets: GlobalVariablesAsset[]
): string {
  let asm = `; ==================================================================
; DYNAMIC COMPONENT: ${component.name}
; Generated from Dynamic Component System
; ==================================================================

`;

  // Generar estructura de datos para las propiedades
  asm += `; Component Data Structure
COMP_${component.id.toUpperCase()}_SIZE EQU ${calculateComponentSize(component)}

`;

  // Generar funciones de comportamiento
  for (const behavior of component.behaviors || []) {
    asm += generateBehaviorASM(behavior, component, globalVariableAssets);
  }

  return asm;
}

function generateBehaviorASM(
  behavior: DynamicComponentBehavior,
  component: DynamicComponent,
  globalVars: GlobalVariablesAsset[]
): string {
  const funcName = `comp_${component.id}_${behavior.trigger}`.toLowerCase();

  let asm = `${funcName}:
    ; Behavior: ${behavior.name}
    ; Trigger: ${behavior.trigger}
    push hl
    push bc
    push de

`;

  // Generar ASM para cada nodo del grafo
  for (const node of behavior.nodes) {
    asm += generateNodeASM(node, component, globalVars);
  }

  asm += `
    pop de
    pop bc
    pop hl
    ret

`;

  return asm;
}

function generateNodeASM(
  node: ComponentBehaviorNode,
  component: DynamicComponent,
  globalVars: GlobalVariablesAsset[]
): string {
  switch (node.type) {
    case 'condition':
      return `    ; IF ${node.config.compareProperty} ${node.config.operator} ${node.config.compareValue}
    ld a, (${node.config.compareProperty})
    cp ${node.config.compareValue}
    jp ${node.config.operator === 'eq' ? 'z' : 'nz'}, ${node.connections.onTrue}
    jp ${node.connections.onFalse}
`;

    case 'globalVarOp':
      const varAsset = globalVars.find(g => g.id === node.config.globalVarAssetId);
      const variable = varAsset?.data.customVariables.find(
        v => v.name === node.config.globalVarName
      );

      if (!variable) return '; ERROR: Variable not found\n';

      const asmVarName = `global_var_${variable.name.toLowerCase()}`;

      switch (node.config.operation) {
        case 'read':
          return `    ; READ global variable ${variable.name}
    ld a, (${asmVarName})
`;
        case 'write':
          return `    ; WRITE global variable ${variable.name}
    ld a, ${node.config.value}
    ld (${asmVarName}), a
`;
        case 'increment':
          return `    ; INCREMENT global variable ${variable.name}
    ld a, (${asmVarName})
    inc a
    ld (${asmVarName}), a
`;
        case 'decrement':
          return `    ; DECREMENT global variable ${variable.name}
    ld a, (${asmVarName})
    dec a
    ld (${asmVarName}), a
`;
      }

    case 'action':
      return `    ; ACTION: ${node.config.action}
    call action_${node.config.action}
`;

    default:
      return '';
  }
}
```

## 📦 Integration Points

### 1. File Explorer
- Nueva categoría "Dynamic Components" en el panel de assets
- Icono distintivo (⚡) para componentes dinámicos
- Posibilidad de duplicar componentes existentes

### 2. Entity Template Editor
- Lista de componentes disponibles incluye dynamic components
- Hot-reload automático cuando se modifica un dynamic component

### 3. Properties Panel
- Mostrar propiedades de dynamic components igual que comp_X estándar
- Highlight visual para propiedades vinculadas a global variables

### 4. MSX Generator
- Integración automática en msxModularGenerator.ts
- Generación de archivo `dynamic_components.asm`

## 🎬 User Flow Examples

### Ejemplo 1: Crear componente "Power-Up Timer"
```
1. User: Click "New Asset" → "Dynamic Component"
2. System: Abre DynamicComponentEditor vacío
3. User:
   - Name: "PowerUpTimer"
   - Add Property: "duration" (byte, default 60)
   - Add Property: "isActive" (boolean, default false)
   - Link "isActive" to GlobalVariable "PowerUpActive" (read/write)
4. User: Add Behavior "onUpdate":
   - IF isActive == true:
     - duration -= 1
     - IF duration <= 0:
       - WRITE GlobalVariable "PowerUpActive" = false
       - SET isActive = false
5. User: Click Save
6. System:
   - Crea nuevo asset "PowerUpTimer"
   - Disponible inmediatamente en Entity Templates
   - No requiere reiniciar Mideas
```

### Ejemplo 2: Usar componente en entidad
```
1. User: Open Entity Template "Player"
2. User: Click "Add Component" → Select "PowerUpTimer"
3. System:
   - Añade PowerUpTimer a componentes de Player
   - Muestra propiedades en Properties Panel
   - Indica que "isActive" está vinculado a GlobalVariable
4. User: Test en Play Mode
5. System:
   - Ejecuta comportamiento onUpdate del PowerUpTimer
   - Actualiza GlobalVariable "PowerUpActive" automáticamente
   - Refleja cambios en tiempo real
```

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (1-2 días)
- [ ] Crear tipo DynamicComponent en types.ts
- [ ] Implementar DynamicComponentEditor.tsx básico
- [ ] Sistema de storage/load de dynamic components
- [ ] Integración en File Explorer

### Phase 2: Property System (1 día)
- [ ] ComponentPropertyEditor.tsx
- [ ] Validación de propiedades
- [ ] Global Variable linking (read/write)

### Phase 3: Visual Scripting (2-3 días)
- [ ] VisualScriptEditor.tsx con drag & drop de nodos
- [ ] Tipos de nodos básicos (condition, action, globalVarOp)
- [ ] Execution engine para runtime

### Phase 4: Runtime Integration (1-2 días)
- [ ] DynamicComponentRuntime para Play Mode
- [ ] Hot-reload system
- [ ] Cache de global variables

### Phase 5: ASM Generation (2 días)
- [ ] dynamicComponentASMGenerator.ts
- [ ] Integración en msxModularGenerator
- [ ] Testing de código generado

### Phase 6: Advanced Features (1-2 días)
- [ ] Component templates/presets
- [ ] Import/Export de componentes
- [ ] Component library shared between projects

## 💡 Benefits

1. **Rapid Prototyping**: Crear componentes sin escribir ASM
2. **Live Testing**: Hot-reload permite iterar rápido
3. **Global Variables Integration**: Acceso directo a sistema de variables
4. **Visual Debugging**: Ver estado de componentes en tiempo real
5. **Reusability**: Compartir componentes entre proyectos
6. **ASM Output**: Genera código MSX optimizado automáticamente

## 🔮 Future Enhancements

- Component marketplace para compartir componentes community
- AI-assisted component generation
- Performance profiling de componentes
- Component inheritance/composition
- Blueprint-style visual programming más avanzado
