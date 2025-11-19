import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { Edit, Trash2, ChevronRight } from 'lucide-react';

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

export const GroupNode = memo(({ data }: NodeProps) => {
  const { group, onToggleCollapse, onEdit, onDelete, onResize } = data;
  const colors = groupTypeColors[group.type as keyof typeof groupTypeColors];
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const { getZoom } = useReactFlow();

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = {
      width: group.dimensions?.width || 400,
      height: group.dimensions?.height || 300,
    };
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !onResize) return;

      const zoom = getZoom();
      const dx = (e.clientX - resizeStartPos.current.x) / zoom;
      const dy = (e.clientY - resizeStartPos.current.y) / zoom;

      let newWidth = resizeStartSize.current.width;
      let newHeight = resizeStartSize.current.height;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(300, resizeStartSize.current.width + dx);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(200, resizeStartSize.current.height + dy);
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.max(300, resizeStartSize.current.width - dx);
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.max(200, resizeStartSize.current.height - dy);
      }

      onResize(group.id, { width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = `${resizeDirection}-resize`;
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeDirection, onResize, group.id, getZoom]);

  return (
    <div
      className={`${colors.bg} ${colors.border} border-2 rounded-lg shadow-lg overflow-visible transition-shadow hover:shadow-xl`}
      style={{
        minWidth: '300px',
        minHeight: group.collapsed ? '60px' : '200px',
        width: group.dimensions?.width || 400,
        height: group.collapsed ? '60px' : group.dimensions?.height || 300,
        pointerEvents: 'all',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div 
        className={`${colors.headerBg} px-4 py-3 flex items-center justify-between border-b ${colors.border} cursor-move`}
      >
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

      {/* Resize handles */}
      {!group.collapsed && (
        <>
          {/* Right edge */}
          <div
            className="nodrag absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-400/30 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{ zIndex: 10 }}
          />
          {/* Bottom edge */}
          <div
            className="nodrag absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize hover:bg-blue-400/30 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{ zIndex: 10 }}
          />
          {/* Bottom-right corner */}
          <div
            className="nodrag absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-500/50 transition-colors rounded-tl"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{ zIndex: 11 }}
          />
        </>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

