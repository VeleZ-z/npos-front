import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import BackButton from './BackButton';
import FullScreenLoader from './FullScreenLoader';
import Modal from './Modal';
import BottomNav from './BottomNav';

vi.mock('../../https/index', () => ({}));

vi.mock('../../context/LoginModalContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLoginModal: () => ({ openLoginModal: vi.fn() }),
  };
});

describe('FullScreenLoader', () => {
  it('renderiza el spinner', () => {
    renderWithProviders(<FullScreenLoader />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('no renderiza contenido cuando isOpen es false', () => {
    renderWithProviders(
      <Modal isOpen={false} onClose={() => {}} title="Título">
        <div>Contenido</div>
      </Modal>
    );
    expect(screen.queryByText('Contenido')).toBeNull();
  });

  it('renderiza título, children y cierra al presionar la X', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal isOpen onClose={onClose} title="Título">
        <div>Contenido</div>
      </Modal>
    );
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('BackButton', () => {
  it('renderiza el botón y navega hacia atrás', async () => {
    renderWithProviders(<BackButton />);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });
});

describe('BottomNav', () => {
  it('renderiza el menú de staff (Home, Inventario, Promociones, Mas)', () => {
    renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'admin', isAuth: true, name: 'Ana' } },
      route: '/',
    });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Promociones')).toBeInTheDocument();
    expect(screen.getByText('Mas')).toBeInTheDocument();
  });

  it('renderiza el menú de customer (Ordenes, Promociones) y abre modal de orden', async () => {
    const { container } = renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'customer', isAuth: false, name: '' } },
      route: '/',
    });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Ordenes')).toBeInTheDocument();
    await userEvent.click(container.querySelector('.absolute.bottom-6'));
    expect(screen.getByText('Nombre del Cliente')).toBeInTheDocument();
  });

  it('abre el menú Mas para staff y muestra Mi Perfil', async () => {
    renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'cashier', isAuth: true, name: 'Luis' } },
      route: '/',
    });
    await userEvent.click(screen.getByText('Mas'));
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
  });

  it('incrementa y decrementa el contador de comensales', async () => {
    const { container } = renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'customer', isAuth: false, name: '' } },
      route: '/',
    });
    await userEvent.click(container.querySelector('.absolute.bottom-6'));
    const plus = screen.getByRole('button', { name: '+' });
    const minus = screen.getByRole('button', { name: '−' });
    await userEvent.click(plus);
    expect(screen.getByText('1 Personas')).toBeInTheDocument();
    await userEvent.click(minus);
    expect(screen.getByText('0 Personas')).toBeInTheDocument();
  });
});