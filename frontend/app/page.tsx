import { Suspense } from 'react';
import ProductGrid from './components/ProductGrid';

// Un fallback de carga simple para mostrar mientras el componente principal se carga
function Loading() {
  return <h2>🌀 Loading...</h2>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductGrid />
    </Suspense>
  );
}
