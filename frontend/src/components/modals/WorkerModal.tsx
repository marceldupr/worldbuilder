import { useState, useEffect } from 'react';
import { componentsApi, projectsApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { Settings, X, Check, Loader2, Plus, Trash2 } from 'lucide-react';

interface WorkerModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

interface Step {
  id: string;
  name: string;
  helperId?: string;
}

export function WorkerModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: WorkerModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [queueName, setQueueName] = useState('');
  const [concurrency, setConcurrency] = useState(5);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [timeout, setTimeout] = useState(300000);
  const [steps, setSteps] = useState<Step[]>([{ id: '1', name: '', helperId: '' }]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHelpers();
  }, []);

  async function loadHelpers() {
    try {
      const project = await projectsApi.get(projectId);
      const helperComponents = project.components.filter(
        (c: any) => c.type === 'helper'
      );
      setHelpers(helperComponents);
    } catch (error: any) {
      console.error('Error loading helpers:', error);
    }
  }

  function addStep() {
    setSteps([...steps, { id: Date.now().toString(), name: '', helperId: '' }]);
  }

  function removeStep(id: string) {
    setSteps(steps.filter((s) => s.id !== id));
  }

  function updateStep(id: string, field: keyof Step, value: string) {
    setSteps(
      steps.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  async function handleCreate() {
    if (!name.trim() || !description.trim() || !queueName.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (steps.length === 0 || steps.some((s) => !s.name.trim())) {
      showToast('Please add at least one step with a name', 'error');
      return;
    }

    setLoading(true);
    try {
      const schema = {
        queue: queueName,
        concurrency,
        steps: steps.map((s) => ({
          name: s.name,
          helperId: s.helperId || null,
        })),
        retry: {
          attempts: retryAttempts,
          backoff: 'exponential',
        },
        timeout,
      };

      const component = await componentsApi.create({
        projectId,
        type: 'worker',
        name: name.trim(),
        description: description.trim(),
        schema,
        position,
      });

      showToast('Worker created successfully!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create worker', 'error');
    } finally {
      setLoading(false);
    }
  }

  const examples = [
    {
      name: 'Order Processing Worker',
      description: 'Validates inventory, charges payment, creates shipment, and sends confirmation email.',
      queue: 'orders',
      steps: [
        'Validate inventory',
        'Charge payment',
        'Create shipment',
        'Send confirmation email',
      ],
    },
    {
      name: 'Email Campaign Worker',
      description: 'Sends bulk emails to subscribers with rate limiting and personalization.',
      queue: 'emails',
      steps: [
        'Load subscribers',
        'Personalize content',
        'Send email',
        'Track delivery',
      ],
    },
    {
      name: 'Report Generation Worker',
      description: 'Generates and sends daily/weekly reports to users.',
      queue: 'reports',
      steps: ['Fetch data', 'Generate PDF', 'Upload to storage', 'Send notification'],
    },
  ];

  function useExample(example: any) {
    setName(example.name);
    setDescription(example.description);
    setQueueName(example.queue);
    setSteps(
      example.steps.map((step: string, i: number) => ({
        id: (i + 1).toString(),
        name: step,
        helperId: '',
      }))
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create Worker
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Workers process background jobs asynchronously with queues and retries.
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Worker Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Order Processing Worker"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this worker do?"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Queue Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Queue Name *
            </label>
            <input
              type="text"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              placeholder="e.g., orders, emails, reports"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Jobs will be added to this queue for processing
            </p>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Concurrency
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                min={1}
                max={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Parallel jobs</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Retry Attempts
              </label>
              <input
                type="number"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(parseInt(e.target.value))}
                min={0}
                max={10}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">On failure</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value))}
                min={1000}
                step={1000}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Max duration</p>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Processing Steps *
              </label>
              <button
                onClick={addStep}
                className="rounded bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) =>
                      updateStep(step.id, 'name', e.target.value)
                    }
                    placeholder="Step name"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                  />
                  {helpers.length > 0 && (
                    <select
                      value={step.helperId}
                      onChange={(e) =>
                        updateStep(step.id, 'helperId', e.target.value)
                      }
                      className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    >
                      <option value="">No helper</option>
                      {helpers.map((helper) => (
                        <option key={helper.id} value={helper.id}>
                          {helper.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="rounded-lg bg-purple-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-purple-900">
              Example Workers:
            </h4>
            <div className="space-y-2">
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => useExample(example)}
                  className="block w-full rounded-md bg-white p-3 text-left text-sm hover:bg-purple-100"
                >
                  <div className="font-medium text-gray-900">{example.name}</div>
                  <div className="text-xs text-gray-600">{example.description}</div>
                </button>
              ))}
            </div>
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
              onClick={handleCreate}
              disabled={
                loading ||
                !name.trim() ||
                !description.trim() ||
                !queueName.trim()
              }
              className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Worker</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

