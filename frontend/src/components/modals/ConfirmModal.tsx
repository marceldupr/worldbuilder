import { useState } from 'react';
import { AlertTriangle, X, Trash2, Loader2, Info } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  onClose?: () => void; // Optional: X button can have different behavior than cancel button
  variant?: 'danger' | 'warning' | 'info';
  details?: string[];
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  variant = 'danger',
  details,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    danger: {
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      button: 'bg-gradient-to-r from-red-600 to-red-500',
      buttonShadow: 'shadow-red-500/30 hover:shadow-red-500/40',
      border: 'border-red-200',
    },
    warning: {
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      button: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
      buttonShadow: 'shadow-yellow-500/30 hover:shadow-yellow-500/40',
      border: 'border-yellow-200',
    },
    info: {
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      button: 'bg-gradient-to-r from-blue-600 to-blue-500',
      buttonShadow: 'shadow-blue-500/30 hover:shadow-blue-500/40',
      border: 'border-blue-200',
    },
  };

  const color = colors[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${color.iconBg}`}>
              {variant === 'danger' && <Trash2 className={`w-6 h-6 ${color.icon}`} />}
              {variant === 'warning' && <AlertTriangle className={`w-6 h-6 ${color.icon}`} />}
              {variant === 'info' && <Info className={`w-6 h-6 ${color.icon}`} />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose || onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed mb-4">{message}</p>

          {details && details.length > 0 && (
            <div className={`rounded-xl border ${color.border} bg-gray-50 p-4`}>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                This will permanently delete:
              </p>
              <ul className="space-y-1">
                {details.map((detail, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center space-x-2">
                    <span className={color.icon}>•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {variant === 'danger' && (
            <p className="text-sm font-semibold text-gray-600 mt-4">
              This action cannot be undone.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl bg-white border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-xl ${color.button} px-5 py-2.5 text-sm font-semibold text-white shadow-lg ${color.buttonShadow} hover:shadow-xl disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {variant === 'danger' && <Trash2 className="w-4 h-4" />}
                {variant === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {variant === 'info' && <Info className="w-4 h-4" />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

