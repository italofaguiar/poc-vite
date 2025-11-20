import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Signup from './Signup';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  signup: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render signup form', () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    expect(screen.getByText(/Criar nova conta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Criar conta/i })
    ).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Criar conta/i });
    await user.click(submitButton);

    await waitFor(() => {
      // HTML5 email validation might show "Email inválido" for empty/invalid format
      expect(
        screen.getByText(/Email (é obrigatório|inválido)/)
      ).toBeInTheDocument();
    });
  });

  // Note: Email format validation is tested in auth.test.ts (Zod schema tests)
  // HTML5 validation prevents form submission for invalid emails in the browser
  // This is intentional behavior that works together with our Zod validation

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345'); // Less than 6 characters
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Senha deve ter no mínimo 6 caracteres')
      ).toBeInTheDocument();
    });
  });

  it('should accept password with 6 or more characters', async () => {
    const user = userEvent.setup();
    vi.mocked(api.signup).mockResolvedValue({ message: 'Signup successful' });

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123456'); // Exactly 6 characters
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.signup).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('should clear field error when user types', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    // Trigger validation error
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Email (é obrigatório|inválido)/)
      ).toBeInTheDocument();
    });

    // Type in email field
    await user.type(emailInput, 't');

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/Email (é obrigatório|inválido)/)
      ).not.toBeInTheDocument();
    });
  });

  it('should submit form and navigate to dashboard on success', async () => {
    const user = userEvent.setup();
    vi.mocked(api.signup).mockResolvedValue({ message: 'Signup successful' });

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.signup).toHaveBeenCalledWith('newuser@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error message when email already exists', async () => {
    const user = userEvent.setup();
    const error = {
      response: {
        status: 400,
        data: { detail: 'Email ja cadastrado' },
      },
    };
    vi.mocked(api.signup).mockRejectedValue(error);

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email ja cadastrado')).toBeInTheDocument();
    });
  });

  it('should show generic error message on other errors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.signup).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao criar conta. Tente novamente.')
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    vi.mocked(api.signup).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Criando conta...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should disable inputs during submission', async () => {
    const user = userEvent.setup();

    // Create a promise that never resolves to keep loading state
    const signupPromise = new Promise<{ message: string }>(() => {
      // Never resolves - keeps loading state active
    });
    vi.mocked(api.signup).mockReturnValue(signupPromise);

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Senha/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Criar conta/i });

    // Type and wait for values to be set
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Verify values are set before clicking
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');

    await user.click(submitButton);

    // Verify inputs are disabled during submission
    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  // Note: Multiple validation errors at once is implicitly tested by Zod schema tests
  // and by the combination of other component tests above
});
