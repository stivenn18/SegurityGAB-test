import React, { PropsWithChildren } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

describe('CartContext', () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <CartProvider>{children}</CartProvider>
  );

  beforeEach(() => {
    localStorage.clear();
  });

  it('carga carrito desde localStorage al iniciar', async () => {
    localStorage.setItem(
      'cart',
      JSON.stringify([
        {
          id: 1,
          modelo: 'M1',
          descripcion: 'D',
          precio: 10,
          imagen: '/x.png',
          cantidad: 2,
        },
      ]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cart).toHaveLength(1);
    });

    expect(result.current.cart[0]).toMatchObject({ modelo: 'M1', cantidad: 2 });
  });

  it('addToCart agrega item nuevo y aumenta cantidad si ya existe', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        id: 1,
        modelo: 'M1',
        descripcion: 'D',
        precio: 10,
        imagen: '/x.png',
      });
    });

    await waitFor(() => expect(result.current.cart).toHaveLength(1));
    expect(result.current.cart[0].cantidad).toBe(1);

    act(() => {
      result.current.addToCart({
        id: 1,
        modelo: 'M1',
        descripcion: 'D',
        precio: 10,
        imagen: '/x.png',
      });
    });

    await waitFor(() => expect(result.current.cart[0].cantidad).toBe(2));
  });

  it('updateQuantity no permite cantidades menores a 1', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        id: 1,
        modelo: 'M1',
        descripcion: 'D',
        precio: 10,
        imagen: '/x.png',
      });
    });

    await waitFor(() => expect(result.current.cart).toHaveLength(1));

    act(() => {
      result.current.updateQuantity('M1', 0);
    });

    await waitFor(() => expect(result.current.cart[0].cantidad).toBe(1));
  });

  it('removeFromCart elimina el item', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        id: 1,
        modelo: 'M1',
        descripcion: 'D',
        precio: 10,
        imagen: '/x.png',
      });
    });

    await waitFor(() => expect(result.current.cart).toHaveLength(1));

    act(() => {
      result.current.removeFromCart('M1');
    });

    await waitFor(() => expect(result.current.cart).toHaveLength(0));
  });

  it('clearCart vacía el carrito y elimina localStorage', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        id: 1,
        modelo: 'M1',
        descripcion: 'D',
        precio: 10,
        imagen: '/x.png',
      });
    });

    await waitFor(() => expect(result.current.cart).toHaveLength(1));

    act(() => {
      result.current.clearCart();
    });

    await waitFor(() => expect(result.current.cart).toHaveLength(0));
    expect(localStorage.getItem('cart')).toBeNull();
  });
});
