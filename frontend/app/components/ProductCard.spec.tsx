import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock CartContext hook used by ProductCard
const addToCart = jest.fn();
jest.mock('../context/CartContext', () => ({
  __esModule: true,
  useCart: () => ({ addToCart }),
}));

import ProductCard from './ProductCard';

describe('ProductCard', () => {
  beforeEach(() => {
    addToCart.mockClear();
  });

  it('renderiza modelo, descripción y precio', () => {
    render(
      <ProductCard
        id={1}
        modelo="Camara X"
        descripcion="Descripcion"
        precio={123456}
        imagen="/x.png"
      />,
    );

    expect(screen.getByText('Camara X')).toBeInTheDocument();
    expect(screen.getByText('Descripcion')).toBeInTheDocument();
    expect(screen.getByText('$123.456')).toBeInTheDocument();
  });

  it('al hacer click en "Añadir al carrito" llama a addToCart', async () => {
    const user = userEvent.setup();

    render(
      <ProductCard
        id={2}
        modelo="Camara Y"
        descripcion="D2"
        precio={1000}
        imagen="/y.png"
      />,
    );

    await user.click(screen.getByRole('button', { name: /añadir al carrito/i }));

    expect(addToCart).toHaveBeenCalledWith({
      id: 2,
      modelo: 'Camara Y',
      descripcion: 'D2',
      precio: 1000,
      imagen: '/y.png',
    });
  });
});
