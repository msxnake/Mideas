/**
 * SISTEMAS INTEGRADOS - Movimiento Pac-Man + Colisión de Paredes
 * 
 * Este archivo muestra cómo integrar el nuevo sistema de movimiento Pac-Man
 * con tu sistema existente de colisión de paredes.
 * 
 * ORDEN DE EJECUCIÓN:
 * 1. Sistema de Input (lee teclas)
 * 2. Sistema de Movimiento Pac-Man (mueve entidades)
 * 3. Sistema de Colisión de Paredes (corrección de seguridad)
 */

// Importar funciones del nuevo sistema
import { 
    enhancedPacManMovement, 
    canMoveDirectionFromAlignedPosition, 
    isAlignedToGridForTurning 
} from './pacManMovementSolution.js';

// ============================================================================
// SISTEMA DE INPUT INTEGRADO
// ============================================================================

/**
 * Sistema de input que lee las teclas y actualiza el estado de input
 */
const inputSystem = {
    id: 'inputSystem',
    name: 'Input System',
    previousInputs: new Map(), // Almacena inputs anteriores por entidad
    
    execute: (entities, componentDefinitions, screenMap) => {
        entities.forEach(entity => {
            // Solo procesar entidades con input de jugador
            const inputComp = entity.template.components.find(c => c.definitionId === 'comp_player_input');
            if (!inputComp) return;

            const inputProps = { 
                ...inputComp.defaultValues, 
                ...(entity.instance.componentOverrides?.['comp_player_input'] || {}) 
            };

            if (!inputProps.inputEnabled) return;

            // Leer input actual (adapta esto a tu sistema de input)
            const currentInput = this.readCurrentInput(inputProps.controllerId);
            
            // Obtener input anterior
            const entityId = entity.instance.id;
            const prevInput = this.previousInputs.get(entityId) || {
                up: false, down: false, left: false, right: false
            };

            // Almacenar el estado de input en la entidad para el sistema de movimiento
            if (!entity.inputState) entity.inputState = {};
            
            entity.inputState = {
                up: currentInput.up,
                down: currentInput.down,
                left: currentInput.left,
                right: currentInput.right,
                prevUp: prevInput.up,
                prevDown: prevInput.down,
                prevLeft: prevInput.left,
                prevRight: prevInput.right
            };

            // Guardar input actual para el próximo frame
            this.previousInputs.set(entityId, { ...currentInput });
        });
    },

    readCurrentInput: function(controllerId) {
        // ADAPTA ESTO A TU SISTEMA DE INPUT
        // Ejemplo usando keyboard API del navegador:
        
        if (typeof window !== 'undefined' && window.addEventListener) {
            // Navegador
            return {
                up: this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW'),
                down: this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS'),
                left: this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA'),
                right: this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')
            };
        } else {
            // MSX/Assembly - implementar según tu sistema
            return { up: false, down: false, left: false, right: false };
        }
    },

    pressedKeys: new Set(),

    isKeyPressed: function(key) {
        return this.pressedKeys.has(key);
    },

    // Inicializar listeners de teclado
    init: function() {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                this.pressedKeys.add(e.code);
            });
            
            window.addEventListener('keyup', (e) => {
                this.pressedKeys.delete(e.code);
            });
        }
    }
};

// ============================================================================
// SISTEMA DE MOVIMIENTO PAC-MAN MEJORADO
// ============================================================================

