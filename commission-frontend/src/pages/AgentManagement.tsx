import React from 'react';
import AgentForm from '../components/AgentForm';
import AgentNode, { Agent } from '../components/AgentNode';

interface AgentManagementProps {
  hierarchy: Agent[];
  onAgentAdded: () => void;
}

const AgentManagement: React.FC<AgentManagementProps> = ({
  hierarchy,
  onAgentAdded,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-textprimary">
          Agent Management
        </h1>
        <p className="mt-2 text-sm text-textmuted">
          Manage your sales team hierarchy and agent information
        </p>
      </div>

      <AgentForm onAgentAdded={onAgentAdded} />

      <div className="rounded-lg p-6 bg-bgcard shadow-custom-xl">
        <h2 className="text-xl font-semibold mb-4 text-textprimary">
          Agent Hierarchy
        </h2>
        {hierarchy.length > 0 ? (
          <div className="space-y-2">
            {hierarchy.map((agent) => (
              <AgentNode key={agent.id} agent={agent} onUpdate={onAgentAdded} />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-textsubtl">
            No agents yet. Add your first agent above.
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentManagement;
