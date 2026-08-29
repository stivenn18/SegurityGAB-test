import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

import { CartProvider } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CarritoPage from '../carrito/page';

describe('Cart flow (integration)', () => {
  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
  });

  it('añadir producto -> aparece en carrito, se puede cambiar cantidad y vaciar', async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <div>
          <ProductCard
            id={1}
            modelo="Camara X"
            descripcion="Desc"
            precio={1000}
            imagen="/x.png"
          />
          <CarritoPage />
        </div>
      </CartProvider>,
    );

    // Empty state
    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();

    // Add
    await user.click(screen.getByRole('button', { name: /añadir al carrito/i }));

    // Item appears
    expect(screen.getByRole('heading', { name: /mi carrito/i })).toBeInTheDocument();

    // The cart item has a remove button (unique to cart UI)
    const removeBtn = screen.getByRole('button', { name: '❌' });
    const itemRoot = removeBtn.closest('div');
    expect(itemRoot).toBeTruthy();

    expect(within(itemRoot as HTMLElement).getByText('Camara X')).toBeInTheDocument();
    expect(within(itemRoot as HTMLElement).getByText('Desc')).toBeInTheDocument();

    // Increase quantity
    await user.click(within(itemRoot as HTMLElement).getByRole('button', { name: '+' }));
    expect(within(itemRoot as HTMLElement).getByText('2')).toBeInTheDocument();

    // Decrease quantity
    await user.click(within(itemRoot as HTMLElement).getByRole('button', { name: '–' }));
    expect(within(itemRoot as HTMLElement).getByText('1')).toBeInTheDocument();

    // Clear cart
    await user.click(screen.getByRole('button', { name: /vaciar carrito/i }));
    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });
});
