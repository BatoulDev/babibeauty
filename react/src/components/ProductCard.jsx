// src/components/ProductCard.jsx
import { useQueryClient } from '@tanstack/react-query';
import { productKey, fetchProduct } from '../../data/products';
import { Link } from 'react-router-dom';

export default function ProductCard({ p }) {
  const qc = useQueryClient();

  const prefetch = () => qc.prefetchQuery({
    queryKey: productKey(p.id),
    queryFn: () => fetchProduct(p.id),
  });

  return (
    <Link
      to={`/products/${p.id}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      // (optional) intersection observer to prefetch when card becomes visible
    >
      {/* ...thumb, name, price... */}
    </Link>
  );
}
