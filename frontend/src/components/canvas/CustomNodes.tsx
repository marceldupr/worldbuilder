import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { createPortal } from 'react-dom';
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
  ring: string;
  glowColor: string;
  Icon: LucideIcon;
  displayName: string;
}> = {
  element: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-300/30',
    text: 'text-blue-700',
    accent: 'bg-blue-500',
    ring: 'ring-blue-400',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    Icon: Database,
    displayName: 'Element',
  },
  manipulator: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-300/30',
    text: 'text-indigo-700',
    accent: 'bg-indigo-500',
    ring: 'ring-indigo-400',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    Icon: Globe,
    displayName: 'Data API',
  },
  worker: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-300/30',
    text: 'text-purple-700',
    accent: 'bg-purple-500',
    ring: 'ring-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    Icon: Settings,
    displayName: 'Worker',
  },
  helper: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-300/30',
    text: 'text-yellow-700',
    accent: 'bg-yellow-500',
    ring: 'ring-yellow-400',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    Icon: Wrench,
    displayName: 'Helper',
  },
  auth: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-300/30',
    text: 'text-cyan-700',
    accent: 'bg-cyan-500',
    ring: 'ring-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    Icon: Lock,
    displayName: 'Auth',
  },
  auditor: {
    bg: 'bg-green-500/10',
    border: 'border-green-300/30',
    text: 'text-green-700',
    accent: 'bg-green-500',
    ring: 'ring-green-400',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    Icon: ClipboardCheck,
    displayName: 'Auditor',
  },
  enforcer: {
    bg: 'bg-red-500/10',
    border: 'border-red-300/30',
    text: 'text-red-700',
    accent: 'bg-red-500',
    ring: 'ring-red-400',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    Icon: CheckCircle,
    displayName: 'Enforcer',
  },
  workflow: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-300/30',
    text: 'text-pink-700',
    accent: 'bg-pink-500',
    ring: 'ring-pink-400',
    glowColor: 'rgba(236, 72, 153, 0.5)',
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Determine if this is a system-wide component
  const isSystemComponent = data.type === 'auth' || data.groupType === 'system' || data.isSystemWide;

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (data.description) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      {/* Tooltip rendered in portal */}
      {showTooltip && data.description && createPortal(
        <div 
          className="fixed pointer-events-none transition-opacity duration-200"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-xl text-white text-xs rounded-xl px-3 py-2 shadow-2xl border border-white/10 w-64">
            <p className="leading-relaxed">{data.description}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-r border-b border-white/10" />
          </div>
        </div>,
        document.body
      )}

      <div
        className={`rounded-2xl border-2 ${
          selected ? style.border.replace('/30', '') : style.border
        } ${style.bg} backdrop-blur-xl ${
          isSystemComponent && !selected ? 'ring-1 ring-purple-300/40' : ''
        } w-[180px] h-[100px] transition-all hover:shadow-lg relative flex flex-col overflow-hidden`}
        style={{
          boxShadow: selected 
            ? `0 0 0 2px white, 0 0 0 5px ${style.glowColor}, 0 0 20px ${style.glowColor}, 0 20px 60px rgba(0, 0, 0, 0.2)` 
            : '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
          transform: selected ? 'scale(1.08)' : 'scale(1)',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Accent line at top - brighter when selected */}
        <div className={`absolute top-0 left-0 right-0 h-[3px] ${style.accent} ${selected ? 'opacity-100 shadow-lg' : 'opacity-40'}`} />
        
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-400/80 !w-3 !h-3 !border-2 !border-white"
        />

        <div className="p-3 flex-1 flex flex-col backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <style.Icon className={`${selected ? 'w-5 h-5' : 'w-4 h-4'} ${style.text}`} strokeWidth={selected ? 2.5 : 2} />
              <div className={`${selected ? 'h-2 w-2' : 'h-1.5 w-1.5'} rounded-full ${statusStyles[status]} shadow-sm`} />
              {data.locked && (
                <Lock className={`${selected ? 'w-4 h-4' : 'w-3 h-3'} text-purple-600`} />
              )}
            </div>
            <span className={`rounded-lg ${selected ? 'bg-white/90' : 'bg-white/60'} backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-gray-600 border border-white/40 ${selected ? 'shadow-md' : ''}`}>
              {style.displayName}
            </span>
          </div>

          <h3 className={`font-bold ${style.text} truncate ${selected ? 'text-base' : 'text-sm'}`}>
            {data.label}
          </h3>
          
          <div className={`mt-auto text-[10px] truncate font-medium ${selected ? 'text-gray-700 font-bold' : 'text-gray-500'}`}>
            {data.groupName || '\u00A0'}
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-gray-400/80 !w-3 !h-3 !border-2 !border-white"
        />
      </div>
    </>
  );
});

ComponentNode.displayName = 'ComponentNode';

