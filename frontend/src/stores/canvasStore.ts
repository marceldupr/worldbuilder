import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { projectsApi } from '../lib/api';

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  type: 'system' | 'feature' | 'infrastructure';
  collapsed: boolean;
  nodeIds: string[];
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
}

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  groups: Group[];
  projectId: string | null;
  
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setProjectId: (id: string) => void;
  
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, data: any) => void;
  
  addGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  toggleGroupCollapse: (id: string) => void;
  addNodeToGroup: (nodeId: string, groupId: string) => void;
  removeNodeFromGroup: (nodeId: string, groupId: string) => void;
  
  loadCanvas: (projectId: string) => Promise<void>;
  saveCanvas: () => Promise<void>;
  
  reset: () => void;
}

let saveTimeout: NodeJS.Timeout | null = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  groups: [],
  projectId: null,

  setNodes: (nodes) => {
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    }));
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  setEdges: (edges) => {
    set((state) => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    }));
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  setProjectId: (id) => set({ projectId: id }),

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  addGroup: (group) => {
    set((state) => ({
      groups: [...state.groups, group],
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  removeGroup: (id) => {
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  updateGroup: (id, updates) => {
    set((state) => {
      const group = state.groups.find(g => g.id === id);
      
      // If position is being updated and group has child nodes, move them too
      if (updates.position && group && group.nodeIds.length > 0) {
        const dx = updates.position.x - group.position.x;
        const dy = updates.position.y - group.position.y;
        
        return {
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
          nodes: state.nodes.map((n) =>
            group.nodeIds.includes(n.id)
              ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
              : n
          ),
        };
      }
      
      return {
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      };
    });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  toggleGroupCollapse: (id) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? { ...g, collapsed: !g.collapsed } : g
      ),
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  addNodeToGroup: (nodeId, groupId) => {
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group || group.nodeIds.includes(nodeId)) return state;
      
      // Add node to group
      const updatedGroups = state.groups.map((g) =>
        g.id === groupId ? { ...g, nodeIds: [...g.nodeIds, nodeId] } : g
      );
      
      // Calculate new group dimensions based on all nodes inside
      const groupNodes = state.nodes.filter(n => 
        [...group.nodeIds, nodeId].includes(n.id)
      );
      
      if (groupNodes.length > 0) {
        // Find bounding box of all nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        groupNodes.forEach(node => {
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + 220); // node width ~220px
          maxY = Math.max(maxY, node.position.y + 120); // node height ~120px
        });
        
        // Add padding
        const padding = 40;
        const newWidth = Math.max(400, maxX - minX + padding * 2);
        const newHeight = Math.max(300, maxY - minY + padding * 2);
        
        // Update group position to encompass all nodes
        const finalGroups = updatedGroups.map(g =>
          g.id === groupId
            ? {
                ...g,
                position: { x: minX - padding, y: minY - padding },
                dimensions: { width: newWidth, height: newHeight },
              }
            : g
        );
        
        return { groups: finalGroups };
      }
      
      return { groups: updatedGroups };
    });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  removeNodeFromGroup: (nodeId, groupId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, nodeIds: g.nodeIds.filter((id) => id !== nodeId) }
          : g
      ),
    }));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveCanvas(), 1000);
  },

  loadCanvas: async (projectId: string) => {
    try {
      const project = await projectsApi.get(projectId);
      
      // Load existing canvas data
      const canvasData = project.canvasData || { nodes: [], edges: [], groups: [] };
      
      // Get all components from the database
      const components = project.components || [];
      
      // Create a map of components by ID for easy lookup
      const componentMap = new Map(components.map((c: any) => [c.id, c]));
      
      // Create a map of existing node IDs
      const existingNodeIds = new Set(canvasData.nodes.map((n: Node) => n.id));
      
      // Update existing nodes with latest component data (including locked state)
      const updatedExistingNodes: Node[] = canvasData.nodes
        .filter((node: Node) => componentMap.has(node.id)) // Only keep nodes that still have components
        .map((node: Node) => {
          const component = componentMap.get(node.id);
          if (!component) return node;
          
          return {
            ...node,
            data: {
              ...node.data,
              label: (component as any).name,
              type: (component as any).type,
              status: (component as any).status,
              description: (component as any).description,
              locked: (component as any).locked || false, // Update locked state from DB
            },
          };
        });
      
      // Create nodes for any components that don't have nodes yet
      const missingComponentNodes: Node[] = components
        .filter((comp: any) => !existingNodeIds.has(comp.id))
        .map((comp: any) => ({
          id: comp.id,
          type: 'component',
          position: comp.position || { x: 100, y: 100 },
          data: {
            label: comp.name,
            type: comp.type,
            status: comp.status,
            description: comp.description,
            locked: comp.locked || false,
          },
        }));
      
      // Combine updated existing nodes with missing component nodes
      const allNodes = [...updatedExistingNodes, ...missingComponentNodes];
      
      set({
        nodes: allNodes,
        edges: canvasData.edges || [],
        groups: canvasData.groups || [],
        projectId,
      });
      
      // If we added missing nodes, save the canvas immediately
      if (missingComponentNodes.length > 0) {
        console.log(`[Canvas] Recovered ${missingComponentNodes.length} components without nodes`);
        // Save after a brief delay to ensure state is updated
        setTimeout(() => get().saveCanvas(), 100);
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  },

  saveCanvas: async () => {
    const { nodes, edges, groups, projectId } = get();
    
    if (!projectId) return;

    try {
      await projectsApi.update(projectId, {
        canvasData: { nodes, edges, groups },
      });
      console.log('Canvas saved');
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  },

  reset: () => set({ nodes: [], edges: [], groups: [], projectId: null }),
}));

