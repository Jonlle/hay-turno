import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      data-testid="not-found-page"
    >
      <div className="text-center space-y-4 max-w-sm">
        <Search className="w-12 h-12 mx-auto text-gray-400" />
        <h1 className="text-xl font-bold">No encontramos esta barbería</h1>
        <p className="text-sm text-gray-500">
          El enlace puede ser incorrecto o la barbería ya no está activa.
        </p>
        <Link to="/" className="ht-btn-primary inline-block">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
