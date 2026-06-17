interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  onChange: (value: string) => void;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  min,
  max,
  step,
  required = true,
  onChange,
}: FormFieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-800" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
