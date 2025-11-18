import { useState, useEffect } from 'react';
import { codeApi } from '../../lib/api';
import { showToast } from '../ui/toast';

interface CodePreviewModalProps {
  projectId: string;
  onClose: () => void;
}

interface GeneratedFile {
  path: string;
  content: string;
}

export function CodePreviewModal({ projectId, onClose }: CodePreviewModalProps) {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [magicInProgress, setMagicInProgress] = useState(false);

  useEffect(() => {
    loadPreview();
  }, [projectId]);

  async function loadPreview() {
    try {
      const result = await codeApi.preview(projectId);
      setFiles(result.files);
      if (result.files.length > 0) {
        setSelectedFile(result.files[0]);
      }
      
      // Check if code has TODOs
      const hasTodos = result.files.some((f: GeneratedFile) => 
        f.content.includes('TODO:') || f.content.includes('// TODO')
      );
      setMagicMode(!hasTodos);
    } catch (error: any) {
      showToast(error.message || 'Failed to load code preview', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLetMagicHappen() {
    setMagicInProgress(true);
    try {
      showToast('🪄 AI is analyzing your project...', 'info');
      
      // Call AI finalization endpoint
      const result = await fetch(
        `${import.meta.env.VITE_API_URL}/api/code/finalize/${projectId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!result.ok) throw new Error('Finalization failed');

      const data = await result.json();
      showToast(`✨ Magic complete! Generated ${data.completions} implementations`, 'success');
      
      // Reload preview with finalized code
      await loadPreview();
    } catch (error: any) {
      showToast(error.message || 'Failed to finalize code', 'error');
    } finally {
      setMagicInProgress(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/code/download/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Code downloaded successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to download code', 'error');
    } finally {
      setDownloading(false);
    }
  }

  async function getToken() {
    const { supabase } = await import('../../lib/supabase');
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  }

  function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!', 'success');
  }

  function getFileIcon(path: string): string {
    if (path.includes('.test.ts') || path.includes('.spec.ts')) return '🧪';
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return '📘';
    if (path.endsWith('.json')) return '📋';
    if (path.endsWith('.md')) return '📄';
    if (path.endsWith('.prisma')) return '🗄️';
    if (path === 'Dockerfile') return '🐳';
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return '⚙️';
    if (path === 'vitest.config.ts') return '⚙️';
    return '📄';
  }

  function isTestFile(path: string): boolean {
    return path.includes('.test.ts') || path.includes('.spec.ts') || path.includes('__tests__') || path.includes('vitest.config');
  }

  function organizeFiles(files: GeneratedFile[]) {
    const tree: any = {};

    files.forEach((file) => {
      const parts = file.path.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          if (!current._files) current._files = [];
          current._files.push(file);
        } else {
          // It's a directory
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });

    return tree;
  }

  function renderFileTree(tree: any, level: number = 0): JSX.Element[] {
    const elements: JSX.Element[] = [];

    Object.keys(tree).forEach((key) => {
      if (key === '_files') {
        tree[key].forEach((file: GeneratedFile) => {
          elements.push(
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`flex w-full items-center space-x-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                selectedFile?.path === file.path 
                  ? isTestFile(file.path)
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              } ${isTestFile(file.path) ? 'border-l-2 border-purple-400' : ''}`}
              style={{ paddingLeft: `${(level + 1) * 16}px` }}
            >
              <span>{getFileIcon(file.path)}</span>
              <span className="truncate">{file.path.split('/').pop()}</span>
            </button>
          );
        });
      } else {
        elements.push(
          <div key={key} style={{ paddingLeft: `${level * 16}px` }}>
            <div className="flex items-center space-x-1 px-2 py-1 text-sm font-medium text-gray-600">
              <span>📁</span>
              <span>{key}</span>
            </div>
            {renderFileTree(tree[key], level + 1)}
          </div>
        );
      }
    });

    return elements;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mb-4 text-4xl">⚡</div>
            <div className="text-lg font-medium">Generating code...</div>
          </div>
        </div>
      </div>
    );
  }

  const fileTree = organizeFiles(files);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Generated Code Preview
              </h2>
              <p className="text-sm text-gray-600">{files.length} files generated</p>
            </div>
            <div className="flex items-center space-x-3">
              {!magicMode && (
                <button
                  onClick={handleLetMagicHappen}
                  disabled={magicInProgress}
                  className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>🪄</span>
                  <span>{magicInProgress ? 'AI Working...' : 'Let Magic Happen'}</span>
                </button>
              )}
              {magicMode && (
                <span className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                  <span>✨</span>
                  <span>Production Ready!</span>
                </span>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {downloading ? 'Downloading...' : '⬇️ Download ZIP'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* File tree sidebar */}
          <div className="w-64 overflow-y-auto border-r bg-gray-50 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Files ({files.length})
            </h3>
            
            {/* Test files summary */}
            {files.filter(f => isTestFile(f.path)).length > 0 && (
              <div className="mb-3 rounded-lg bg-purple-50 border border-purple-200 p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-purple-900">
                    🧪 Tests
                  </span>
                  <span className="text-purple-700">
                    {files.filter(f => isTestFile(f.path)).length} files
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-0.5">{renderFileTree(fileTree)}</div>
          </div>

          {/* Code viewer */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedFile ? (
              <>
                <div className="border-b bg-white px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(selectedFile.path)}</span>
                      <span className="font-mono text-sm text-gray-700">
                        {selectedFile.path}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedFile.content)}
                      className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-900 p-6">
                  <pre className="font-mono text-sm text-gray-100">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-gray-500">
                Select a file to view its contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

