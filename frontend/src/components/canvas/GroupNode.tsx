import { memo } from 'react';
import { Group } from '../../stores/canvasStore';
import { Edit, Trash2, ChevronRight } from 'lucide-react';

interface GroupNodeProps {
  group: Group;
  onToggleCollapse: (id: string) => void;
  onEdit: (group: Group) => void;
  onDelete: (id: string) => void;
}

const groupTypeColors = {
  system: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    headerBg: 'bg-purple-100',
    text: 'text-purple-900',
    badge: 'bg-purple-200 text-purple-800',
  },
  feature: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    headerBg: 'bg-blue-100',
    text: 'text-blue-900',
    badge: 'bg-blue-200 text-blue-800',
  },
  infrastructure: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    headerBg: 'bg-gray-100',
    text: 'text-gray-900',
    badge: 'bg-gray-200 text-gray-800',
  },
};

export const GroupNode = memo(({ group, onToggleCollapse, onEdit, onDelete }: GroupNodeProps) => {
  const colors = groupTypeColors[group.type];

  return (
    <div
      className={`${colors.bg} ${colors.border} border-2 rounded-lg shadow-lg overflow-hidden`}
      style={{
        position: 'absolute',
        left: group.position.x,
        top: group.position.y,
        minWidth: '300px',
        minHeight: group.collapsed ? '60px' : '200px',
        width: group.dimensions?.width || 400,
        height: group.collapsed ? '60px' : group.dimensions?.height || 300,
        zIndex: -1, // Behind nodes
      }}
    >
      {/* Header */}
      <div className={`${colors.headerBg} px-4 py-3 flex items-center justify-between border-b ${colors.border}`}>
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={() => onToggleCollapse(group.id)}
            className={`${colors.text} hover:opacity-70 transition-transform ${group.collapsed ? '' : 'rotate-90'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${colors.text}`}>{group.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                {group.type}
              </span>
            </div>
            {group.description && !group.collapsed && (
              <p className={`text-xs ${colors.text} opacity-70 mt-1`}>
                {group.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(group)}
            className={`${colors.text} hover:opacity-70 p-1 rounded hover:bg-white/50 transition-colors`}
            title="Edit group"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(group.id)}
            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body - drop zone for components */}
      {!group.collapsed && (
        <div className="p-4 h-full">
          <div className={`border-2 border-dashed ${colors.border} rounded-lg h-full flex items-center justify-center ${colors.text} opacity-50 text-sm`}>
            Drop components here
          </div>
        </div>
      )}

      {/* Badge showing number of components */}
      {!group.collapsed && group.nodeIds.length > 0 && (
        <div className="absolute bottom-2 right-2">
          <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
            {group.nodeIds.length} component{group.nodeIds.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

