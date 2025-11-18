import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { projectsApi } from '../lib/api';

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  projectId: string | null;
  
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setProjectId: (id: string) => void;
  
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, data: any) => void;
  
  loadCanvas: (projectId: string) => Promise<void>;
  saveCanvas: () => Promise<void>;
  
  reset: () => void;
}

let saveTimeout: NodeJS.Timeout | null = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
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

  loadCanvas: async (projectId: string) => {
    try {
      const project = await projectsApi.get(projectId);
      
      if (project.canvasData) {
        set({
          nodes: project.canvasData.nodes || [],
          edges: project.canvasData.edges || [],
          projectId,
        });
      } else {
        set({
          nodes: [],
          edges: [],
          projectId,
        });
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  },

  saveCanvas: async () => {
    const { nodes, edges, projectId } = get();
    
    if (!projectId) return;

    try {
      await projectsApi.update(projectId, {
        canvasData: { nodes, edges },
      });
      console.log('Canvas saved');
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  },

  reset: () => set({ nodes: [], edges: [], projectId: null }),
}));

