import React, { useState } from 'react';
import { Panel } from '../../common/Panel';
import { Button } from '../../common/Button';
import { StateMachineState, StateMachineStateName } from '../../../statemachine.types';
import { TrashIcon } from '../../icons/MsxIcons';

const PRESET_STATES = [
  { id: 'IDLE', en: 'Idle', es: 'Quieto' },
  { id: 'WALKING', en: 'Walking', es: 'Caminando' },
  { id: 'RUNNING', en: 'Running', es: 'Corriendo' },
  { id: 'JUMPING', en: 'Jumping', es: 'Saltando' },
  { id: 'FALLING', en: 'Falling', es: 'Cayendo' },
  { id: 'LANDING', en: 'Landing', es: 'Aterrizando' },
  { id: 'CROUCHING', en: 'Crouching', es: 'Agachado' },
  { id: 'CLIMBING', en: 'Climbing', es: 'Escalando' },
  { id: 'SWIMMING', en: 'Swimming', es: 'Nadando' },
  { id: 'SLIDING', en: 'Sliding', es: 'Deslizándose' },
  { id: 'DASHING', en: 'Dashing', es: 'Impulso rápido' },
  { id: 'GLIDING', en: 'Gliding', es: 'Planeando' },
  { id: 'ATTACKING', en: 'Attacking', es: 'Ejecutando un ataque' },
  { id: 'CHARGING_ATTACK', en: 'Charging Attack', es: 'Cargando un ataque especial' },
  { id: 'THROWING', en: 'Throwing', es: 'Lanzando un objeto' },
  { id: 'SHOOTING', en: 'Shooting', es: 'Disparando' },
  { id: 'DEFENDING', en: 'Defending', es: 'Defendiendo' },
  { id: 'COUNTERING', en: 'Countering', es: 'Contrarrestando un ataque' },
  { id: 'TAKING_DAMAGE', en: 'Taking Damage', es: 'Recibiendo daño' },
  { id: 'HURT', en: 'Hurt', es: 'Herido' },
  { id: 'INVULNERABLE', en: 'Invulnerable', es: 'Temporalmente invulnerable' },
  { id: 'DEAD', en: 'Dead', es: 'Muerto' },
  { id: 'SPAWNING', en: 'Spawning', es: 'Reapareciendo' },
  { id: 'INTERACTING', en: 'Interacting', es: 'Interactuando' },
  { id: 'IN_DIALOGUE', en: 'In Dialogue', es: 'En diálogo' },
  { id: 'USING_ITEM', en: 'Using Item', es: 'Usando un objeto' },
  { id: 'MORPHING', en: 'Morphing', es: 'Cambiando de forma' },
  { id: 'TELEPORTING', en: 'Teleporting', es: 'Desplazamiento instantáneo' },
  { id: 'PAUSED', en: 'Paused', es: 'En pausa' },
  { id: 'IN_CUTSCENE', en: 'In Cutscene', es: 'En cinemática' },
  { id: 'MENU_NAVIGATION', en: 'Menu Navigation', es: 'Navegando por el menú' },
  { id: 'SAVING', en: 'Saving', es: 'Guardando progreso' },
  { id: 'LOADING', en: 'Loading', es: 'Cargando nivel' },
  { id: 'FROZEN', en: 'Frozen', es: 'Congelado' },
  { id: 'ON_FIRE', en: 'On Fire', es: 'En llamas' },
  { id: 'POISONED', en: 'Poisoned', es: 'Envenenado' },
  { id: 'STUNNED', en: 'Stunned', es: 'Aturdido' },
  { id: 'INVERTED_MOVEMENT', en: 'Inverted Movement', es: 'Movimiento invertido' },
  { id: 'INVISIBLE', en: 'Invisible', es: 'No visible para enemigos' },
  { id: 'SLOWED', en: 'Slowed', es: 'Movimiento reducido' },
  { id: 'SPEED_UP', en: 'Speed Up', es: 'Velocidad aumentada' },
  { id: 'CASTING_SPELL', en: 'Casting Spell', es: 'Lanzando hechizo' },
  { id: 'FLYING', en: 'Flying', es: 'Volando' },
  { id: 'SHIELDED', en: 'Shielded', es: 'Protegido por escudo' },
  { id: 'TIME_STOPPED', en: 'Time Stopped', es: 'Tiempo detenido' },
  { id: 'PATROLLING', en: 'Patrolling', es: 'Patrullando' },
  { id: 'CHASING', en: 'Chasing', es: 'Persiguiendo' },
  { id: 'SEARCHING', en: 'Searching', es: 'Buscando' },
  { id: 'ALERTED', en: 'Alerted', es: 'En alerta' },
  { id: 'SLEEPING', en: 'Sleeping', es: 'Dormido' },
  { id: 'FLEEING', en: 'Fleeing', es: 'Huyendo' },
  { id: 'GUARDING', en: 'Guarding', es: 'Protegiendo una zona' },
  { id: 'INACTIVE', en: 'Inactive', es: 'Inactivo' },
  { id: 'TAKE', en: 'Take', es: 'Take' },
];

interface StatesPanelProps {
  states: StateMachineState[];
  selectedStateId: string | null;
  onStateSelect: (id: string) => void;
  onAddState: (name: string) => void;
  onDeleteState: (id: string) => void;
  language: 'en' | 'es';
}

export const StatesPanel: React.FC<StatesPanelProps> = ({ states, selectedStateId, onStateSelect, onAddState, onDeleteState, language }) => {
  const [newStateName, setNewStateName] = useState('');

  const handleAddClick = () => {
    if (newStateName.trim()) {
      onAddState(newStateName.trim());
      setNewStateName('');
    }
  };

  const handlePresetAdd = (name: StateMachineStateName) => {
    if (name) {
      onAddState(name);
    }
  };

  return (
    <Panel title="States">
      <div className="p-2">
        <ul className="space-y-1 mb-2">
          {states.map(state => (
            <li 
              key={state.id} 
              className={`flex items-center justify-between p-1 rounded group cursor-pointer ${selectedStateId === state.id ? 'bg-msx-blue' : 'bg-msx-bgcolor'}`}
              onClick={() => onStateSelect(state.id)}
            >
              <span className="text-sm text-msx-textprimary">{state.name}</span>
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteState(state.id); }}
                  className="p-0.5 rounded-sm text-msx-danger opacity-0 group-hover:opacity-100"
                  title={`Delete ${state.name}`}
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex space-x-1">
          <input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="Custom state name..."
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
          />
          <Button onClick={handleAddClick} variant="secondary" size="sm">
            Add
          </Button>
        </div>
        <div className="flex space-x-1 mt-2">
          <select
            onChange={(e) => handlePresetAdd(e.target.value as StateMachineStateName)}
            className="w-full p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
            value=""
          >
            <option value="">Add from preset...</option>
            {PRESET_STATES.map(s => <option key={s.id} value={s[language]}>{s[language]}</option>)}
          </select>
        </div>
      </div>
    </Panel>
  );
};
