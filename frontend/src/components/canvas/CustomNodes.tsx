import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Database, Globe, Settings, Wrench, Lock, ClipboardCheck, 
  CheckCircle, Workflow as WorkflowIcon, LucideIcon, Package, Layout
} from 'lucide-react';

interface ComponentNodeData {
  label: string;
  type: 'element' | 'manipulator' | 'worker' | 'helper' | 'auth' | 'auditor' | 'enforcer' | 'workflow';
  status?: 'draft' | 'ready' | 'error';
  description?: string;
  locked?: boolean;
  groupName?: string;
  groupType?: 'system' | 'feature' | 'infrastructure';
  isSystemWide?: boolean;
  linkedElement?: string; // For manipulators - element name
  linkedElementId?: string; // For manipulators - element UUID (from existing data)
  hasRedis?: boolean; // For workers - indicates queue mode vs direct mode
}

const nodeStyles: Record<string, {
  bg: string;
  border: string;
  text: string;
  Icon: LucideIcon;
  displayName: string;
}> = {
  element: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-900',
    Icon: Database,
    displayName: 'Element',
  },
  manipulator: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-400',
    text: 'text-indigo-900',
    Icon: Globe,
    displayName: 'Data API',
  },
  worker: {
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    text: 'text-purple-900',
    Icon: Settings,
    displayName: 'Worker',
  },
  helper: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-900',
    Icon: Wrench,
    displayName: 'Helper',
  },
  auth: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-400',
    text: 'text-cyan-900',
    Icon: Lock,
    displayName: 'Auth',
  },
  auditor: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-900',
    Icon: ClipboardCheck,
    displayName: 'Auditor',
  },
  enforcer: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-900',
    Icon: CheckCircle,
    displayName: 'Enforcer',
  },
  workflow: {
    bg: 'bg-pink-50',
    border: 'border-pink-400',
    text: 'text-pink-900',
    Icon: WorkflowIcon,
    displayName: 'Workflow',
  },
};

const statusStyles = {
  draft: 'bg-gray-400',
  ready: 'bg-green-500',
  error: 'bg-red-500',
};

export const ComponentNode = memo(({ data, selected }: NodeProps<ComponentNodeData>) => {
  const style = nodeStyles[data.type] || nodeStyles.element;
  const status = data.status || 'draft';
  
  // Determine if this is a system-wide component
  const isSystemComponent = data.type === 'auth' || data.groupType === 'system' || data.isSystemWide;
  
  // Check if this API will generate frontend UI
  // Works with: explicit linkedElement/linkedElementId OR inferred from name pattern (e.g., "Task API" → "Task")
  const inferredElement = data.type === 'manipulator' && data.label?.includes(' API') 
    ? data.label.replace(' API', '').trim() 
    : null;
  const generatesFrontend = data.type === 'manipulator' && (data.linkedElement || data.linkedElementId || inferredElement);
  
  // Check if this worker uses Redis queue (future enhancement)
  const usesQueue = data.type === 'worker' && data.hasRedis;

  return (
    <div
      className={`rounded-lg border-2 ${style.border} ${style.bg} ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${isSystemComponent ? 'ring-2 ring-purple-400 ring-opacity-50' : ''} min-w-[200px] shadow-md transition-all hover:shadow-lg relative`}
    >
      {/* Frontend UI indicator (top-right for APIs) */}
      {generatesFrontend && (
        <div 
          className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1 rounded-full shadow-xl font-bold flex items-center space-x-1.5 z-10 ring-2 ring-white"
          title="Frontend UI will be generated for this API"
        >
          <Layout className="w-4 h-4" />
          <span>UI</span>
        </div>
      )}

      {/* System-wide indicator */}
      {isSystemComponent && (
        <div className="absolute -top-3 -left-3 bg-purple-500 text-white text-xs px-2.5 py-1 rounded-full shadow-lg font-semibold flex items-center space-x-1 z-10 ring-2 ring-white">
          <Globe className="w-3 h-3" />
          <span>System</span>
        </div>
      )}

      {/* Group indicator (bottom-left) */}
      {data.groupName && (
        <div className={`absolute -bottom-2 -left-2 text-xs px-2 py-0.5 rounded-full shadow-md font-medium flex items-center space-x-1 ${
          data.groupType === 'system' ? 'bg-purple-500 text-white' :
          data.groupType === 'infrastructure' ? 'bg-gray-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <Package className="w-3 h-3" />
          <span>{data.groupName}</span>
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400"
      />

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <style.Icon className={`w-5 h-5 ${style.text}`} />
            <div className={`h-2 w-2 rounded-full ${statusStyles[status]}`} />
            {data.locked && (
              <Lock className="w-4 h-4 text-purple-600" />
            )}
          </div>
          <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
            {style.displayName || data.type}
          </span>
        </div>

        <h3 className={`text-sm font-semibold ${style.text}`}>
          {data.label}
        </h3>

        {data.description && (
          <p className="mt-1 text-xs text-gray-600 line-clamp-1">
            {data.description.length > 60 
              ? data.description.substring(0, 60) + '...' 
              : data.description
            }
          </p>
        )}

        {/* Inline indicators */}
        <div className="mt-2 flex items-center gap-1.5">
          {generatesFrontend && (
            <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-semibold">
              <Layout className="w-3 h-3" />
              <span>Admin UI</span>
            </div>
          )}
          {data.type === 'worker' && (
            <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-xs font-semibold">
              <Settings className="w-3 h-3" />
              <span>{usesQueue ? 'Queue' : 'Direct'}</span>
            </div>
          )}
          {(data.linkedElement || inferredElement) && (
            <div className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-medium">
              <Database className="w-3 h-3" />
              <span>{data.linkedElement || inferredElement}</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';