const enhancedPacManMovementSystem = {
    id: 'enhancedPacManMovement',
    name: 'Enhanced Pac-Man Movement System',
    
    execute: (entities, componentDefinitions, screenMap) => {
        if (!screenMap || !screenMap.layers?.collision) return;

        entities.forEach(entity => {
            // Buscar componente de movimiento Pac-Man
            const pacMovementComp = entity.template.components.find(c => c.definitionId === 'comp_pacMovement');
            if (!pacMovementComp) return;

            // Obtener propiedades con overrides
            const props = { 
                ...pacMovementComp.defaultValues, 
                ...(entity.instance.componentOverrides?.['comp_pacMovement'] || {}) 
            };

            if (!props.isEnabled) return;

            // Obtener componente de colisión para información de hitbox
            const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
            if (!wallCollisionComp) return;

            const wallProps = { 
                ...wallCollisionComp.defaultValues, 
                ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
            };

            const tileSize = Number(wallProps.tileSize) || 16;
            const speed = Number(props.speed) || 2;

            // Configurar propiedades de hitbox en la entidad
            entity.hitboxWidth = Number(wallProps.hitboxWidth) || 16;
            entity.hitboxHeight = Number(wallProps.hitboxHeight) || 16;
            entity.offsetX = Number(wallProps.offsetX) || 0;
            entity.offsetY = Number(wallProps.offsetY) || 0;

            // Obtener estado de input
            const inputState = entity.inputState || { 
                up: false, down: false, left: false, right: false,
                prevUp: false, prevDown: false, prevLeft: false, prevRight: false 
            };

            // Procesar input de dirección con detección de borde (nueva pulsación)
            let newDesiredDirection = props.desiredDirection;
            
            if (inputState.up && !inputState.prevUp) {
                newDesiredDirection = 'up';
            } else if (inputState.down && !inputState.prevDown) {
                newDesiredDirection = 'down';
            } else if (inputState.left && !inputState.prevLeft) {
                newDesiredDirection = 'left';
            } else if (inputState.right && !inputState.prevRight) {
                newDesiredDirection = 'right';
            }

            // Intentar cambiar dirección si tenemos una dirección deseada
            if (newDesiredDirection !== 'NONE' && newDesiredDirection !== props.currentDirection) {
                const isAligned = isAlignedToGridForTurning(entity, newDesiredDirection, tileSize);
                const canMove = canMoveDirectionFromAlignedPosition(
                    entity, 
                    newDesiredDirection, 
                    tileSize, 
                    screenMap.layers.collision, 
                    screenMap.width, 
                    screenMap.height
                );

                if (isAligned && canMove) {
                    // Cambiar dirección inmediatamente
                    props.currentDirection = newDesiredDirection;
                    props.desiredDirection = 'NONE';
                    
                    // Alinear a la posición de grilla para giros limpios
                    this.snapToGridAlignment(entity, newDesiredDirection, tileSize);
                    
                    console.log(`🔄 ${entity.template.name} cambió dirección a ${newDesiredDirection}`);
                } else {
                    // Encolar la dirección para más tarde
                    props.desiredDirection = newDesiredDirection;
                    if (!isAligned) {
                        console.log(`⏳ ${entity.template.name} encoló dirección ${newDesiredDirection} (no alineado)`);
                    } else {
                        console.log(`🚧 ${entity.template.name} encoló dirección ${newDesiredDirection} (camino bloqueado)`);
                    }
                }
            }

            // Moverse en la dirección actual si es posible
            if (props.currentDirection !== 'NONE') {
                const canContinue = canMoveDirectionFromAlignedPosition(
                    entity, 
                    props.currentDirection, 
                    tileSize, 
                    screenMap.layers.collision, 
                    screenMap.width, 
                    screenMap.height
                );

                if (canContinue) {
                    // Aplicar movimiento
                    switch (props.currentDirection) {
                        case 'up':
                            entity.y -= speed;
                            break;
                        case 'down':
                            entity.y += speed;
                            break;
                        case 'left':
                            entity.x -= speed;
                            break;
                        case 'right':
                            entity.x += speed;
                            break;
                    }

                    // Actualizar rotación del sprite
                    this.updateSpriteRotation(entity, props.currentDirection);
                } else {
                    // No puede continuar, detener
                    console.log(`🛑 ${entity.template.name} se detuvo (pared adelante)`);
                    props.currentDirection = 'NONE';
                }
            }

            // Guardar propiedades actualizadas
            if (!entity.instance.componentOverrides) {
                entity.instance.componentOverrides = {};
            }
            if (!entity.instance.componentOverrides['comp_pacMovement']) {
                entity.instance.componentOverrides['comp_pacMovement'] = {};
            }
            
            entity.instance.componentOverrides['comp_pacMovement'].currentDirection = props.currentDirection;
            entity.instance.componentOverrides['comp_pacMovement'].desiredDirection = props.desiredDirection;
        });
    },

    snapToGridAlignment: function(entity, direction, tileSize) {
        if (direction === 'up' || direction === 'down') {
            // Para movimiento vertical, alinear X
            entity.x = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (entity.hitboxWidth / 2);
        } else {
            // Para movimiento horizontal, alinear Y
            entity.y = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (entity.hitboxHeight / 2);
        }
    },

    updateSpriteRotation: function(entity, direction) {
        const rotateComp = entity.template.components.find(c => c.definitionId === 'comp_rotate');
        if (!rotateComp) return;

        const rotateProps = { 
            ...rotateComp.defaultValues, 
            ...(entity.instance.componentOverrides?.['comp_rotate'] || {}) 
        };

        switch (direction) {
            case 'right':
                rotateProps.rotation = 0;
                rotateProps.facingDirection = 0;
                break;
            case 'up':
                rotateProps.rotation = 90;
                rotateProps.facingDirection = 1;
                break;
            case 'left':
                rotateProps.rotation = 180;
                rotateProps.facingDirection = 2;
                break;
            case 'down':
                rotateProps.rotation = 270;
                rotateProps.facingDirection = 3;
                break;
        }

        // Guardar rotación actualizada
        if (!entity.instance.componentOverrides) {
            entity.instance.componentOverrides = {};
        }
        if (!entity.instance.componentOverrides['comp_rotate']) {
            entity.instance.componentOverrides['comp_rotate'] = {};
        }
        
        entity.instance.componentOverrides['comp_rotate'].rotation = rotateProps.rotation;
        entity.instance.componentOverrides['comp_rotate'].facingDirection = rotateProps.facingDirection;
    }
};

