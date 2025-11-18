import { useState, useEffect } from 'react';
import { componentsApi, projectsApi, generateApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { CheckCircle, X, Check, Loader2, Sparkles } from 'lucide-react';

interface EnforcerModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

interface Rule {
  id: string;
  description: string;
  components: string[];
  ruleType: 'workflow' | 'constraint' | 'permission' | 'validation';
}

const ruleTypes = [
  { 
    value: 'workflow', 
    label: 'Workflow Rule', 
    icon: 'workflow',
    example: 'Order must have payment before shipping',
  },
  { 
    value: 'constraint', 
    label: 'Data Constraint', 
    icon: '🔗',
    example: "Can't delete User with active Orders",
  },
  { 
    value: 'permission', 
    label: 'Permission Rule', 
    icon: 'lock',
    example: 'Only admin can delete Products',
  },
  { 
    value: 'validation', 
    label: 'Cross-Component Validation', 
    icon: '✓',
    example: 'Check inventory before creating Order',
  },
];

export function EnforcerModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: EnforcerModalProps) {
  const [step, setStep] = useState<'describe' | 'review'>('describe');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  async function handleGenerate() {
    if (!name.trim() || !description.trim()) {
      showToast('Please provide both name and description', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await generateApi.schema({
        componentType: 'enforcer',
        name: name.trim(),
        description: description.trim(),
        projectId,
      });

      setSchema(result.schema);
      setStep('review');
      showToast('Business rules generated!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to generate rules', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const component = await componentsApi.create({
        projectId,
        type: 'enforcer',
        name: name.trim(),
        description: description.trim(),
        schema,
        position,
      });

      showToast('Enforcer created successfully!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create enforcer', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerate() {
    setStep('describe');
    setSchema(null);
  }

  const examples = [
    "Can't delete a User if they have active Orders. Before Order is confirmed, verify inventory is available and payment succeeded.",
    "Task can only be assigned to active Users. When Task status changes to 'completed', automatically update the Owner's task counter.",
    "Only admin users can delete Products. Price changes above $100 require manager approval. Products with active Orders cannot be deleted.",
    "Order workflow: pending → payment_confirmed → shipped → delivered. Cannot skip steps or go backwards. Each transition logs to audit trail.",
  ];

  if (step === 'describe') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Enforcer
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
            <p className="text-sm text-gray-600">
              Define business rules and constraints between your components.
              AI will generate validation middleware that enforces these rules at runtime.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enforcer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Order Rules, User Permissions"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Rules & Constraints
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the rules, workflows, and constraints..."
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Describe workflow steps, deletion constraints, permission rules, or cross-component validations
              </p>
            </div>

            {/* Available Components */}
            {components.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                  Available Components:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {components.map((comp) => (
                    <span
                      key={comp.id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border"
                    >
                      {comp.name} ({comp.type})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-red-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-red-900">
                Example Business Rules:
              </h4>
              <div className="space-y-2">
                {examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDescription(example);
                      const exampleName = example.split(' ')[0] + ' Rules';
                      setName(exampleName);
                    }}
                    className="block w-full rounded-md bg-white p-2 text-left text-xs text-gray-700 hover:bg-red-100 border border-red-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h4 className="mb-2 text-sm font-semibold text-blue-900">
                🎯 Rule Types Supported:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ruleTypes.map((type) => (
                  <div key={type.value} className="rounded bg-white p-2 text-xs">
                    <div className="font-semibold text-gray-900">
                      {type.icon} {type.label}
                    </div>
                    <div className="mt-1 text-gray-600">{type.example}</div>
                  </div>
                ))}
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
              onClick={handleGenerate}
              disabled={loading || !name.trim() || !description.trim()}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              {loading ? 'Generating...' : 'Generate Rules with AI ✨'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Review Business Rules
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Review the AI-generated business rules. These will be enforced at runtime.
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{name}</h3>
          <p className="mb-4 text-sm text-gray-600">{description}</p>

          {schema && schema.rules && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Generated Rules ({schema.rules.length}):
              </h4>
              <div className="space-y-2">
                {schema.rules.map((rule: any, i: number) => (
                  <div
                    key={i}
                    className="rounded bg-white p-3 border border-red-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{rule.name}</div>
                        <div className="mt-1 text-xs text-gray-600">{rule.description}</div>
                        {rule.trigger && (
                          <div className="mt-2 text-xs">
                            <span className="rounded bg-red-100 px-2 py-0.5 text-red-800 font-medium">
                              Trigger: {rule.trigger}
                            </span>
                          </div>
                        )}
                        {rule.components && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {rule.components.map((comp: string, j: number) => (
                              <span
                                key={j}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span
                        className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold ${
                          rule.type === 'workflow'
                            ? 'bg-blue-100 text-blue-800'
                            : rule.type === 'constraint'
                            ? 'bg-orange-100 text-orange-800'
                            : rule.type === 'permission'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {rule.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-gray-100 p-4">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              View JSON Schema
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-gray-600">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </details>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleRegenerate}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ← Regenerate
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              {loading ? 'Saving...' : 'Save Enforcer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

