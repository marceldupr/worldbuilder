import { useState } from 'react';
import { showToast } from '../ui/toast';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Define Relationship 🔗
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Define how <span className="font-semibold">{sourceNode.data.label}</span> relates to{' '}
            <span className="font-semibold">{targetNode.data.label}</span>
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-center">
                <div className="text-2xl">🔷</div>
                <div className="mt-1 text-xs font-semibold">{sourceNode.data.label}</div>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-blue-900">
                {selectedType?.label || 'relates to'}
              </div>
              <div className="mt-1 text-xs text-blue-700">{selectedType?.description}</div>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-center">
                <div className="text-2xl">🔷</div>
                <div className="mt-1 text-xs font-semibold">{targetNode.data.label}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relationship Type
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
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
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    relationshipType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{type.label}</div>
                  <div className="mt-1 text-xs text-gray-600">{type.description}</div>
                  <div className="mt-2 rounded bg-gray-100 p-2 text-xs text-gray-700">
                    {type.example.replace('Task', sourceNode.data.label).replace('Owner', targetNode.data.label)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Field Name
              <span className="ml-2 text-xs text-gray-500">
                (The property name in {sourceNode.data.label})
              </span>
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder={suggestedFieldName}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Example: "{fieldName || suggestedFieldName}" or "{(fieldName || suggestedFieldName) + 'Id'}"
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="required" className="ml-2 text-sm text-gray-700">
              This relationship is required (NOT NULL)
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Preview:</h4>
          <code className="block rounded bg-white p-3 text-sm text-gray-800">
            {sourceNode.data.label}.{fieldName || suggestedFieldName}
            {relationshipType === 'hasMany' ? '[]' : ''}
            {': '}
            {relationshipType === 'hasMany' ? `${targetNode.data.label}[]` : targetNode.data.label}
            {required ? '' : ' | null'}
          </code>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Define Relationship ✓
          </button>
        </div>
      </div>
    </div>
  );
}

