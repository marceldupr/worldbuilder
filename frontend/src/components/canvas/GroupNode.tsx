import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { Edit, Trash2, ChevronRight } from 'lucide-react';

const groupTypeColors = {
  system: {
    bg: 'bg-purple-50/30',
    border: 'border-purple-200/40',
    headerBg: 'bg-white/60',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
  feature: {
    bg: 'bg-blue-50/30',
    border: 'border-blue-200/40',
    headerBg: 'bg-white/60',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  infrastructure: {
    bg: 'bg-gray-50/30',
    border: 'border-gray-200/40',
    headerBg: 'bg-white/60',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-700',
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
      className={`${colors.bg} ${colors.border} border rounded-3xl backdrop-blur-2xl overflow-visible transition-all hover:shadow-xl group`}
      style={{
        minWidth: '300px',
        minHeight: group.collapsed ? '40px' : '200px',
        width: group.dimensions?.width || 400,
        height: group.collapsed ? '40px' : group.dimensions?.height || 300,
        pointerEvents: 'all',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Header */}
      <div 
        className={`${colors.headerBg} backdrop-blur-xl px-3 py-2 flex items-center justify-between cursor-move border-b border-white/20`}
        style={{
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <button
            onClick={() => onToggleCollapse(group.id)}
            className={`${colors.text} hover:opacity-70 transition-transform ${group.collapsed ? '' : 'rotate-90'} flex-shrink-0`}
          >
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`text-xs font-bold ${colors.text} truncate`}>{group.name}</h3>
              {group.nodeIds.length > 0 && (
                <span className={`text-[10px] font-semibold ${colors.text} opacity-50 flex-shrink-0 px-1.5 py-0.5 rounded-full bg-white/40 backdrop-blur-sm`}>
                  {group.nodeIds.length}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(group)}
            className={`${colors.text} opacity-60 hover:opacity-100 p-1.5 rounded-lg hover:bg-white/60 backdrop-blur-sm transition-all`}
            title="Edit group"
          >
            <Edit className="w-3 h-3" strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(group.id)}
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white/60 backdrop-blur-sm transition-all"
            title="Delete group"
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Body - subtle drop zone */}
      {!group.collapsed && (
        <div className="p-2 h-full backdrop-blur-sm">
          {/* Clean glass interior - components sit naturally inside */}
        </div>
      )}

      {/* Resize handles - subtle and elegant */}
      {!group.collapsed && (
        <>
          {/* Right edge */}
          <div
            className="nodrag absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 transition-colors opacity-0 group-hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{ zIndex: 10 }}
          />
          {/* Bottom edge */}
          <div
            className="nodrag absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-white/40 transition-colors opacity-0 group-hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{ zIndex: 10 }}
          />
          {/* Bottom-right corner */}
          <div
            className="nodrag absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize rounded-full bg-white/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-125"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{ zIndex: 11 }}
          />
        </>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

