import { useEffect } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

/**
 * Check if user is currently typing in an input field
 */
function isTyping(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  
  const tagName = activeElement.tagName.toLowerCase();
  const isEditable = activeElement.getAttribute('contenteditable') === 'true';
  const isInput = activeElement.getAttribute('type') === 'text' || 
                  activeElement.getAttribute('type') === 'email' ||
                  activeElement.getAttribute('type') === 'password' ||
                  activeElement.getAttribute('type') === 'search';
  
  return (
    tagName === 'input' && isInput ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isEditable
  );
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts while user is typing
      // EXCEPT for Ctrl/Cmd shortcuts (they're safe)
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (isTyping() && !hasModifier) {
        return;
      }

      for (const shortcut of shortcuts) {
        // Only check modifiers that are explicitly set
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // If shortcut requires ctrl but user didn't press it, skip
        if (shortcut.ctrl && !event.ctrlKey && !event.metaKey) continue;
        // If shortcut doesn't want ctrl but user pressed it, skip
        if (!shortcut.ctrl && (event.ctrlKey || event.metaKey)) continue;

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export const COMMON_SHORTCUTS = {
  save: { key: 's', ctrl: true, description: 'Save (Ctrl+S)' },
  generate: { key: 'g', ctrl: true, description: 'Generate Code (Ctrl+G)' },
  undo: { key: 'z', ctrl: true, description: 'Undo (Ctrl+Z)' },
  redo: { key: 'z', ctrl: true, shift: true, description: 'Redo (Ctrl+Shift+Z)' },
  delete: { key: 'Delete', description: 'Delete selected (Delete)' },
  selectAll: { key: 'a', ctrl: true, description: 'Select all (Ctrl+A)' },
  copy: { key: 'c', ctrl: true, description: 'Copy (Ctrl+C)' },
  paste: { key: 'v', ctrl: true, description: 'Paste (Ctrl+V)' },
  help: { key: '?', description: 'Show help (?)' },
};

