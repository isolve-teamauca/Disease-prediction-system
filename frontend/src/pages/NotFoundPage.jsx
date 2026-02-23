import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <h1 className="font-heading text-6xl font-bold text-content/40">404</h1>
      <p className="text-content/70 mt-2">Page not found</p>
      <Link to="/" className="mt-6 text-primary font-medium hover:underline">Go to login</Link>
    </div>
  );
}
