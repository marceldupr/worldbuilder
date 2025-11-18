import { useState, useEffect } from 'react';
import { componentsApi, projectsApi } from '../../lib/api';
import { showToast } from '../ui/toast';

interface AuditorModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

const auditEvents = [
  { value: 'created', label: 'Created', description: 'When entity is created' },
  { value: 'updated', label: 'Updated', description: 'When entity is updated' },
  { value: 'deleted', label: 'Deleted', description: 'When entity is deleted' },
  { value: 'state_changed', label: 'State Changed', description: 'When status/state transitions' },
];

export function AuditorModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: AuditorModalProps) {
  const [name, setName] = useState('');
  const [linkedElement, setLinkedElement] = useState('');
  const [elements, setElements] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'created',
    'updated',
    'deleted',
  ]);
  const [retentionYears, setRetentionYears] = useState(7);
  const [enableValidation, setEnableValidation] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadElements();
  }, []);

  async function loadElements() {
    try {
      const project = await projectsApi.get(projectId);
      const elementComponents = project.components.filter(
        (c: any) => c.type === 'element'
      );
      setElements(elementComponents);

      if (elementComponents.length > 0) {
        setLinkedElement(elementComponents[0].id);
        setName(`${elementComponents[0].name} Auditor`);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load elements', 'error');
    }
  }

  function toggleEvent(eventValue: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    );
  }

  async function handleCreate() {
    if (!name.trim() || !linkedElement) {
      showToast('Please provide a name and select an element', 'error');
      return;
    }

    if (selectedEvents.length === 0) {
      showToast('Please select at least one event to audit', 'error');
      return;
    }

    setLoading(true);
    try {
      const selectedElement = elements.find((e) => e.id === linkedElement);

      const schema = {
        linkedElement: selectedElement.name,
        linkedElementId: linkedElement,
        auditEvents: selectedEvents,
        retention: `${retentionYears} years`,
        enableValidation,
        rules: enableValidation ? [
          {
            trigger: 'before_create',
            validations: [
              {
                name: 'validateRequiredFields',
                description: 'Ensure all required fields are present',
              },
            ],
          },
          {
            trigger: 'before_update',
            validations: [
              {
                name: 'validateChanges',
                description: 'Validate updated fields meet constraints',
              },
            ],
          },
        ] : [],
      };

      const component = await componentsApi.create({
        projectId,
        type: 'auditor',
        name: name.trim(),
        description: `Audit trail and validation for ${selectedElement.name}`,
        schema,
        position,
      });

      showToast('Auditor component created successfully!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create component', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (elements.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Create Auditor 📋
          </h2>
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ You need to create at least one Element component first before
              creating an Auditor.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Create Auditor 📋
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Track changes and enforce validation rules for your data entities.
          </p>
        </div>

        <div className="space-y-6">
          {/* Auditor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Auditor Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Auditor, Order Auditor"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Linked Element */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Linked Element
            </label>
            <select
              value={linkedElement}
              onChange={(e) => {
                setLinkedElement(e.target.value);
                const el = elements.find((el) => el.id === e.target.value);
                if (el) setName(`${el.name} Auditor`);
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {elements.map((element) => (
                <option key={element.id} value={element.id}>
                  {element.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              The data entity to audit
            </p>
          </div>

          {/* Audit Events */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Events to Audit
            </label>
            <div className="space-y-2">
              {auditEvents.map((event) => (
                <div
                  key={event.value}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        {event.label}
                      </span>
                      <p className="text-xs text-gray-500">{event.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Rules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Validation Rules
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableValidation}
                  onChange={(e) => setEnableValidation(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Enable validation</span>
              </label>
            </div>
            
            {enableValidation && (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  ✓ Validates required fields before create/update
                  <br />
                  ✓ Enforces min/max constraints
                  <br />
                  ✓ Checks business rules before operations
                  <br />
                  ✓ Prevents invalid data from being saved
                </p>
              </div>
            )}
          </div>

          {/* Retention Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Audit Log Retention
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <input
                type="number"
                value={retentionYears}
                onChange={(e) => setRetentionYears(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="10"
                className="block w-20 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">years</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              How long to keep audit logs for compliance
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              What Gets Tracked:
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• Who made the change (user ID)</div>
              <div>• When it happened (timestamp)</div>
              <div>• What changed (before/after snapshots)</div>
              <div>• Which operation (create/update/delete)</div>
              {enableValidation && <div>• Validation checks before operations</div>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !linkedElement || selectedEvents.length === 0}
            className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Auditor ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

