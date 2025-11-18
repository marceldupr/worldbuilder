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
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
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
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId && !g.nodeIds.includes(nodeId)
          ? { ...g, nodeIds: [...g.nodeIds, nodeId] }
          : g
      ),
    }));
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
      
      if (project.canvasData) {
        set({
          nodes: project.canvasData.nodes || [],
          edges: project.canvasData.edges || [],
          groups: project.canvasData.groups || [],
          projectId,
        });
      } else {
        set({
          nodes: [],
          edges: [],
          groups: [],
          projectId,
        });
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

