interface StatusMessageProps {
  message: string | null;
  tone?: 'error' | 'info';
}

export function StatusMessage({ message, tone = 'error' }: StatusMessageProps) {
  if (!message) return null;

  const className =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-[#d8d3f8] bg-[#f4f2ff] text-[#2f20bf]';

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${className}`}>
      {message}
    </div>
  );
}
