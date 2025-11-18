import { useState, useEffect } from 'react';
import { Group } from '../../stores/canvasStore';
import { Globe, FolderKanban, Settings, X, Lightbulb } from 'lucide-react';

interface GroupModalProps {
  existingGroup?: Group;
  position: { x: number; y: number };
  onClose: () => void;
  onSave: (group: Omit<Group, 'id'> | Group) => void;
}

const groupTypes = [
  { 
    value: 'system' as const, 
    label: 'System', 
    Icon: Globe,
    description: 'Global components like Auth, system-wide Enforcers',
    color: '#9333ea',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  { 
    value: 'feature' as const, 
    label: 'Feature', 
    Icon: FolderKanban,
    description: 'Business feature groups (e.g., Task Management, Documents)',
    color: '#3b82f6',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  { 
    value: 'infrastructure' as const, 
    label: 'Infrastructure', 
    Icon: Settings,
    description: 'Background workers, helpers, and utilities',
    color: '#6b7280',
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
];

export function GroupModal({ existingGroup, position, onClose, onSave }: GroupModalProps) {
  const [name, setName] = useState(existingGroup?.name || '');
  const [description, setDescription] = useState(existingGroup?.description || '');
  const [type, setType] = useState<'system' | 'feature' | 'infrastructure'>(
    existingGroup?.type || 'feature'
  );
  const [color, setColor] = useState(existingGroup?.color || '#3b82f6');

  useEffect(() => {
    // Update color when type changes
    const selectedType = groupTypes.find(t => t.value === type);
    if (selectedType) {
      setColor(selectedType.color);
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const groupData = {
      ...(existingGroup || {}),
      name: name.trim(),
      description: description.trim(),
      type,
      color,
      collapsed: existingGroup?.collapsed ?? false,
      nodeIds: existingGroup?.nodeIds || [],
      position: existingGroup?.position || position,
      dimensions: existingGroup?.dimensions,
    };

    onSave(groupData as Group);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] max-h-[700px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <FolderKanban className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {existingGroup ? 'Edit Group' : 'Create Group'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Organize your components into logical groups
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Task Management, Authentication, Background Jobs"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this group contains..."
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Group Type *
              </label>
              <div className="space-y-3">
                {groupTypes.map((groupType) => (
                  <label
                    key={groupType.value}
                    className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      type === groupType.value
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={groupType.value}
                      checked={type === groupType.value}
                      onChange={(e) => setType(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`${groupType.bgColor} p-2 rounded-lg`}>
                          <groupType.Icon className={`w-5 h-5 ${groupType.iconColor}`} />
                        </div>
                        <span className="font-bold text-gray-900">
                          {groupType.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {groupType.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    <strong>Tip:</strong> Groups help organize your canvas. You can drag components into groups 
                    and collapse them to keep your canvas tidy.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5"
            >
              {existingGroup ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

