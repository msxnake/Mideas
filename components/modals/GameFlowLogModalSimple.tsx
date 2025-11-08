import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { validateGameFlowBrowser, ValidationIssue } from '../../utils/gameFlowValidatorBrowser';
import { GameFlowGraph, ProjectAsset } from '../../types';

interface GameFlowLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameFlowGraph: GameFlowGraph;
  allAssets: ProjectAsset[];
}

/**
 * Modal para visualizar validación de GameFlow (browser version)
 */
export const GameFlowLogModal: React.FC<GameFlowLogModalProps> = ({
  isOpen,
  onClose,
  gameFlowGraph,
  allAssets
}) => {
  const [validationStatus, setValidationStatus] = useState<string>('UNKNOWN');
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Validate GameFlow when modal opens
      try {
        const result = validateGameFlowBrowser(gameFlowGraph, allAssets);
        setValidationStatus(result.status);
        setIssues(result.issues);
        setTimestamp(new Date().toLocaleString());
      } catch (error) {
        setValidationStatus('ERROR');
        setIssues([{
          type: 'ERROR',
          message: `Validation error: ${error}`
        }]);
      }
    }
  }, [isOpen, gameFlowGraph, allAssets]);

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

  const errors = issues.filter(i => i.type === 'ERROR');
  const warnings = issues.filter(i => i.type === 'WARNING');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="GameFlow Validation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px', maxHeight: '70vh' }}>
        {/* Header con estado de validación */}
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
              GameFlow: {gameFlowGraph.name} | Generated: {timestamp}
            </div>
          </div>
        </div>

        {/* Contenido de validación */}
        <div
          style={{
            flex: 1,
            background: 'hsl(0, 0%, 10%)',
            border: '1px solid hsl(0, 0%, 30%)',
            borderRadius: '0.5rem',
            padding: '1rem',
            overflowY: 'auto',
            color: 'hsl(0, 0%, 90%)'
          }}
        >
          <h3 style={{ marginTop: 0, color: 'hsl(0, 0%, 90%)' }}>Validation Summary</h3>

          <div style={{ marginBottom: '1rem' }}>
            <strong>GameFlow Structure:</strong>
            <ul style={{ marginLeft: '1.5rem' }}>
              <li>Name: {gameFlowGraph.name}</li>
              <li>Nodes: {gameFlowGraph.nodes.length}</li>
              <li>Connections: {gameFlowGraph.connections.length}</li>
              <li>Start Node: {gameFlowGraph.nodes.find(n => n.type === 'Start')?.id || 'Not Found'}</li>
            </ul>
          </div>

          {issues.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(120, 50%, 60%)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>No Issues Detected</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                GameFlow structure is valid and ready to use.
              </div>
            </div>
          ) : (
            <>
              {errors.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: 'hsl(0, 70%, 50%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>❌</span>
                    <span>Errors ({errors.length})</span>
                  </h4>
                  <ul style={{ marginLeft: '1.5rem', color: 'hsl(0, 70%, 60%)' }}>
                    {errors.map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: 'hsl(45, 100%, 50%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠️</span>
                    <span>Warnings ({warnings.length})</span>
                  </h4>
                  <ul style={{ marginLeft: '1.5rem', color: 'hsl(45, 100%, 60%)' }}>
                    {warnings.map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con botones */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
