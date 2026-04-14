import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import SalesForm from './SalesForm';
import { Agent } from '../AgentNode'; // Import Agent type

// --- Mock Axios ---
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// --- Mock Data ---
const mockAgents: Agent[] = [
  { id: 4, name: 'Sarah (Agent)', level: 1 },
  { id: 5, name: 'John (Agent)', level: 1 },
];

describe('SalesForm Component', () => {
  // Mock function for the onSaleAdded prop
  const mockOnSaleAdded = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    mockOnSaleAdded.mockClear();

    // Default mock response for fetching agents
    mockedAxios.get.mockResolvedValue({ data: mockAgents });
  });

  it('renders correctly and fetches agents', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);

    // Check if form elements are present
    expect(screen.getByLabelText(/Policy Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Policy Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Selling Agent/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Record Sale/i })
    ).toBeInTheDocument();

    // Check if axios.get was called for agents
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/agents?level=1')
    );

    // Wait for agents to load and check dropdown options
    // Use findByRole for async elements
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /Sarah \(Agent\)/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('option', { name: /John \(Agent\)/i })
    ).toBeInTheDocument();
  });

  it('submits the form data correctly and calls onSaleAdded', async () => {
    // Mock the POST response
    mockedAxios.post.mockResolvedValue({
      status: 201,
      data: { sale_id: 101, message: 'Success' },
    });

    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup(); // For simulating user typing

    // Wait for agents to load before interacting
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Fill the form
    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-TEST-101');
    await user.type(screen.getByLabelText(/Policy Value/i), '75000');
    await user.selectOptions(
      screen.getByLabelText(/Selling Agent/i),
      screen.getByRole('option', { name: /John \(Agent\)/i })
    );

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check if axios.post was called with the correct data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/sales'),
        {
          policy_number: 'POL-TEST-101',
          policy_value: 75000,
          agent_id: 5, // John's ID
        }
      );
    });

    // Check if success message is shown (with new format including checkmark)
    expect(
      await screen.findByText(/Sale #101 recorded successfully!/i)
    ).toBeInTheDocument();

    // Check if onSaleAdded prop was called
    expect(mockOnSaleAdded).toHaveBeenCalledTimes(1);

    // Check if form fields were reset
    expect(screen.getByLabelText(/Policy Number/i)).toHaveValue('');
    expect(screen.getByLabelText(/Policy Value/i)).toHaveValue(null); // Number input resets to null
  });

  it('shows an error message if submission fails', async () => {
    // Mock a failed POST response
    mockedAxios.post.mockRejectedValue(new Error('Network Error'));

    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();

    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Fill and submit
    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-FAIL');
    await user.type(screen.getByLabelText(/Policy Value/i), '1000');
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check if error message appears (new format uses error.message)
    expect(await screen.findByText(/Network Error/i)).toBeInTheDocument();

    // Check that onSaleAdded was NOT called
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  // --- Validation Tests ---

  it('shows validation error for empty policy number', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Submit without filling policy number
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check for validation error
    expect(
      await screen.findByText(/Policy number is required/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('shows validation error for policy number less than 3 characters', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Type short policy number
    await user.type(screen.getByLabelText(/Policy Number/i), 'AB');
    await user.type(screen.getByLabelText(/Policy Value/i), '50000');

    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check for validation error
    expect(
      await screen.findByText(/Policy number must be at least 3 characters/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('shows validation error for empty policy value', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-123');
    // Don't fill policy value

    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    expect(
      await screen.findByText(/Policy value is required/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('shows validation error for zero policy value', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-123');
    await user.type(screen.getByLabelText(/Policy Value/i), '0');

    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    expect(
      await screen.findByText(/Policy value must be greater than zero/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('shows validation error for negative policy value', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-123');
    await user.type(screen.getByLabelText(/Policy Value/i), '-5000');

    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    expect(
      await screen.findByText(/Policy value must be greater than zero/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('shows validation error for policy value exceeding max', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-123');
    await user.type(screen.getByLabelText(/Policy Value/i), '11000000'); // > $10M

    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    expect(
      await screen.findByText(/Policy value cannot exceed/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('clears validation error when user corrects field', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Submit with empty policy number to trigger error
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));
    expect(
      await screen.findByText(/Policy number is required/i)
    ).toBeInTheDocument();

    // Now type a valid policy number
    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-VALID');

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/Policy number is required/i)
      ).not.toBeInTheDocument();
    });
  });

  it('displays API error message for duplicate policy', async () => {
    // Mock API error response
    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          error: 'Policy number POL-DUP already exists',
        },
      },
    });

    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-DUP');
    await user.type(screen.getByLabelText(/Policy Value/i), '50000');
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check if API error message is displayed
    expect(
      await screen.findByText(/Policy number POL-DUP already exists/i)
    ).toBeInTheDocument();
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });

  it('shows loading state and disables button during submission', async () => {
    // Mock a delayed response
    mockedAxios.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ status: 201, data: { sale_id: 102 } }),
            100
          )
        )
    );

    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-LOADING');
    await user.type(screen.getByLabelText(/Policy Value/i), '75000');

    const submitButton = screen.getByRole('button', { name: /Record Sale/i });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Recording.../i })
      ).toBeDisabled();
    });
  });
});
