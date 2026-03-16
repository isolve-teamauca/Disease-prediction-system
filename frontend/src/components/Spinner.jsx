/**
 * Consistent loading spinner for API requests. Matches red/white medical theme.
 * @param {string} className - Optional Tailwind classes (e.g. size, margin)
 */
export default function Spinner({ className = 'h-6 w-6' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
