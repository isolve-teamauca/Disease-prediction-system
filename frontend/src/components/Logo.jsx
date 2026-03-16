export default function Logo({ className = 'w-14 h-14' }) {
  return (
    <div className={`rounded-full bg-primary flex items-center justify-center shrink-0 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
        <path d="M2 12h2l2-4 2 8 2-6 2 4h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 6v12M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
