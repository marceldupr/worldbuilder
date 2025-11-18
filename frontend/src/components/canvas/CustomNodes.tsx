import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ComponentNodeData {
  label: string;
  type: 'element' | 'manipulator' | 'worker' | 'helper' | 'auditor' | 'enforcer' | 'workflow';
  status?: 'draft' | 'ready' | 'error';
  description?: string;
  locked?: boolean;
}

const nodeStyles = {
  element: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-900',
    icon: '🔷',
    displayName: 'Element',
  },
  manipulator: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-400',
    text: 'text-indigo-900',
    icon: '🌐',
    displayName: 'Data API',
  },
  worker: {
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    text: 'text-purple-900',
    icon: '⚙️',
    displayName: 'Worker',
  },
  helper: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-900',
    icon: '🔧',
    displayName: 'Helper',
  },
  auditor: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-900',
    icon: '📋',
    displayName: 'Auditor',
  },
  enforcer: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-900',
    icon: '✅',
    displayName: 'Enforcer',
  },
  workflow: {
    bg: 'bg-pink-50',
    border: 'border-pink-400',
    text: 'text-pink-900',
    icon: '🔄',
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

  return (
    <div
      className={`rounded-lg border-2 ${style.border} ${style.bg} ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } min-w-[200px] shadow-md transition-all hover:shadow-lg`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400"
      />

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{style.icon}</span>
            <div className={`h-2 w-2 rounded-full ${statusStyles[status]}`} />
            {data.locked && (
              <span className="text-purple-600" title="Tests Locked">🔒</span>
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

