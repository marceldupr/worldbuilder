import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastCounter = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = {
    id: `toast-${toastCounter++}`,
    message,
    type,
  };
  listeners.forEach((listener) => listener(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        // Start fade out animation
        setRemoving((prev) => new Set(prev).add(toast.id));
        // Remove after animation completes
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          setRemoving((prev) => {
            const next = new Set(prev);
            next.delete(toast.id);
            return next;
          });
        }, 300);
      }, 4000);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setRemoving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-3 pointer-events-none">
      {toasts.map((toast) => {
        const isRemoving = removing.has(toast.id);
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;
        
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center space-x-3 rounded-2xl px-5 py-4 shadow-2xl 
              backdrop-blur-sm transition-all duration-300 border
              ${isRemoving ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
              ${
                toast.type === 'success'
                  ? 'bg-green-600 border-green-400 text-white'
                  : toast.type === 'error'
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-blue-600 border-blue-400 text-white'
              }
            `}
            style={{
              animation: isRemoving ? 'none' : 'slideIn 0.3s ease-out'
            }}
          >
            <div className={`flex-shrink-0 p-1 rounded-lg ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(2rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

