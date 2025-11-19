import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { codeApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { 
  Code, Folder, FolderOpen, FileText, FileJson, FileCode, 
  Copy, Eye, EyeOff, Download, Sparkles, CheckCircle, Loader2,
  X, ChevronRight, TestTube2
} from 'lucide-react';

interface CodePreviewModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface FileTreeNode {
  name: string;
  path?: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  file?: GeneratedFile;
  isExpanded?: boolean;
}

export function CodePreviewModal({ projectId, projectName, onClose }: CodePreviewModalProps) {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [magicInProgress, setMagicInProgress] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [includeFrontend, setIncludeFrontend] = useState(true); // New: Frontend generation toggle

  useEffect(() => {
    loadPreview();
  }, [projectId, includeFrontend]); // Reload when frontend toggle changes

  async function loadPreview() {
    try {
      const result = await codeApi.preview(projectId, includeFrontend);
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

  async function handleAddFinalTouches() {
    setMagicInProgress(true);
    try {
      showToast('🔍 AI is reviewing your system...', 'info');
      
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
      showToast(`✨ System enhanced! ${data.completions} improvements applied`, 'success');
      
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
        `${import.meta.env.VITE_API_URL}/api/code/download/${projectId}?includeFrontend=${includeFrontend}`,
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
      // Use project name, sanitized for filename
      const sanitizedName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      a.download = `${sanitizedName}.zip`;
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

  function getFileIconComponent(path: string) {
    const className = "w-4 h-4";
    if (path.includes('.test.ts') || path.includes('.spec.ts')) return <TestTube2 className={`${className} text-purple-600`} />;
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return <FileCode className={`${className} text-blue-600`} />;
    if (path.endsWith('.js') || path.endsWith('.jsx')) return <FileCode className={`${className} text-yellow-600`} />;
    if (path.endsWith('.json')) return <FileJson className={`${className} text-green-600`} />;
    if (path.endsWith('.md')) return <FileText className={`${className} text-gray-600`} />;
    if (path.endsWith('.prisma')) return <FileCode className={`${className} text-indigo-600`} />;
    if (path === 'Dockerfile') return <FileCode className={`${className} text-cyan-600`} />;
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return <FileCode className={`${className} text-orange-600`} />;
    if (path === 'vitest.config.ts') return <FileCode className={`${className} text-green-600`} />;
    if (path.endsWith('.env') || path.includes('.env.')) return <FileText className={`${className} text-amber-600`} />;
    return <FileText className={`${className} text-gray-500`} />;
  }

  function getLanguage(path: string): string {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.prisma')) return 'prisma';
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
    if (path.endsWith('.md')) return 'markdown';
    return 'text';
  }

  function isTestFile(path: string): boolean {
    return path.includes('.test.ts') || path.includes('.spec.ts') || path.includes('__tests__') || path.includes('vitest.config');
  }

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  // No need for custom syntax highlighting - using react-syntax-highlighter

  function buildFileTree(files: GeneratedFile[]): FileTreeNode[] {
    const root: FileTreeNode = {
      name: 'root',
      isDirectory: true,
      children: [],
      isExpanded: true,
    };

    files.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLastPart = index === parts.length - 1;

        if (isLastPart) {
          // It's a file
          current.children!.push({
            name: part,
            path: file.path,
            isDirectory: false,
            file: file,
          });
        } else {
          // It's a directory
          let existingDir = current.children!.find(
            (child) => child.name === part && child.isDirectory
          );

          if (!existingDir) {
            existingDir = {
              name: part,
              path: currentPath,
              isDirectory: true,
              children: [],
              isExpanded: expandedFolders.has(currentPath),
            };
            current.children!.push(existingDir);
          }

          current = existingDir;
        }
      });
    });

    // Sort directories first, then files alphabetically
    function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
      return nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    function sortRecursive(node: FileTreeNode) {
      if (node.children) {
        node.children = sortNodes(node.children);
        node.children.forEach(sortRecursive);
      }
    }

    sortRecursive(root);
    return root.children!;
  }

  function renderFileTreeNode(node: FileTreeNode, level: number = 0): JSX.Element {
    const isExpanded = node.path ? expandedFolders.has(node.path) : true;
    const isSelected = selectedFile?.path === node.path;
    const isTest = node.file && isTestFile(node.file.path);

    if (node.isDirectory) {
      return (
        <div key={node.path || node.name}>
          <button
            onClick={() => node.path && toggleFolder(node.path)}
            className="flex w-full items-center space-x-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100 transition-colors group"
            style={{ paddingLeft: `${level * 12}px` }}
          >
            <ChevronRight 
              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-semibold text-gray-700 group-hover:text-gray-900">{node.name}</span>
            {node.children && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {node.children.length}
              </span>
            )}
          </button>
          {isExpanded && node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderFileTreeNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // File node
    return (
      <button
        key={node.path}
        onClick={() => node.file && setSelectedFile(node.file)}
        className={`flex w-full items-center space-x-2 rounded-lg px-2 py-2 text-left text-sm transition-all ${
          isSelected
            ? isTest
              ? 'bg-purple-100 text-purple-900 font-semibold shadow-sm'
              : 'bg-blue-100 text-blue-900 font-semibold shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        } ${isTest ? 'border-l-2 border-purple-400' : ''}`}
        style={{ paddingLeft: `${level * 12 + 24}px` }}
      >
        {getFileIconComponent(node.name)}
        <span className="truncate flex-1 text-sm">{node.name}</span>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
            <div className="text-lg font-bold text-gray-900">Generating code...</div>
          </div>
        </div>
      </div>
    );
  }

  const fileTree = buildFileTree(files);
  const testFileCount = files.filter(f => isTestFile(f.path)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <Code className="w-6 h-6" />
                </div>
                <span>Generated Code Preview</span>
              </h2>
              <div className="flex items-center space-x-4 mt-2 ml-14">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">{files.length} files</span>
                </div>
                {testFileCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <TestTube2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-semibold">{testFileCount} tests</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-300">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFrontend}
                      onChange={(e) => setIncludeFrontend(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 font-medium">Include Frontend</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!magicMode && (
                <button
                  onClick={handleAddFinalTouches}
                  disabled={magicInProgress}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 flex items-center space-x-2 transition-all hover:-translate-y-0.5"
                  title="AI reviews your system for coherence, adds missing logic, and ensures everything is wired together properly"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{magicInProgress ? 'Analyzing...' : 'Add Final Touches'}</span>
                </button>
              )}
              {magicMode && (
                <span className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-100 text-green-700 font-semibold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>System Verified!</span>
                </span>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 flex items-center space-x-2 transition-all hover:-translate-y-0.5"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{downloading ? 'Downloading...' : 'Download ZIP'}</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* File tree sidebar */}
          <div className="w-72 overflow-y-auto border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                    Project Files
                  </h3>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  {files.length}
                </span>
              </div>
            </div>
            
            <div className="p-3">
              {/* Test files summary */}
              {testFileCount > 0 && (
                <div className="mb-4 mx-1 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-purple-500 text-white">
                        <TestTube2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-purple-900 text-sm">
                        Test Suite
                      </span>
                    </div>
                    <span className="bg-purple-200 text-purple-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      {testFileCount}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-0.5">
                {fileTree.map((node) => renderFileTreeNode(node, 0))}
              </div>
            </div>
          </div>

          {/* Code viewer */}
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-900">
            {selectedFile ? (
              <>
                {/* File header */}
                <div className="border-b border-gray-700 bg-gray-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-700">
                      {getFileIconComponent(selectedFile.path)}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-gray-200 font-bold">
                        {selectedFile.path}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                        <span>{selectedFile.content.split('\n').length} lines</span>
                        <span>·</span>
                        <span className="uppercase font-semibold">{getLanguage(selectedFile.path)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-600 transition-all flex items-center space-x-1.5"
                    >
                      {showLineNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showLineNumbers ? 'Hide' : 'Show'} Lines</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedFile.content)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all flex items-center space-x-1.5 shadow-lg shadow-blue-500/30"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                
                {/* Code content with syntax highlighting */}
                <div className="flex-1 overflow-auto">
                  <SyntaxHighlighter
                    language={getLanguage(selectedFile.path)}
                    style={vscDarkPlus}
                    showLineNumbers={showLineNumbers}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                    }}
                    lineNumberStyle={{
                      minWidth: '3rem',
                      paddingRight: '1rem',
                      color: '#6b7280',
                      userSelect: 'none',
                    }}
                  >
                    {selectedFile.content}
                  </SyntaxHighlighter>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
                  <FileCode className="w-10 h-10 text-gray-600" />
                </div>
                <div className="text-lg font-bold text-gray-300">Select a file to view</div>
                <div className="text-sm text-gray-500 mt-2">
                  Choose a file from the tree to see its contents
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

