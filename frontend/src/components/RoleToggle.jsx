export default function RoleToggle({ value, onChange, disabled, showAdmin = false }) {
  return (
    <div className="flex rounded-full bg-input p-1 gap-0.5">
      <button
        type="button"
        onClick={() => onChange('patient')}
        disabled={disabled}
        className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
          value === 'patient'
            ? 'bg-white text-primary shadow-sm'
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
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Health Provider
      </button>
      {showAdmin && (
        <button
          type="button"
          onClick={() => onChange('admin')}
          disabled={disabled}
          className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
            value === 'admin'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Admin
        </button>
      )}
    </div>
  );
}
