import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Database, Globe, Settings, Wrench, Lock, ClipboardCheck, 
  CheckCircle, Workflow as WorkflowIcon, LucideIcon
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
  accent: string;
  Icon: LucideIcon;
  displayName: string;
}> = {
  element: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-300/30',
    text: 'text-blue-700',
    accent: 'bg-blue-500',
    Icon: Database,
    displayName: 'Element',
  },
  manipulator: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-300/30',
    text: 'text-indigo-700',
    accent: 'bg-indigo-500',
    Icon: Globe,
    displayName: 'Data API',
  },
  worker: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-300/30',
    text: 'text-purple-700',
    accent: 'bg-purple-500',
    Icon: Settings,
    displayName: 'Worker',
  },
  helper: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-300/30',
    text: 'text-yellow-700',
    accent: 'bg-yellow-500',
    Icon: Wrench,
    displayName: 'Helper',
  },
  auth: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-300/30',
    text: 'text-cyan-700',
    accent: 'bg-cyan-500',
    Icon: Lock,
    displayName: 'Auth',
  },
  auditor: {
    bg: 'bg-green-500/10',
    border: 'border-green-300/30',
    text: 'text-green-700',
    accent: 'bg-green-500',
    Icon: ClipboardCheck,
    displayName: 'Auditor',
  },
  enforcer: {
    bg: 'bg-red-500/10',
    border: 'border-red-300/30',
    text: 'text-red-700',
    accent: 'bg-red-500',
    Icon: CheckCircle,
    displayName: 'Enforcer',
  },
  workflow: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-300/30',
    text: 'text-pink-700',
    accent: 'bg-pink-500',
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

  return (
    <div className="group relative hover:z-[9999]">
      {/* Hover Tooltip */}
      {data.description && (
        <div className="invisible group-hover:visible absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64 pointer-events-none z-[10000]">
          <div className="bg-gray-900/95 backdrop-blur-xl text-white text-xs rounded-xl px-3 py-2 shadow-2xl border border-white/10">
            <p className="leading-relaxed">{data.description}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-r border-b border-white/10" />
          </div>
        </div>
      )}

      <div
        className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-xl ${
          selected ? 'ring-2 ring-blue-400/50 ring-offset-0' : ''
        } ${isSystemComponent ? 'ring-1 ring-purple-300/40' : ''} w-[180px] h-[100px] transition-all hover:shadow-lg relative flex flex-col overflow-hidden`}
        style={{
          background: selected 
            ? `linear-gradient(135deg, ${style.bg.replace('bg-', 'rgba(var(--tw-')})20%, rgba(255,255,255,0.9))`
            : undefined,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Subtle accent line at top */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${style.accent} opacity-40`} />
        
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-400/80 !w-3 !h-3 !border-2 !border-white"
        />

        <div className="p-3 flex-1 flex flex-col backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <style.Icon className={`w-4 h-4 ${style.text}`} strokeWidth={2} />
              <div className={`h-1.5 w-1.5 rounded-full ${statusStyles[status]} shadow-sm`} />
              {data.locked && (
                <Lock className="w-3 h-3 text-purple-600" />
              )}
            </div>
            <span className="rounded-lg bg-white/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-gray-600 border border-white/40">
              {style.displayName}
            </span>
          </div>

          <h3 className={`text-sm font-bold ${style.text} truncate`}>
            {data.label}
          </h3>
          
          <div className="mt-auto text-[10px] text-gray-500 truncate font-medium">
            {data.groupName || '\u00A0'}
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-gray-400/80 !w-3 !h-3 !border-2 !border-white"
        />
      </div>
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';

