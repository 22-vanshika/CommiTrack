import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Agent } from '../AgentNode';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

interface AgentFormProps {
  onAgentAdded: () => void;
}

const LEVEL_NAMES = {
  1: 'Agent',
  2: 'Team Lead',
  3: 'Manager',
  4: 'Director',
};

const AgentForm: React.FC<AgentFormProps> = ({ onAgentAdded }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [parentId, setParentId] = useState<string>('');
  const [availableParents, setAvailableParents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchParentAgents = async () => {
      if (level === 4) {
        setAvailableParents([]);
        setParentId('');
        return;
      }

      try {
        const higherLevel = level + 1;
        const response = await axios.get(
          `${API_URL}/agents?level=${higherLevel}`
        );
        setAvailableParents(response.data);

        if (response.data.length > 0) {
          setParentId(response.data[0].id.toString());
        } else {
          setParentId('');
        }
      } catch (error) {
        console.error('Failed to fetch parent agents:', error);
        setAvailableParents([]);
      }
    };

    fetchParentAgents();
  }, [level]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (level !== 4 && !parentId) {
      newErrors.parentId = 'Please select a parent agent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage('');
    setIsError(false);

    if (!validateForm()) {
      setMessage('Please fix the errors below.');
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      const agentData: any = {
        name: name.trim(),
        level: level,
      };

      if (level !== 4 && parentId) {
        agentData.parent_id = parseInt(parentId);
      }

      const response = await axios.post(`${API_URL}/agents`, agentData);

      if (response.status === 201) {
        setMessage(`✓ Agent "${name}" added successfully!`);
        setIsError(false);
        setErrors({});

        setName('');
        setLevel(1);
        setParentId('');

        onAgentAdded();

        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Failed to add agent:', error);

      let errorMessage = 'Failed to add agent. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-4 rounded-lg mb-6"
      style={{
        backgroundColor: 'var(--color-bgCard)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <h2
        className="text-xl font-semibold mb-4"
        style={{ color: 'var(--color-textPrimary)' }}
      >
        Add New Agent
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="agentName"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Agent Name *
            </label>
            <input
              type="text"
              id="agentName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              className="mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:outline-none sm:text-sm px-3 py-2.5"
              style={{
                backgroundColor: 'var(--color-bgInput)',
                color: 'var(--color-textPrimary)',
              }}
              placeholder="John Doe"
              required
            />
            {errors.name && (
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-danger)' }}
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="agentLevel"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Level *
            </label>
            <select
              id="agentLevel"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md py-2.5 pl-3 pr-10 text-base focus:outline-none focus:ring-2 sm:text-sm"
              style={{
                backgroundColor: 'var(--color-bgInput)',
                color: 'var(--color-textPrimary)',
              }}
              required
            >
              <option value={1}>Level 1 - Agent</option>
              <option value={2}>Level 2 - Team Lead</option>
              <option value={3}>Level 3 - Manager</option>
              <option value={4}>Level 4 - Director</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="parentAgent"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-textMuted)' }}
            >
              {level === 4 ? 'Parent Agent (N/A)' : 'Parent Agent *'}
            </label>
            <select
              id="parentAgent"
              value={parentId}
              onChange={(e) => {
                setParentId(e.target.value);
                if (errors.parentId) {
                  setErrors({ ...errors, parentId: '' });
                }
              }}
              className="mt-1 block w-full rounded-md py-2.5 pl-3 pr-10 text-base focus:outline-none focus:ring-2 sm:text-sm"
              style={{
                backgroundColor: 'var(--color-bgInput)',
                color: 'var(--color-textPrimary)',
                opacity: level === 4 || availableParents.length === 0 ? 0.5 : 1,
              }}
              disabled={level === 4 || availableParents.length === 0}
              required={level !== 4}
            >
              {level === 4 ? (
                <option value="">No Parent (Top Level)</option>
              ) : availableParents.length === 0 ? (
                <option value="">
                  No {LEVEL_NAMES[(level + 1) as keyof typeof LEVEL_NAMES]}s
                  available
                </option>
              ) : (
                availableParents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))
              )}
            </select>
            {errors.parentId && (
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-danger)' }}
              >
                {errors.parentId}
              </p>
            )}
            {level !== 4 && availableParents.length === 0 && (
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-warning)' }}
              >
                ⚠️ Create a{' '}
                {LEVEL_NAMES[(level + 1) as keyof typeof LEVEL_NAMES]} first
              </p>
            )}
          </div>
        </div>

        {/* Submit Button & Message */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            disabled={loading || (level !== 4 && availableParents.length === 0)}
            className="inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor:
                loading || (level !== 4 && availableParents.length === 0)
                  ? 'var(--color-textSubtle)'
                  : 'var(--color-primary)',
              color: 'var(--color-textPrimary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {loading ? 'Adding...' : 'Add Agent'}
          </button>

          {message && (
            <div
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-md"
              style={{
                backgroundColor: isError
                  ? 'var(--color-dangerBg)'
                  : 'var(--color-successBg)',
                color: isError
                  ? 'var(--color-dangerLight)'
                  : 'var(--color-successLight)',
              }}
            >
              {isError ? '✗' : '✓'}
              <span>{message}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AgentForm;
