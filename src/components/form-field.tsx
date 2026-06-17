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
    <label className="block text-sm font-semibold text-[#101828]" htmlFor={name}>
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
        className="mt-2 h-12 w-full rounded-lg border border-[#d0d5dd] bg-[#fbfcff] px-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#3f2bd8] focus:bg-white focus:ring-4 focus:ring-[#ebe8ff]"
      />
    </label>
  );
}
