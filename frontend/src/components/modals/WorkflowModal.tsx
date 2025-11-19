import { useState, useEffect } from 'react';
import { componentsApi, projectsApi, generateApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { 
  Workflow, X, Database, Globe, Settings, Wrench, ClipboardCheck, 
  CheckCircle, Sparkles, Loader2, RotateCcw, Check 
} from 'lucide-react';

interface WorkflowModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

const triggerTypes = [
  { value: 'http', label: 'HTTP Request', icon: 'globe', description: 'Triggered by API endpoint' },
  { value: 'event', label: 'Event', icon: 'zap', description: 'Triggered by system event' },
  { value: 'schedule', label: 'Schedule', icon: 'clock', description: 'Triggered by cron/schedule' },
  { value: 'manual', label: 'Manual', icon: 'hand', description: 'Triggered manually' },
];

export function WorkflowModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: WorkflowModalProps) {
  const [step, setStep] = useState<'describe' | 'review'>('describe');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('http');
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    loadComponents();
  }, []);

  async function loadComponents() {
    try {
      const project = await projectsApi.get(projectId);
      setComponents(project.components);
    } catch (error: any) {
      showToast(error.message || 'Failed to load components', 'error');
    }
  }

  const examples = [
    'User Registration: validate input → check email uniqueness → create user → send welcome email → queue onboarding tasks',
    'Order Fulfillment: validate inventory → create order → charge payment → update inventory → create shipment → send confirmation email',
    'Content Publishing: validate content → check permissions → save draft → notify reviewers → on approval publish → notify subscribers → index for search',
    'Password Reset: validate email → generate token → store reset request → send email with link → on link click verify token → update password → notify user',
  ];

  async function handleGenerate() {
    if (!name.trim() || !description.trim()) {
      showToast('Please provide both name and description', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await generateApi.schema({
        componentType: 'workflow',
        name: name.trim(),
        description: `Trigger: ${triggerType}. Flow: ${description.trim()}`,
        projectId,
      });

      setSchema(result.schema);
      setStep('review');
      showToast('Workflow generated!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to generate workflow', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const component = await componentsApi.create({
        projectId,
        type: 'workflow',
        name: name.trim(),
        description: description.trim(),
        schema: {
          ...schema,
          trigger: { type: triggerType },
        },
        position,
      });

      showToast('Workflow created successfully!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create workflow', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerate() {
    setStep('describe');
    setSchema(null);
  }

  if (step === 'describe') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="flex flex-col w-full max-w-4xl h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/30">
                  <Workflow className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create Workflow
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Define a multi-step process that orchestrates multiple components.
                    AI will generate the workflow logic and error handling.
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
            <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Workflow Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., User Registration, Order Fulfillment"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Trigger Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How is this workflow triggered?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {triggerTypes.map((trigger) => (
                  <button
                    key={trigger.value}
                    onClick={() => setTriggerType(trigger.value)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      triggerType === trigger.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{trigger.icon}</span>
                      <span className="font-semibold text-gray-900">{trigger.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{trigger.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Workflow Steps (in order)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe each step using → arrows..."
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use → to separate steps. Be specific about what happens at each step.
              </p>
            </div>

            {/* Available Components */}
            {components.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                  Available Components ({components.length}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {components.map((comp) => (
                    <span
                      key={comp.id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border"
                    >
                      {comp.type === 'element' && <Database className="w-4 h-4" />}
                      {comp.type === 'manipulator' && <Globe className="w-4 h-4" />}
                      {comp.type === 'worker' && <Settings className="w-4 h-4" />}
                      {comp.type === 'helper' && <Wrench className="w-4 h-4" />}
                      {comp.type === 'auditor' && <ClipboardCheck className="w-4 h-4" />}
                      {comp.type === 'enforcer' && <CheckCircle className="w-4 h-4" />}
                      {' '}{comp.name}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Reference these in your workflow description
                </p>
              </div>
            )}

            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-purple-900">
                Example Workflows:
              </h4>
              <div className="space-y-2">
                {examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDescription(example.split(': ')[1]);
                      setName(example.split(': ')[0]);
                    }}
                    className="block w-full rounded-md bg-white p-2 text-left text-xs text-gray-700 hover:bg-purple-100 border border-purple-200"
                  >
                    {example}
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
                onClick={handleGenerate}
                disabled={loading || !name.trim() || !description.trim()}
                className="rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Workflow with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/30">
                <Workflow className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Review Workflow
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Review the AI-generated workflow. This will orchestrate your components in sequence.
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
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{name}</h3>
          <p className="mb-4 text-sm text-gray-600">{description}</p>

          {/* Trigger */}
          {schema && schema.trigger && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Trigger:</h4>
              <div className="rounded bg-white p-2 border">
                <span className="text-sm font-medium">
                  {triggerTypes.find(t => t.value === triggerType)?.icon}{' '}
                  {triggerTypes.find(t => t.value === triggerType)?.label}
                </span>
              </div>
            </div>
          )}

          {/* Steps */}
          {schema && schema.steps && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Workflow Steps ({schema.steps.length}):
              </h4>
              <div className="space-y-2">
                {schema.steps.map((workflowStep: any, i: number) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </div>
                    <div className="flex-1 rounded bg-white p-3 border">
                      <div className="font-medium text-gray-900">{workflowStep.name}</div>
                      {workflowStep.description && (
                        <div className="mt-1 text-xs text-gray-600">{workflowStep.description}</div>
                      )}
                      {workflowStep.component && (
                        <div className="mt-2">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {workflowStep.component} → {workflowStep.action}
                          </span>
                        </div>
                      )}
                    </div>
                    {i < schema.steps.length - 1 && (
                      <div className="text-gray-400 text-xl">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Handling */}
          {schema && schema.errorHandling && (
            <div className="mt-4 rounded bg-red-50 border border-red-200 p-3">
              <h4 className="text-sm font-semibold text-red-900 mb-2">Error Handling:</h4>
              <div className="space-y-1 text-xs text-red-800">
                {Object.entries(schema.errorHandling).map(([key, value]: any) => (
                  <div key={key}>
                    • {key}: {value}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          <div className="rounded-xl bg-gray-100 border border-gray-200 p-4">
            <details>
              <summary className="cursor-pointer text-sm font-bold text-gray-900 hover:text-pink-600 transition-colors">
                View JSON Schema
              </summary>
              <pre className="mt-3 overflow-x-auto text-xs text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </details>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-5">
          <div className="flex justify-between items-center">
            <button
              onClick={handleRegenerate}
              className="rounded-xl bg-white border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Regenerate</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="rounded-xl bg-white border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Workflow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

