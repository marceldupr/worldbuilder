import { useState } from 'react';
import { 
  Database, Globe, Settings, Wrench, Lock, ClipboardCheck, 
  CheckCircle, Workflow, LucideIcon, ChevronDown, ChevronRight
} from 'lucide-react';

interface ComponentStatsProps {
  components: Array<{ type: string; id: string; label: string }>;
  onSelectComponent?: (componentId: string) => void;
}

const componentTypes: Record<string, { 
  label: string; 
  Icon: LucideIcon; 
  color: string;
  bgColor: string;
}> = {
  element: { 
    label: 'Elements', 
    Icon: Database, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  manipulator: { 
    label: 'APIs', 
    Icon: Globe, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  worker: { 
    label: 'Workers', 
    Icon: Settings, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  helper: { 
    label: 'Helpers', 
    Icon: Wrench, 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  auth: { 
    label: 'Auth', 
    Icon: Lock, 
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  auditor: { 
    label: 'Auditors', 
    Icon: ClipboardCheck, 
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  enforcer: { 
    label: 'Enforcers', 
    Icon: CheckCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  workflow: { 
    label: 'Workflows', 
    Icon: Workflow, 
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
};

export function ComponentStats({ components, onSelectComponent }: ComponentStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  
  const stats = Object.keys(componentTypes).reduce((acc, type) => {
    acc[type] = components.filter((c) => c.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  const componentsByType = Object.keys(componentTypes).reduce((acc, type) => {
    acc[type] = components.filter((c) => c.type === type);
    return acc;
  }, {} as Record<string, Array<{ type: string; id: string; label: string }>>);

  const total = components.length;

  if (total === 0) return null;

  const toggleTypeExpanded = (type: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Component Summary
          </h4>
        </div>
        <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {total}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-5 pb-5 space-y-1 border-t border-gray-100">
        {Object.entries(componentTypes).map(([type, config]) => {
          const count = stats[type];
          if (count === 0) return null;
          const isTypeExpanded = expandedTypes.has(type);
          const componentsOfType = componentsByType[type] || [];
          
          return (
            <div key={type} className="rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTypeExpanded(type)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    {isTypeExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    <div className={`${config.bgColor} p-1.5 rounded-lg`}>
                      <config.Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{config.label}</span>
                </span>
                <span className={`font-bold text-sm ${config.color} px-2.5 py-1 rounded-full ${config.bgColor}`}>
                  {count}
                </span>
              </button>
              
              {isTypeExpanded && componentsOfType.length > 0 && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                  {componentsOfType.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => onSelectComponent?.(component.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 truncate">
                        {component.label}
                      </div>
                      <div className="text-xs font-mono text-gray-500 group-hover:text-blue-600 truncate">
                        ID: {component.id.slice(0, 8)}...
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

