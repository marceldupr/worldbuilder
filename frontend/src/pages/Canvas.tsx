import { useCallback, useEffect, useState, useRef, DragEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuthStore } from '../stores/authStore';
import { useCanvasStore } from '../stores/canvasStore';
import { ComponentNode } from '../components/canvas/CustomNodes';
import { ElementModal } from '../components/modals/ElementModal';
import { ManipulatorModal } from '../components/modals/ManipulatorModal';
import { WorkerModal } from '../components/modals/WorkerModal';
import { HelperModal } from '../components/modals/HelperModal';
import { CodePreviewModal } from '../components/modals/CodePreviewModal';
import { GitHubPushModal } from '../components/modals/GitHubPushModal';
import { Toaster, showToast } from '../components/ui/toast';
import { KeyboardShortcutsHelp } from '../components/ui/KeyboardShortcutsHelp';
import { ComponentStats } from '../components/canvas/ComponentStats';
import { projectsApi } from '../lib/api';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const nodeTypes = {
  component: ComponentNode,
};

function CanvasContent() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { nodes, edges, setNodes, setEdges, loadCanvas, addNode } = useCanvasStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const [showElementModal, setShowElementModal] = useState(false);
  const [showManipulatorModal, setShowManipulatorModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showGitHubPush, setShowGitHubPush] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (projectId) {
      loadCanvas(projectId);
      loadProjectName();
    }
  }, [projectId, loadCanvas]);

  async function loadProjectName() {
    try {
      const project = await projectsApi.get(projectId!);
      setProjectName(project.name);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  }

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds: Node[]) => {
        // Apply changes to nodes
        return changes.reduce((acc: Node[], change: any) => {
          if (change.type === 'remove') {
            return acc.filter((n) => n.id !== change.id);
          } else if (change.type === 'position' && change.position) {
            return acc.map((n) =>
              n.id === change.id
                ? { ...n, position: change.position, positionAbsolute: change.positionAbsolute }
                : n
            );
          } else if (change.type === 'select') {
            return acc.map((n) =>
              n.id === change.id ? { ...n, selected: change.selected } : n
            );
          }
          return acc;
        }, nds);
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds: Edge[]) => {
        return changes.reduce((acc: Edge[], change: any) => {
          if (change.type === 'remove') {
            return acc.filter((e) => e.id !== change.id);
          } else if (change.type === 'select') {
            return acc.map((e) =>
              e.id === change.id ? { ...e, selected: change.selected } : e
            );
          }
          return acc;
        }, eds);
      });
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      setDropPosition(position);

      if (type === 'element') {
        setShowElementModal(true);
      } else if (type === 'manipulator') {
        setShowManipulatorModal(true);
      } else if (type === 'worker') {
        setShowWorkerModal(true);
      } else if (type === 'helper') {
        setShowHelperModal(true);
      }
    },
    [project]
  );

  const handleElementCreated = (component: any) => {
    const newNode: Node = {
      id: component.id,
      type: 'component',
      position: dropPosition,
      data: {
        label: component.name,
        type: component.type,
        status: component.status,
        description: component.description,
      },
    };
    addNode(newNode);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'g',
      ctrl: true,
      handler: () => {
        if (nodes.length > 0) setShowCodePreview(true);
      },
      description: 'Generate code',
    },
    {
      key: 's',
      ctrl: true,
      handler: () => {
        // Canvas auto-saves, just show feedback
        showToast('Canvas saved!', 'success');
      },
      description: 'Save',
    },
  ]);

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex h-screen flex-col">
      <Toaster />
      <KeyboardShortcutsHelp />
      
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🌍</div>
              <h1 className="text-xl font-bold text-gray-900">
                Project {projectId}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-500">
              {nodes.length} components
            </div>
            <button
              onClick={() => setShowCodePreview(true)}
              disabled={nodes.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              💻 Generate Code
            </button>
            <button
              onClick={() => setShowGitHubPush(true)}
              disabled={nodes.length === 0}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
            >
              🐙 Push to GitHub
            </button>
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex flex-1">
        {/* Component library sidebar */}
        <aside className="w-64 border-r bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Components
          </h3>
          <p className="mb-3 text-xs text-gray-600">
            Drag components to the canvas
          </p>
          <div className="space-y-2">
            {[
              { name: 'Element', icon: '🔷', color: 'bg-blue-100', type: 'element' },
              { name: 'Manipulator', icon: '🌐', color: 'bg-indigo-100', type: 'manipulator' },
              { name: 'Worker', icon: '⚙️', color: 'bg-purple-100', type: 'worker' },
              { name: 'Helper', icon: '🔧', color: 'bg-yellow-100', type: 'helper' },
              { name: 'Auditor', icon: '📋', color: 'bg-green-100', type: 'auditor' },
              { name: 'Enforcer', icon: '✅', color: 'bg-red-100', type: 'enforcer' },
            ].map((component) => (
              <div
                key={component.name}
                draggable
                onDragStart={(e) => onDragStart(e, component.type)}
                className={`${component.color} cursor-move rounded-lg p-3 shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{component.icon}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {component.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Properties panel */}
        <aside className="w-80 border-l bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Project Info
          </h3>
          
          {projectName && (
            <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
              <h4 className="mb-1 font-semibold text-gray-900">{projectName}</h4>
              <p className="text-xs text-gray-500">Project ID: {projectId?.slice(0, 8)}...</p>
            </div>
          )}

          <ComponentStats components={nodes.map(n => ({ type: n.data.type }))} />
          
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowCodePreview(true)}
                disabled={nodes.length === 0}
                className="w-full rounded-lg bg-blue-50 p-3 text-left text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                💻 Generate Code
              </button>
              <button
                onClick={() => setShowGitHubPush(true)}
                disabled={nodes.length === 0}
                className="w-full rounded-lg bg-gray-50 p-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                🐙 Push to GitHub
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {showElementModal && projectId && (
        <ElementModal
          projectId={projectId}
          position={dropPosition}
          onClose={() => setShowElementModal(false)}
          onSuccess={handleElementCreated}
        />
      )}

      {showManipulatorModal && projectId && (
        <ManipulatorModal
          projectId={projectId}
          position={dropPosition}
          onClose={() => setShowManipulatorModal(false)}
          onSuccess={handleElementCreated}
        />
      )}

      {showWorkerModal && projectId && (
        <WorkerModal
          projectId={projectId}
          position={dropPosition}
          onClose={() => setShowWorkerModal(false)}
          onSuccess={handleElementCreated}
        />
      )}

      {showHelperModal && projectId && (
        <HelperModal
          projectId={projectId}
          position={dropPosition}
          onClose={() => setShowHelperModal(false)}
          onSuccess={handleElementCreated}
        />
      )}
      
      {showCodePreview && projectId && (
        <CodePreviewModal
          projectId={projectId}
          onClose={() => setShowCodePreview(false)}
        />
      )}

      {showGitHubPush && projectId && (
        <GitHubPushModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowGitHubPush(false)}
        />
      )}
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}

