interface StatusMessageProps {
  message: string | null;
  tone?: 'error' | 'info';
}

export function StatusMessage({ message, tone = 'error' }: StatusMessageProps) {
  if (!message) return null;

  const className =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${className}`}>
      {message}
    </div>
  );
}