// ============================================================================
// SISTEMA DE ACTUALIZACIÓN PRINCIPAL
// ============================================================================

/**
 * Sistema principal que ejecuta todos los sistemas en el orden correcto
 */
const systemManager = {
    systems: [
        inputSystem,                    // 1. Leer input
        enhancedPacManMovementSystem,   // 2. Movimiento Pac-Man
        // wallCollisionSystem          // 3. Colisión (tu sistema existente como backup)
    ],

    init: function() {
        inputSystem.init();
        console.log('🚀 Sistemas integrados inicializados');
    },

    update: function(entities, componentDefinitions, screenMap) {
        // Ejecutar sistemas en orden
        this.systems.forEach(system => {
            system.execute(entities, componentDefinitions, screenMap);
        });
    }
};

// ============================================================================
// COMO USAR ESTE SISTEMA
// ============================================================================

/*
PASO 1: Inicializar sistemas (una vez al inicio)
systemManager.init();

PASO 2: En tu loop principal de juego, llamar:
systemManager.update(entities, componentDefinitions, screenMap);

PASO 3: Asegúrate de que tu entidad tenga estos componentes:
- comp_pacMovement (ya lo tienes definido)
- comp_wall_collision (ya lo tienes definido)  
- comp_player_input (ya lo tienes definido)
- comp_rotate (opcional, para rotación del sprite)

EJEMPLO DE USO:
const entities = [
    {
        template: {
            name: "PacMan Player",
            components: [
                { 
                    definitionId: "comp_pacMovement", 
                    defaultValues: { 
                        speed: 2, 
                        currentDirection: "NONE", 
                        desiredDirection: "NONE", 
                        isEnabled: true 
                    }
                },
                { 
                    definitionId: "comp_wall_collision", 
                    defaultValues: { 
                        hitboxWidth: 16, 
                        hitboxHeight: 16, 
                        offsetX: 0, 
                        offsetY: 0, 
                        tileSize: 16 
                    }
                },
                { 
                    definitionId: "comp_player_input", 
                    defaultValues: { 
                        controllerId: 0, 
                        inputEnabled: true 
                    }
                }
            ]
        },
        instance: {
            id: "player1",
            componentOverrides: {}
        },
        x: 128,
        y: 96
    }
];

// En tu loop de juego:
systemManager.update(entities, componentDefinitions, screenMap);

RESULTADO:
✅ El jugador no se atascará al intentar girar hacia paredes
✅ Movimiento suave estilo Pac-Man auténtico
✅ Encolado de direcciones para controles responsivos
✅ Alineación automática a la grilla
✅ Compatible con tu sistema de colisión existente
*/

export { systemManager, inputSystem, enhancedPacManMovementSystem };