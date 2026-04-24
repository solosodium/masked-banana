
import { AlertCircle } from 'lucide-react';

export const ErrorModal = ({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-panel border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-red-500 mb-2">
          <AlertCircle size={24} />
          <h2 className="text-xl font-bold text-zinc-100">Error</h2>
        </div>
        <p className="text-sm text-zinc-300 font-medium">{message}</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-colors shadow-lg border border-zinc-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
