import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { StateMachineState } from '../../copia3';

/**
 * Props for the {@link StatePropertiesModal} component.
 * @category Modal
 */
interface StatePropertiesModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback function to close the modal. */
  onClose: () => void;
  /** The state whose properties are being edited. */
  state: StateMachineState | null;
  /** Callback function to update the state's properties. */
  onUpdateState: (id: string, properties: { [key: string]: any }) => void;
}

/**
 * A modal dialog for editing the key-value properties of a state machine state.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
export const StatePropertiesModal: React.FC<StatePropertiesModalProps> = ({ isOpen, onClose, state, onUpdateState }) => {
  const [properties, setProperties] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (state?.properties) {
      setProperties(state.properties);
    } else {
      setProperties({});
    }
  }, [state]);

  if (!isOpen || !state) return null;

  const handlePropertyChange = (key: string, value: any) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  const handleAddProperty = () => {
    const newKey = `property_${Object.keys(properties).length + 1}`;
    setProperties(prev => ({ ...prev, [newKey]: '' }));
  };

  const handleSave = () => {
    onUpdateState(state.id, properties);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Properties for ${state.name}`}>
      <div className="p-4">
        <div className="space-y-2">
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <input
                type="text"
                value={key}
                // Ideally, we should handle key changes, but for simplicity, we'll keep them static for now
                readOnly
                className="w-1/3 p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handlePropertyChange(key, e.target.value)}
                className="w-2/3 p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <Button onClick={handleAddProperty} variant="secondary">Add Property</Button>
          <Button onClick={handleSave} variant="primary">Save</Button>
        </div>
      </div>
    </Modal>
  );
};
