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
import { GroupNode } from '../components/canvas/GroupNode';
import { GroupModal } from '../components/modals/GroupModal';
import { 
  ArrowLeft, Code, Github, Package, Edit, Database, Globe, 
  Settings, Wrench, Lock, ClipboardCheck, CheckCircle, Workflow as WorkflowIcon,
  FolderKanban, Trash2, Info
} from 'lucide-react';
import { ElementModal } from '../components/modals/ElementModal';
import { ManipulatorModal } from '../components/modals/ManipulatorModal';
import { WorkerModal } from '../components/modals/WorkerModal';
import { HelperModal } from '../components/modals/HelperModal';
import { AuditorModal } from '../components/modals/AuditorModal';
import { EnforcerModal } from '../components/modals/EnforcerModal';
import { WorkflowModal } from '../components/modals/WorkflowModal';
import { AuthModal } from '../components/modals/AuthModal';
import { CodePreviewModal } from '../components/modals/CodePreviewModal';
import { GitHubPushModal } from '../components/modals/GitHubPushModal';
import { RelationshipModal } from '../components/modals/RelationshipModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
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
  const { 
    nodes, 
    edges, 
    groups,
    setNodes, 
    setEdges, 
    loadCanvas, 
    addNode,
    addGroup,
    removeGroup,
    updateGroup,
    toggleGroupCollapse,
    addNodeToGroup,
    removeNodeFromGroup,
  } = useCanvasStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const [showElementModal, setShowElementModal] = useState(false);
  const [showManipulatorModal, setShowManipulatorModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [showAuditorModal, setShowAuditorModal] = useState(false);
  const [showEnforcerModal, setShowEnforcerModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showGitHubPush, setShowGitHubPush] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [pendingConnection, setPendingConnection] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());
  const [showAllTips, setShowAllTips] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'component' | 'group' | 'edge';
    id: string;
    name: string;
  } | null>(null);
  const [showGenerateDataModal, setShowGenerateDataModal] = useState<{
    componentId: string;
    componentName: string;
  } | null>(null);

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
      } else if (type === 'auth') {
        setShowAuthModal(true);
      }
    },
    [project]
  );

  const handleElementCreated = (component: any) => {
    const group = getNodeGroup(component.id);
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
        groupName: group?.name,
        groupType: group?.type,
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
          } else if (component.type === 'auth') {
            setShowAuthModal(true);
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
      nds.map((n) => {
        if (n.id === component.id) {
          const group = getNodeGroup(n.id);
          return {
            ...n,
            data: {
              ...n.data,
              label: component.name,
              description: component.description,
              status: component.status,
              locked: component.locked,
              groupName: group?.name,
              groupType: group?.type,
            },
          };
        }
        return n;
      })
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
    setShowAuthModal(false);
    setEditingComponent(null);
  };

  const handleDeleteNode = useCallback(async () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    // Show confirm modal instead of browser confirm
    setConfirmDelete({
      type: 'component',
      id: selectedNodes.map(n => n.id).join(','), // Store multiple IDs
      name: selectedNodes.length === 1 
        ? selectedNodes[0].data.label 
        : `${selectedNodes.length} components`
    });
  }, [nodes]);
  
  const executeDeleteComponent = async () => {
    if (!confirmDelete || confirmDelete.type !== 'component') return;
    
    const nodeIds = confirmDelete.id.split(',');
    const nodesToDelete = nodes.filter(n => nodeIds.includes(n.id));
    
    try {
      // Delete from backend
      for (const nodeId of nodeIds) {
        await componentsApi.delete(nodeId);
      }

      // Remove from canvas
      setNodes((nds: Node[]) => nds.filter((n) => !nodeIds.includes(n.id)));
      setEdges((eds: Edge[]) =>
        eds.filter((e) => !nodeIds.some(id => e.source === id || e.target === id))
      );

      showToast(`Deleted ${nodesToDelete.length} component${nodesToDelete.length > 1 ? 's' : ''}`, 'success');
      setSelectedNodeId(null);
      setConfirmDelete(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete component', 'error');
      setConfirmDelete(null);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'g',
      ctrl: true,
      handler: () => {
        if (nodes.length > 0) setShowCodePreview(true);
      },
      description: 'Generate code (Ctrl+G)',
    },
    {
      key: 's',
      ctrl: true,
      handler: () => {
        // Canvas auto-saves, just show feedback
        showToast('Canvas saved!', 'success');
      },
      description: 'Save (Ctrl+S)',
    },
    {
      key: 'Delete',
      handler: handleDeleteNode,
      description: 'Delete selected (Delete key)',
    },
  ]);

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleTip = (componentType: string) => {
    setExpandedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentType)) {
        newSet.delete(componentType);
      } else {
        newSet.add(componentType);
      }
      return newSet;
    });
  };

  const toggleAllTips = () => {
    if (showAllTips) {
      setExpandedTips(new Set());
      setShowAllTips(false);
    } else {
      setExpandedTips(new Set(['element', 'manipulator', 'worker', 'helper', 'auth', 'auditor', 'enforcer', 'workflow']));
      setShowAllTips(true);
    }
  };

  const componentTips = {
    element: {
      title: "Core Data Entity",
      tips: [
        "Start here for data models (Users, Posts, Products)",
        "Automatically generates database schema & API",
        "Add fields, relationships, and validation rules"
      ]
    },
    manipulator: {
      title: "REST API Endpoints",
      tips: [
        "Creates CRUD endpoints for your Elements",
        "Handles HTTP requests & responses",
        "Perfect for frontend/mobile app integration"
      ]
    },
    worker: {
      title: "Background Jobs",
      tips: [
        "Handle async tasks (emails, file processing)",
        "Runs independently from web requests",
        "Great for scheduled or long-running operations"
      ]
    },
    helper: {
      title: "Utility Functions",
      tips: [
        "Reusable logic shared across components",
        "Format data, calculations, validations",
        "Keep your code DRY and organized"
      ]
    },
    auth: {
      title: "Authentication",
      tips: [
        "User login, registration, and sessions",
        "JWT tokens and role-based access",
        "Secure your API endpoints"
      ]
    },
    auditor: {
      title: "Logging & Monitoring",
      tips: [
        "Track changes and user actions",
        "Generate audit trails for compliance",
        "Monitor system events and errors"
      ]
    },
    enforcer: {
      title: "Business Rules",
      tips: [
        "Validate data and enforce constraints",
        "Check permissions and business logic",
        "Ensure data integrity across your app"
      ]
    },
    workflow: {
      title: "Complex Processes",
      tips: [
        "Orchestrate multi-step operations",
        "Chain together multiple components",
        "Handle complex business workflows"
      ]
    }
  };

  const handleCreateGroup = () => {
    const centerPosition = project({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setDropPosition(centerPosition);
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleSaveGroup = (groupData: any) => {
    if (editingGroup) {
      updateGroup(editingGroup.id, groupData);
    } else {
      const newGroup = {
        id: `group-${Date.now()}`,
        ...groupData,
      };
      addGroup(newGroup);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setConfirmDelete({
      type: 'group',
      id: groupId,
      name: group.name
    });
  };
  
  const executeDeleteGroup = async () => {
    if (!confirmDelete || confirmDelete.type !== 'group') return;
    
    removeGroup(confirmDelete.id);
    showToast('Group deleted', 'success');
    setConfirmDelete(null);
  };

  // Check if a node is being dropped into a group
  const handleNodeDragStop = useCallback(
    (event: any, node: Node) => {
      const nodeRect = {
        x: node.position.x,
        y: node.position.y,
        width: 200, // approximate node width
        height: 100, // approximate node height
      };

      // Check if node is inside any group
      groups.forEach((group) => {
        if (group.collapsed) return;

        const groupRect = {
          x: group.position.x,
          y: group.position.y,
          width: group.dimensions?.width || 400,
          height: group.dimensions?.height || 300,
        };

        // Simple bounding box collision
        const isInside =
          nodeRect.x >= groupRect.x &&
          nodeRect.x + nodeRect.width <= groupRect.x + groupRect.width &&
          nodeRect.y >= groupRect.y &&
          nodeRect.y + nodeRect.height <= groupRect.y + groupRect.height;

        if (isInside && !group.nodeIds.includes(node.id)) {
          addNodeToGroup(node.id, group.id);
          // Update node data to show group badge
          setNodes((nds: Node[]) =>
            nds.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      groupName: group.name,
                      groupType: group.type,
                    },
                  }
                : n
            )
          );
          showToast(`Added to group "${group.name}"`, 'success');
        } else if (!isInside && group.nodeIds.includes(node.id)) {
          removeNodeFromGroup(node.id, group.id);
          // Remove group badge from node
          setNodes((nds: Node[]) =>
            nds.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      groupName: undefined,
                      groupType: undefined,
                    },
                  }
                : n
            )
          );
          showToast(`Removed from group "${group.name}"`, 'success');
        }
      });
    },
    [groups, addNodeToGroup, removeNodeFromGroup, setNodes]
  );

  // Get group for a node (if any)
  const getNodeGroup = (nodeId: string) => {
    return groups.find(g => g.nodeIds.includes(nodeId));
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/10">
      <Toaster />
      <KeyboardShortcutsHelp />
      
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {projectName || 'Loading...'}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xs font-semibold text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full">
              {nodes.length} components
            </div>
            <button
              onClick={() => setShowCodePreview(true)}
              disabled={nodes.length === 0}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <Code className="w-4 h-4" />
              <span>Generate Code</span>
            </button>
            <button
              onClick={() => setShowGitHubPush(true)}
              disabled={nodes.length === 0}
              className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-gray-900/30 hover:shadow-xl hover:shadow-gray-900/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <Github className="w-4 h-4" />
              <span>Push to GitHub</span>
            </button>
            <span className="text-sm font-medium text-gray-600 bg-gray-100/50 px-3 py-1.5 rounded-full">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all hover:shadow-md"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Component library sidebar */}
        <aside className="w-72 border-r border-gray-200/50 bg-gradient-to-b from-gray-50/80 to-white/80 backdrop-blur-sm p-4 overflow-y-auto h-full">
          {/* Create Group Button */}
          <div className="mb-5">
            <button
              onClick={handleCreateGroup}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 p-4 text-left shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center space-x-3 text-white">
                <FolderKanban className="w-6 h-6" />
                <span className="font-bold text-base">Create Group</span>
              </div>
              <p className="text-xs text-white/90 mt-2 font-medium">
                Organize your components
              </p>
            </button>
          </div>

          {/* Groups List */}
          {groups.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-1">
                Groups ({groups.length})
              </h4>
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {group.collapsed ? '▶' : '▼'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {group.nodeIds.length} items
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-600 hover:text-blue-700 ml-2 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Components
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Drag components to the canvas
              </p>
            </div>
            <button
              onClick={toggleAllTips}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-blue-200"
              title={showAllTips ? "Hide all tips" : "Show all tips"}
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showAllTips ? 'Hide' : 'Tips'}</span>
            </button>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Element', Icon: Database, color: 'bg-gradient-to-br from-blue-50 to-blue-100', iconColor: 'text-blue-600', ring: 'hover:ring-2 hover:ring-blue-400/50', type: 'element', accentColor: 'blue' },
              { name: 'Data API', Icon: Globe, color: 'bg-gradient-to-br from-indigo-50 to-indigo-100', iconColor: 'text-indigo-600', ring: 'hover:ring-2 hover:ring-indigo-400/50', type: 'manipulator', accentColor: 'indigo' },
              { name: 'Worker', Icon: Settings, color: 'bg-gradient-to-br from-purple-50 to-purple-100', iconColor: 'text-purple-600', ring: 'hover:ring-2 hover:ring-purple-400/50', type: 'worker', accentColor: 'purple' },
              { name: 'Helper', Icon: Wrench, color: 'bg-gradient-to-br from-yellow-50 to-yellow-100', iconColor: 'text-yellow-600', ring: 'hover:ring-2 hover:ring-yellow-400/50', type: 'helper', accentColor: 'yellow' },
              { name: 'Auth', Icon: Lock, color: 'bg-gradient-to-br from-cyan-50 to-cyan-100', iconColor: 'text-cyan-600', ring: 'hover:ring-2 hover:ring-cyan-400/50', type: 'auth', accentColor: 'cyan' },
              { name: 'Auditor', Icon: ClipboardCheck, color: 'bg-gradient-to-br from-green-50 to-green-100', iconColor: 'text-green-600', ring: 'hover:ring-2 hover:ring-green-400/50', type: 'auditor', accentColor: 'green' },
              { name: 'Enforcer', Icon: CheckCircle, color: 'bg-gradient-to-br from-red-50 to-red-100', iconColor: 'text-red-600', ring: 'hover:ring-2 hover:ring-red-400/50', type: 'enforcer', accentColor: 'red' },
              { name: 'Workflow', Icon: WorkflowIcon, color: 'bg-gradient-to-br from-pink-50 to-pink-100', iconColor: 'text-pink-600', ring: 'hover:ring-2 hover:ring-pink-400/50', type: 'workflow', accentColor: 'pink' },
            ].map((component) => {
              const tipData = componentTips[component.type as keyof typeof componentTips];
              const isExpanded = expandedTips.has(component.type);
              
              return (
                <div
                  key={component.name}
                  className={`${component.color} rounded-xl shadow-md transition-all border border-white/50 overflow-hidden ${!isExpanded && component.ring}`}
                >
                  <div
                    draggable={!isExpanded}
                    onDragStart={(e) => !isExpanded && onDragStart(e, component.type)}
                    className={`p-3 ${!isExpanded ? 'cursor-move hover:scale-105 active:scale-95' : 'cursor-default'} transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <component.Icon className={`w-5 h-5 ${component.iconColor}`} />
                        <span className="text-sm font-bold text-gray-900">
                          {component.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTip(component.type);
                        }}
                        className={`${component.iconColor} hover:bg-white/50 p-1 rounded-md transition-all`}
                        title={isExpanded ? "Hide tips" : "Show tips"}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && tipData && (
                    <div className="px-3 pb-3 pt-1 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <div className={`text-xs font-bold ${component.iconColor} border-t border-white/60 pt-2`}>
                        {tipData.title}
                      </div>
                      <ul className="space-y-1.5">
                        {tipData.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                            <span className={`${component.iconColor} mt-0.5 flex-shrink-0`}>•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-xs text-gray-500 italic pt-1 border-t border-white/40">
                        💡 Drag to canvas when ready
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
          {/* Render groups as background elements */}
          {groups.map((group) => (
            <GroupNode
              key={group.id}
              group={group}
              onToggleCollapse={toggleGroupCollapse}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
            />
          ))}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDragStop={handleNodeDragStop}
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
            <MiniMap 
              pannable 
              zoomable
              nodeStrokeWidth={3}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Properties panel */}
        <aside className="w-80 border-l border-gray-200/50 bg-gradient-to-b from-gray-50/80 to-white/80 backdrop-blur-sm p-5 overflow-y-auto h-full">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              Project Info
            </h3>
            
            {projectName && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base mb-1 truncate">{projectName}</h4>
                    <p className="text-xs text-gray-500 font-mono">ID: {projectId?.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ComponentStats components={nodes.map(n => ({ type: n.data.type }))} />

          {selectedNodeId && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Component Details
                </h3>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const node = nodes.find(n => n.id === selectedNodeId);
                      if (!node) return;
                      
                      setConfirmDelete({
                        type: 'component',
                        id: selectedNodeId,
                        name: node.data.label
                      });
                    }}
                    className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-gray-500 hover:text-gray-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
              <ComponentDetails 
                nodeId={selectedNodeId} 
                nodes={nodes} 
                onRequestGenerateData={(componentId, componentName) => {
                  setShowGenerateDataModal({ componentId, componentName });
                }}
              />
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700 font-medium">
                  Double-click to edit • Delete key to remove
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowCodePreview(true)}
                disabled={nodes.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4 text-left hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 transition-all group"
              >
                <div className="p-2 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                  <Code className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-blue-900">Generate Code</div>
                  <div className="text-xs text-blue-600">Preview & download</div>
                </div>
              </button>
              <button
                onClick={() => setShowGitHubPush(true)}
                disabled={nodes.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-4 text-left hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 transition-all group"
              >
                <div className="p-2 rounded-lg bg-gray-900 text-white group-hover:scale-110 transition-transform">
                  <Github className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Push to GitHub</div>
                  <div className="text-xs text-gray-600">Deploy your code</div>
                </div>
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

      {showAuthModal && projectId && (
        <AuthModal
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

      {showGroupModal && (
        <GroupModal
          existingGroup={editingGroup}
          position={dropPosition}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
          onSave={handleSaveGroup}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={
            confirmDelete.type === 'component' 
              ? `Delete ${confirmDelete.name}?`
              : `Delete Group "${confirmDelete.name}"?`
          }
          message={
            confirmDelete.type === 'component'
              ? 'This will permanently delete this component and all its connections.'
              : 'This will delete the group but keep all components inside. They will just be ungrouped.'
          }
          details={
            confirmDelete.type === 'component'
              ? confirmDelete.id.includes(',')
                ? confirmDelete.id.split(',').map(id => {
                    const node = nodes.find(n => n.id === id);
                    return node ? node.data.label : 'Unknown';
                  })
                : [confirmDelete.name]
              : undefined
          }
          confirmText="Delete"
          cancelText="Cancel"
          variant={confirmDelete.type === 'component' ? 'danger' : 'warning'}
          onConfirm={
            confirmDelete.type === 'component' 
              ? executeDeleteComponent
              : executeDeleteGroup
          }
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showGenerateDataModal && (
        <ConfirmModal
          title="Generate realistic test data with AI?"
          message={`AI will create sample data based on the ${showGenerateDataModal.componentName} schema for use in the generated tests.`}
          confirmText="Generate Test Data"
          cancelText="Lock without Test Data"
          variant="info"
          onConfirm={async () => {
            try {
              showToast('Generating test data with AI...', 'info');
              const { generateApi } = await import('../lib/api');
              const response = await generateApi.testData(showGenerateDataModal.componentId);
              showToast('Test data generated! ✨', 'success');
              
              const result = await componentsApi.lock(showGenerateDataModal.componentId);
              
              // Save test data to component schema
              const component = nodes.find(n => n.id === showGenerateDataModal.componentId);
              if (component && response.testData) {
                await componentsApi.update(showGenerateDataModal.componentId, {
                  schema: {
                    ...component.data.schema,
                    testData: response.testData,
                  },
                });
              }
              
              showToast(`${result.testCount} tests locked! 🔒`, 'success');
              setShowGenerateDataModal(null);
              await loadCanvas(projectId!);
            } catch (error: any) {
              showToast(error.message || 'Failed to generate test data', 'error');
              setShowGenerateDataModal(null);
            }
          }}
          onCancel={async () => {
            try {
              const result = await componentsApi.lock(showGenerateDataModal.componentId);
              showToast(`${result.testCount} tests locked! 🔒`, 'success');
              setShowGenerateDataModal(null);
              await loadCanvas(projectId!);
            } catch (error: any) {
              showToast(error.message || 'Failed to lock tests', 'error');
              setShowGenerateDataModal(null);
            }
          }}
          onClose={() => setShowGenerateDataModal(null)}
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

