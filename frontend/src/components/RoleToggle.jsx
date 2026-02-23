export default function RoleToggle({ value, onChange, disabled }) {
  return (
    <div className="flex rounded-full bg-secondary/20 p-1 gap-0.5">
      <button
        type="button"
        onClick={() => onChange('patient')}
        disabled={disabled}
        className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
          value === 'patient'
            ? 'bg-light text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Patient
      </button>
      <button
        type="button"
        onClick={() => onChange('provider')}
        disabled={disabled}
        className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
          value === 'provider'
            ? 'bg-light text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Health Provider
      </button>
    </div>
  );
}
