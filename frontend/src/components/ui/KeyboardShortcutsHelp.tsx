import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['Cmd/Ctrl', 'S'], action: 'Save project' },
  { keys: ['Cmd/Ctrl', 'G'], action: 'Generate code' },
  { keys: ['Cmd/Ctrl', 'K'], action: 'Open command palette' },
  { keys: ['Delete'], action: 'Delete selected component' },
  { keys: ['Cmd/Ctrl', 'Z'], action: 'Undo' },
  { keys: ['Cmd/Ctrl', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['?'], action: 'Show keyboard shortcuts' },
  { keys: ['Esc'], action: 'Close modal/deselect' },
  { keys: ['Space'], action: 'Pan canvas (hold and drag)' },
  { keys: ['+'], action: 'Zoom in' },
  { keys: ['-'], action: 'Zoom out' },
  { keys: ['0'], action: 'Reset zoom' },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for '?' key
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700"
        title="Keyboard shortcuts (?)"
      >
        ⌨️
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm text-gray-700">{shortcut.action}</span>
              <div className="flex items-center space-x-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Press <kbd className="rounded bg-white px-2 py-1 text-xs font-semibold">?</kbd> anytime to show this help.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

