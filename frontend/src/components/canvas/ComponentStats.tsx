import { 
  Database, Globe, Settings, Wrench, Lock, ClipboardCheck, 
  CheckCircle, Workflow, LucideIcon
} from 'lucide-react';

interface ComponentStatsProps {
  components: Array<{ type: string }>;
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

export function ComponentStats({ components }: ComponentStatsProps) {
  const stats = Object.keys(componentTypes).reduce((acc, type) => {
    acc[type] = components.filter((c) => c.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  const total = components.length;

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
      <h4 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">
        Component Summary
      </h4>
      <div className="space-y-2">
        {Object.entries(componentTypes).map(([type, config]) => {
          const count = stats[type];
          if (count === 0) return null;
          
          return (
            <div 
              key={type}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center space-x-3">
                <div className={`${config.bgColor} p-1.5 rounded-lg`}>
                  <config.Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{config.label}</span>
              </span>
              <span className={`font-bold text-sm ${config.color} px-2.5 py-1 rounded-full ${config.bgColor}`}>
                {count}
              </span>
            </div>
          );
        })}
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

