export default function InputField({ icon: Icon, label, type = 'text', placeholder, value, onChange, error, required, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-content">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content/70">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full bg-input rounded-xl border border-secondary/50 py-2.5 pr-3 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
            Icon ? 'pl-10' : 'pl-3'
          } ${error ? 'border-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
