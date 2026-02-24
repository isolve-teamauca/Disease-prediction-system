import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function InputField({ icon: Icon, label, type = 'text', placeholder, value, onChange, error, required, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full bg-input rounded-xl border border-gray-200 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
            Icon ? 'pl-10' : 'pl-3'
          } ${isPassword ? 'pr-10' : 'pr-3'} ${error ? 'border-red-500' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
