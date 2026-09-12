import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from './LoginModal';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('./GoogleOneTap', () => ({
  default: () => <div data-testid="google-one-tap" />,
}));

describe('LoginModal', () => {
  it('no renderiza cuando open es false', () => {
    renderWithProviders(<LoginModal open={false} onClose={() => {}} />);
    expect(screen.queryByText('Sign in with Google')).toBeNull();
  });

  it('renderiza el contenido y el botón One Tap cuando open es true', () => {
    renderWithProviders(<LoginModal open onClose={() => {}} />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByTestId('google-one-tap')).toBeInTheDocument();
  });

  it('llama a onClose al presionar el botón cerrar', async () => {
    const onClose = vi.fn();
    renderWithProviders(<LoginModal open onClose={onClose} />);
    await userEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});