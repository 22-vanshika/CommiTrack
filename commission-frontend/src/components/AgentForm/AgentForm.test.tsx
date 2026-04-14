import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import AgentForm from './AgentForm';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AgentForm', () => {
  const mockOnAgentAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the agent form', () => {
    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);
    expect(screen.getByText('Add Agent')).toBeInTheDocument();
    expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/level/i)).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Submit with empty name by bypassing HTML validation
    const form = screen
      .getByRole('button', { name: /add agent/i })
      .closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText(/please fix the errors below/i)
      ).toBeInTheDocument();
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('validates name length', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/agent name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const form = screen
      .getByRole('button', { name: /add agent/i })
      .closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('loads parent agents based on selected level', async () => {
    const mockAgents = [{ id: 1, name: 'Level 2 Agent', level: 2 }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockAgents });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    const levelSelect = screen.getByLabelText(/level/i);
    fireEvent.change(levelSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/agents?level=2')
      );
    });
  });

  it('shows warning when no parent agents available', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    const levelSelect = screen.getByLabelText(/level/i);
    fireEvent.change(levelSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(
        screen.getByText(/no higher level agents available/i)
      ).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    // Mock the initial load and level change
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 1, name: 'Parent', level: 2 }],
    });
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { id: 2, name: 'New Agent', level: 1 },
    });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    // Wait for initial parent agents load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/agent name/i);
    fireEvent.change(nameInput, { target: { value: 'New Agent' } });

    const submitButton = screen.getByRole('button', { name: /add agent/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/agents'),
        expect.objectContaining({
          name: 'New Agent',
          level: 1,
          parent_id: 1,
        })
      );
      expect(mockOnAgentAdded).toHaveBeenCalled();
    });
  });

  it('allows creating top-level agent without parent', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { id: 1, name: 'Top Agent', level: 4 },
    });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/agent name/i);
    fireEvent.change(nameInput, { target: { value: 'Top Agent' } });

    const levelSelect = screen.getByLabelText(/level/i);
    fireEvent.change(levelSelect, { target: { value: '4' } });

    await waitFor(() => {
      const parentSelect = screen.getByLabelText(/parent agent/i);
      expect(parentSelect).toBeDisabled();
    });

    const submitButton = screen.getByRole('button', { name: /add agent/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/agents'),
        expect.objectContaining({
          name: 'Top Agent',
          level: 4,
        })
      );
    });
  });

  it('displays error message on submission failure', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Agent already exists' } },
    });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/agent name/i);
    fireEvent.change(nameInput, { target: { value: 'Duplicate Agent' } });

    const levelSelect = screen.getByLabelText(/level/i);
    fireEvent.change(levelSelect, { target: { value: '4' } });

    const submitButton = screen.getByRole('button', { name: /add agent/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/agent already exists/i)).toBeInTheDocument();
    });
  });

  it('clears form after successful submission', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 1, name: 'Parent', level: 2 }],
    });
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { id: 1, name: 'Test', level: 1 },
    });

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/agent name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Test Agent' } });

    const submitButton = screen.getByRole('button', { name: /add agent/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput.value).toBe('');
    });
  });

  it('disables submit button during submission', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 1, name: 'Parent', level: 2 }],
    });
    mockedAxios.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 201, data: {} }), 100)
        )
    );

    render(<AgentForm onAgentAdded={mockOnAgentAdded} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/agent name/i);
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    const submitButton = screen.getByRole('button', { name: /add agent/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
