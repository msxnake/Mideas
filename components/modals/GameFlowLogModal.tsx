import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { loadGameFlowLog } from '../../utils/gameFlowValidator';

interface GameFlowLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

/**
 * Modal para visualizar el contenido del archivo .log de GameFlow
 */
export const GameFlowLogModal: React.FC<GameFlowLogModalProps> = ({
  isOpen,
  onClose,
  projectName
}) => {
  const [logContent, setLogContent] = useState<string>('');
  const [logExists, setLogExists] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<string>('UNKNOWN');

  useEffect(() => {
    if (isOpen && projectName) {
      // Cargar el log cuando se abre el modal
      try {
        const logData = loadGameFlowLog(projectName);

        if (logData) {
          setLogContent(logData.logContent);
          setLogExists(true);
          setValidationStatus(logData.status);
        } else {
          setLogContent('');
          setLogExists(false);
          setValidationStatus('UNKNOWN');
        }
      } catch (error) {
        console.error('Error loading GameFlow log:', error);
        setLogContent(`Error loading log file: ${error}`);
        setLogExists(false);
        setValidationStatus('ERROR');
      }
    }
  }, [isOpen, projectName]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PASSED':
        return 'hsl(120, 50%, 40%)';
      case 'WARNING':
        return 'hsl(45, 100%, 50%)';
      case 'FAILED':
        return 'hsl(0, 70%, 50%)';
      default:
        return 'hsl(0, 0%, 50%)';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'PASSED':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'FAILED':
        return '❌';
      default:
        return '📄';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="GameFlow Validation Log">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px', maxHeight: '70vh' }}>
        {/* Header con estado de validación */}
        {logExists && (
          <div
            style={{
              padding: '0.75rem',
              background: getStatusColor(validationStatus) + '20',
              border: `2px solid ${getStatusColor(validationStatus)}`,
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(validationStatus)}</span>
            <div>
              <div style={{ fontWeight: 'bold', color: getStatusColor(validationStatus) }}>
                Validation Status: {validationStatus}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'hsl(0, 0%, 70%)' }}>
                Project: {projectName}
              </div>
            </div>
          </div>
        )}

        {/* Contenido del log */}
        {logExists ? (
          <div
            style={{
              flex: 1,
              background: 'hsl(0, 0%, 10%)',
              border: '1px solid hsl(0, 0%, 30%)',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'hsl(0, 0%, 90%)'
            }}
          >
            {logContent}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '2rem',
              background: 'hsl(0, 0%, 10%)',
              border: '2px dashed hsl(0, 0%, 30%)',
              borderRadius: '0.5rem'
            }}
          >
            <div style={{ fontSize: '3rem' }}>📄</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(0, 0%, 70%)' }}>
              No Log File Found
            </div>
            <div style={{ fontSize: '0.875rem', color: 'hsl(0, 0%, 60%)', textAlign: 'center', maxWidth: '400px' }}>
              Click <strong>Preview</strong> button to validate the GameFlow and generate a log file.
            </div>
          </div>
        )}

        {/* Footer con botones */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {logExists && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                // Copiar log al clipboard
                navigator.clipboard.writeText(logContent);
                alert('Log content copied to clipboard!');
              }}
            >
              Copy to Clipboard
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
