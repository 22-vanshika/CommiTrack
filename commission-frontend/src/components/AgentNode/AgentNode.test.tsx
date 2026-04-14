import React from 'react';
import { render, screen } from '@testing-library/react';
import AgentNode, { Agent } from './AgentNode';

describe('AgentNode Component', () => {
  it('renders agent name and level correctly', () => {
    // 1. Create mock data for a single agent
    const mockAgent: Agent = {
      id: 1,
      name: 'Mike (Director)',
      level: 4,
    };

    // 2. Render the component with the mock data
    render(<AgentNode agent={mockAgent} />);

    // 3. Check if the name and level are on the screen
    // We use a regular expression (regex) to find the text
    const agentName = screen.getByText(/Mike \(Director\)/i);
    const agentLevel = screen.getByText(/Level 4/i);

    // 4. Assert that the elements were found
    expect(agentName).toBeInTheDocument();
    expect(agentLevel).toBeInTheDocument();
  });

  it('renders child agents recursively', () => {
    // 1. Create mock data with a parent and child
    const mockAgent: Agent = {
      id: 1,
      name: 'Mike (Director)',
      level: 4,
      children: [
        {
          id: 2,
          name: 'Lisa (Manager)',
          level: 3,
        },
      ],
    };

    // 2. Render the component
    render(<AgentNode agent={mockAgent} />);

    // 3. Check if both parent and child are on the screen
    const parentName = screen.getByText(/Mike \(Director\)/i);
    const childName = screen.getByText(/Lisa \(Manager\)/i);

    // 4. Assert that both were found
    expect(parentName).toBeInTheDocument();
    expect(childName).toBeInTheDocument();
  });

  it('renders multiple levels of hierarchy', () => {
    const mockAgent: Agent = {
      id: 1,
      name: 'Director',
      level: 4,
      children: [
        {
          id: 2,
          name: 'Manager',
          level: 3,
          children: [
            {
              id: 3,
              name: 'Team Lead',
              level: 2,
              children: [
                {
                  id: 4,
                  name: 'Agent',
                  level: 1,
                },
              ],
            },
          ],
        },
      ],
    };

    render(<AgentNode agent={mockAgent} />);

    // All 4 levels should be rendered
    expect(screen.getByText(/Director/i)).toBeInTheDocument();
    expect(screen.getByText(/Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/Team Lead/i)).toBeInTheDocument();
    expect(screen.getByText(/Agent/i)).toBeInTheDocument();

    // Check all level badges
    expect(screen.getByText(/Level 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument();
  });

  it('renders agent without children', () => {
    const mockAgent: Agent = {
      id: 1,
      name: 'Solo Agent',
      level: 1,
    };

    render(<AgentNode agent={mockAgent} />);

    expect(screen.getByText(/Solo Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    const mockAgent: Agent = {
      id: 1,
      name: 'Manager',
      level: 3,
      children: [
        { id: 2, name: 'Agent 1', level: 1 },
        { id: 3, name: 'Agent 2', level: 1 },
        { id: 4, name: 'Agent 3', level: 1 },
      ],
    };

    render(<AgentNode agent={mockAgent} />);

    expect(screen.getByText(/Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/Agent 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Agent 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Agent 3/i)).toBeInTheDocument();
  });
});
