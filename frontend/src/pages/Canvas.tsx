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
import { AuditorModal } from '../components/modals/AuditorModal';
import { EnforcerModal } from '../components/modals/EnforcerModal';
import { WorkflowModal } from '../components/modals/WorkflowModal';
import { CodePreviewModal } from '../components/modals/CodePreviewModal';
import { GitHubPushModal } from '../components/modals/GitHubPushModal';
import { RelationshipModal } from '../components/modals/RelationshipModal';
import { Toaster, showToast } from '../components/ui/toast';
import { KeyboardShortcutsHelp } from '../components/ui/KeyboardShortcutsHelp';
import { ComponentStats } from '../components/canvas/ComponentStats';
import { ComponentDetails } from '../components/canvas/ComponentDetails';
import { projectsApi, componentsApi } from '../lib/api';
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
  const [showAuditorModal, setShowAuditorModal] = useState(false);
  const [showEnforcerModal, setShowEnforcerModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showGitHubPush, setShowGitHubPush] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [pendingConnection, setPendingConnection] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
    (params: Connection | Edge) => {
      console.log('[Canvas] onConnect triggered!', params);
      // Find the source and target nodes
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      console.log('[Canvas] Source node:', sourceNode);
      console.log('[Canvas] Target node:', targetNode);

      if (sourceNode && targetNode) {
        console.log('[Canvas] Both nodes found, showing relationship modal');
        // Show relationship modal
        setPendingConnection({ params, sourceNode, targetNode });
        setShowRelationshipModal(true);
      } else {
        console.error('[Canvas] Missing nodes!', { sourceNode, targetNode });
      }
    },
    [nodes]
  );

  const handleRelationshipDefined = useCallback(
    async (relationship: any) => {
      if (!pendingConnection) return;

      const { params, sourceNode } = pendingConnection;

      try {
        console.log('[Relationship] Fetching component:', sourceNode.id);
        // Fetch the source component to get its current schema
        const component = await componentsApi.get(sourceNode.id);
        console.log('[Relationship] Component fetched:', component);
        
        // Add relationship to the schema
        const updatedSchema = {
          ...component.schema,
          relationships: [
            ...(component.schema.relationships || []),
            relationship,
          ],
        };
        console.log('[Relationship] Updated schema:', updatedSchema);

        // Update the component with new schema
        console.log('[Relationship] Updating component with new schema...');
        await componentsApi.update(sourceNode.id, { schema: updatedSchema });
        console.log('[Relationship] Component updated successfully');

        // Add the visual edge
        setEdges((eds: Edge[]) => 
          addEdge({
            ...params,
            label: relationship.fieldName,
            animated: true,
          }, eds)
        );

        showToast('Relationship added!', 'success');
      } catch (error: any) {
        console.error('[Relationship] Error:', error);
        showToast(error.message || 'Failed to add relationship', 'error');
      }

      setPendingConnection(null);
    },
    [pendingConnection, setEdges]
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
      } else if (type === 'auditor') {
        setShowAuditorModal(true);
      } else if (type === 'enforcer') {
        setShowEnforcerModal(true);
      } else if (type === 'workflow') {
        setShowWorkflowModal(true);
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
        locked: component.locked || false,
      },
    };
    addNode(newNode);
  };

  const handleNodeClick = useCallback(
    async (event: any, node: Node) => {
      // Check if it's a double-click to edit
      if (event.detail === 2) {
        try {
          // Fetch the component data
          const component = await componentsApi.get(node.id);
          setEditingComponent(component);
          
          // Open the appropriate modal based on type
          if (component.type === 'element') {
            setShowElementModal(true);
          } else if (component.type === 'manipulator') {
            setShowManipulatorModal(true);
          } else if (component.type === 'worker') {
            setShowWorkerModal(true);
          } else if (component.type === 'helper') {
            setShowHelperModal(true);
          } else if (component.type === 'auditor') {
            setShowAuditorModal(true);
          } else if (component.type === 'enforcer') {
            setShowEnforcerModal(true);
          } else if (component.type === 'workflow') {
            setShowWorkflowModal(true);
          }
        } catch (error: any) {
          showToast(error.message || 'Failed to load component', 'error');
        }
      } else {
        // Single click - show details
        setSelectedNodeId(node.id);
      }
    },
    []
  );

  const handleComponentUpdated = (component: any) => {
    // Update the node in the canvas
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === component.id
          ? {
              ...n,
              data: {
                ...n.data,
                label: component.name,
                description: component.description,
                status: component.status,
                locked: component.locked,
              },
            }
          : n
      )
    );
    setEditingComponent(null);
  };

  const closeEditModal = () => {
    setShowElementModal(false);
    setShowManipulatorModal(false);
    setShowWorkerModal(false);
    setShowHelperModal(false);
    setShowAuditorModal(false);
    setShowEnforcerModal(false);
    setShowWorkflowModal(false);
    setEditingComponent(null);
  };

  const handleDeleteNode = useCallback(async () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const confirmDelete = confirm(
      `Delete ${selectedNodes.length} component${selectedNodes.length > 1 ? 's' : ''}?\n\n` +
      `This will permanently delete:\n${selectedNodes.map(n => `• ${n.data.label}`).join('\n')}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Delete from backend
      for (const node of selectedNodes) {
        await componentsApi.delete(node.id);
      }

      // Remove from canvas
      setNodes((nds: Node[]) => nds.filter((n) => !n.selected));
      setEdges((eds: Edge[]) =>
        eds.filter((e) => !selectedNodes.some((n) => e.source === n.id || e.target === n.id))
      );

      showToast(`Deleted ${selectedNodes.length} component${selectedNodes.length > 1 ? 's' : ''}`, 'success');
      setSelectedNodeId(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete component', 'error');
    }
  }, [nodes, setNodes, setEdges]);

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
    {
      key: 'Delete',
      handler: handleDeleteNode,
      description: 'Delete selected component(s)',
    },
    {
      key: 'Backspace',
      handler: handleDeleteNode,
      description: 'Delete selected component(s)',
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
                {projectName || 'Loading...'}
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
              { name: 'Data API', icon: '🌐', color: 'bg-indigo-100', type: 'manipulator' },
              { name: 'Worker', icon: '⚙️', color: 'bg-purple-100', type: 'worker' },
              { name: 'Helper', icon: '🔧', color: 'bg-yellow-100', type: 'helper' },
              { name: 'Auditor', icon: '📋', color: 'bg-green-100', type: 'auditor' },
              { name: 'Enforcer', icon: '✅', color: 'bg-red-100', type: 'enforcer' },
              { name: 'Workflow', icon: '🔄', color: 'bg-pink-100', type: 'workflow' },
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
            onNodeClick={handleNodeClick}
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
        <aside className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
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

          {selectedNodeId && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Component Details
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      const node = nodes.find(n => n.id === selectedNodeId);
                      if (!node) return;
                      
                      const confirmDelete = confirm(`Delete ${node.data.label}?\n\nThis action cannot be undone.`);
                      if (!confirmDelete) return;

                      try {
                        await componentsApi.delete(selectedNodeId);
                        setNodes((nds: Node[]) => nds.filter((n) => n.id !== selectedNodeId));
                        setEdges((eds: Edge[]) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
                        showToast('Component deleted', 'success');
                        setSelectedNodeId(null);
                      } catch (error: any) {
                        showToast(error.message || 'Failed to delete', 'error');
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <ComponentDetails nodeId={selectedNodeId} nodes={nodes} />
              <p className="mt-3 text-xs text-gray-500 text-center">
                💡 Double-click to edit · Press Delete to remove
              </p>
            </div>
          )}
          
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
          existingComponent={editingComponent}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showManipulatorModal && projectId && (
        <ManipulatorModal
          projectId={projectId}
          position={dropPosition}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showWorkerModal && projectId && (
        <WorkerModal
          projectId={projectId}
          position={dropPosition}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showHelperModal && projectId && (
        <HelperModal
          projectId={projectId}
          position={dropPosition}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showAuditorModal && projectId && (
        <AuditorModal
          projectId={projectId}
          position={dropPosition}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showEnforcerModal && projectId && (
        <EnforcerModal
          projectId={projectId}
          position={dropPosition}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showWorkflowModal && projectId && (
        <WorkflowModal
          projectId={projectId}
          position={dropPosition}
          onClose={closeEditModal}
          onSuccess={editingComponent ? handleComponentUpdated : handleElementCreated}
        />
      )}

      {showRelationshipModal && pendingConnection && (
        <RelationshipModal
          sourceNode={pendingConnection.sourceNode}
          targetNode={pendingConnection.targetNode}
          onClose={() => {
            setShowRelationshipModal(false);
            setPendingConnection(null);
          }}
          onSuccess={handleRelationshipDefined}
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

