import React, { useState } from 'react';
import axios from 'axios';

export interface Agent {
  id: number;
  name: string;
  level: number;
  parent_id?: number | null;
  children?: Agent[];
}

interface AgentNodeProps {
  agent: Agent;
  onUpdate?: () => void;
}

const levelColors: { [key: number]: string } = {
  1: 'border-sky-400',
  2: 'border-green-400',
  3: 'border-amber-400',
  4: 'border-purple-400',
};

const API_URL =
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

const AgentNode: React.FC<AgentNodeProps> = ({ agent, onUpdate }) => {
  const color = levelColors[agent.level] || 'border-gray-400';
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editName, setEditName] = useState(agent.name);
  const [editLevel, setEditLevel] = useState(agent.level);
  const [editParentId, setEditParentId] = useState<number | null>(
    agent.parent_id || null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmDelete = async () => {
    setLoading(true);
    setError('');
    setShowDeleteModal(false);

    try {
      await axios.delete(`${API_URL}/agents/${agent.id}`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete agent';
      setError(errorMsg);
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.put(`${API_URL}/agents/${agent.id}`, {
        name: editName,
        level: editLevel,
        parent_id: editParentId,
      });
      setShowEditModal(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update agent';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditName(agent.name);
    setEditLevel(agent.level);
    setEditParentId(agent.parent_id || null);
    setError('');
    setShowEditModal(true);
  };

  return (
    <div>
      <div
        className={`p-2 my-1 border-l-4 rounded ${color} flex justify-between items-center`}
        style={{
          backgroundColor: 'var(--color-bgCard)',
          borderLeftWidth: '4px',
        }}
      >
        <p className="font-bold" style={{ color: 'var(--color-textPrimary)' }}>
          {agent.name}{' '}
          <span
            className="font-normal"
            style={{ color: 'var(--color-textMuted)' }}
          >
            (Level {agent.level})
          </span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={openEditModal}
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-textPrimary)',
            }}
            disabled={loading}
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: 'var(--color-danger)',
              color: 'var(--color-textPrimary)',
            }}
            disabled={loading}
          >
            Delete
          </button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg shadow-xl max-w-md w-full"
            style={{
              backgroundColor: 'var(--color-bgCard)',
            }}
          >
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--color-textPrimary)' }}
            >
              Edit Agent
            </h3>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-textPrimary)' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-bgInput)',
                    color: 'var(--color-textPrimary)',
                  }}
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-textPrimary)' }}
                >
                  Level
                </label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-bgInput)',
                    color: 'var(--color-textPrimary)',
                  }}
                >
                  <option value={1}>1 - Agent</option>
                  <option value={2}>2 - Team Lead</option>
                  <option value={3}>3 - Manager</option>
                  <option value={4}>4 - Director</option>
                </select>
              </div>
              {error && (
                <div
                  className="mb-4 p-2 rounded"
                  style={{
                    backgroundColor: 'var(--color-dangerBg)',
                    color: 'var(--color-danger)',
                  }}
                >
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: 'var(--color-bgInput)',
                    color: 'var(--color-textPrimary)',
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-textPrimary)',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg shadow-xl max-w-md w-full"
            style={{
              backgroundColor: 'var(--color-bgCard)',
            }}
          >
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--color-textPrimary)' }}
            >
              Confirm Delete
            </h3>
            <p
              className="mb-6"
              style={{ color: 'var(--color-textPrimary)' }}
            >
              Are you sure you want to delete {agent.name}?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: 'var(--color-bgInput)',
                  color: 'var(--color-textPrimary)',
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--color-textPrimary)',
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg shadow-xl max-w-md w-full"
            style={{
              backgroundColor: 'var(--color-bgCard)',
            }}
          >
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--color-danger)' }}
            >
              Error
            </h3>
            <p
              className="mb-6"
              style={{ color: 'var(--color-textPrimary)' }}
            >
              {errorMessage}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-textPrimary)',
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THIS IS THE RECURSIVE PART THAT CREATES THE INDENTATION */}
      {agent.children && agent.children.length > 0 && (
        <div
          className="pl-6 border-l-2 ml-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {agent.children.map((child) => (
            <AgentNode key={child.id} agent={child} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentNode;
