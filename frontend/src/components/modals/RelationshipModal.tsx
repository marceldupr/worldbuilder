import { useState } from 'react';
import { showToast } from '../ui/toast';
import { Link2, X, Check, Database } from 'lucide-react';

interface RelationshipModalProps {
  sourceNode: any;
  targetNode: any;
  onClose: () => void;
  onSuccess: (relationship: any) => void;
}

const relationshipTypes = [
  {
    value: 'hasOne',
    label: 'has one',
    example: 'Task has one Owner',
    description: 'One-to-one relationship',
  },
  {
    value: 'hasMany',
    label: 'has many',
    example: 'Owner has many Tasks',
    description: 'One-to-many relationship',
  },
  {
    value: 'belongsTo',
    label: 'belongs to',
    example: 'Task belongs to Owner',
    description: 'Inverse of has-one/has-many',
  },
  {
    value: 'manyToMany',
    label: 'many-to-many',
    example: 'Task has many Tags, Tag has many Tasks',
    description: 'Many-to-many relationship (requires join table)',
  },
];

export function RelationshipModal({
  sourceNode,
  targetNode,
  onClose,
  onSuccess,
}: RelationshipModalProps) {
  const [relationshipType, setRelationshipType] = useState('belongsTo');
  const [fieldName, setFieldName] = useState('');
  const [required, setRequired] = useState(false);

  const handleSave = () => {
    if (!fieldName.trim()) {
      showToast('Please provide a field name', 'error');
      return;
    }

    const relationship = {
      type: relationshipType,
      from: sourceNode.data.label,
      to: targetNode.data.label,
      fieldName: fieldName.trim(),
      required,
    };

    onSuccess(relationship);
    showToast('Relationship defined!', 'success');
    onClose();
  };

  const selectedType = relationshipTypes.find((t) => t.value === relationshipType);
  const suggestedFieldName = relationshipType === 'hasMany' 
    ? targetNode.data.label.toLowerCase() + 's'
    : targetNode.data.label.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-3xl h-[90vh] max-h-[800px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <Link2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Define Relationship 🔗
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Define how <span className="font-semibold">{sourceNode.data.label}</span> relates to{' '}
                  <span className="font-semibold">{targetNode.data.label}</span>
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
          <div className="space-y-6">
            {/* Visual Relationship Display */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-blue-200">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div className="mt-2 text-sm font-bold text-gray-900">{sourceNode.data.label}</div>
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xl font-bold text-blue-900">
                    {selectedType?.label || 'relates to'}
                  </div>
                  <div className="mt-1 text-sm text-blue-700 font-medium">{selectedType?.description}</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm border border-blue-200">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div className="mt-2 text-sm font-bold text-gray-900">{targetNode.data.label}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relationship Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Relationship Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {relationshipTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setRelationshipType(type.value);
                      if (!fieldName) {
                        setFieldName(
                          type.value === 'hasMany'
                            ? targetNode.data.label.toLowerCase() + 's'
                            : targetNode.data.label.toLowerCase()
                        );
                      }
                    }}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      relationshipType === type.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-bold text-gray-900 text-sm">{type.label}</div>
                    <div className="mt-1 text-xs text-gray-600">{type.description}</div>
                    <div className="mt-2 rounded-lg bg-gray-100 p-2 text-xs text-gray-700 font-medium">
                      {type.example.replace('Task', sourceNode.data.label).replace('Owner', targetNode.data.label)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Field Name
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (The property name in {sourceNode.data.label})
                </span>
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder={suggestedFieldName}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="mt-2 text-xs text-gray-500">
                Example: "<span className="font-semibold">{fieldName || suggestedFieldName}</span>" or "<span className="font-semibold">{(fieldName || suggestedFieldName) + 'Id'}</span>"
              </p>
            </div>

            {/* Required Checkbox */}
            <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <input
                type="checkbox"
                id="required"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">
                This relationship is required (NOT NULL)
              </label>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-bold text-gray-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                <span>Preview:</span>
              </h4>
              <code className="block rounded-lg bg-white p-4 text-sm text-gray-800 border border-gray-200 font-mono">
                {sourceNode.data.label}.{fieldName || suggestedFieldName}
                {relationshipType === 'hasMany' ? '[]' : ''}
                {': '}
                {relationshipType === 'hasMany' ? `${targetNode.data.label}[]` : targetNode.data.label}
                {required ? '' : ' | null'}
              </code>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-5">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="rounded-xl bg-white border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Define Relationship</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

