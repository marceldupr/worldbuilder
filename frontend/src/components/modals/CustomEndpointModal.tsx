import { useState } from 'react';
import { showToast } from '../ui/toast';
import { Sparkles, X, Loader2, Code, Zap, AlertCircle } from 'lucide-react';

interface CustomEndpointModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface GeneratedComponent {
  type: string;
  name: string;
  description: string;
  reason: string;
}

interface GenerationPlan {
  endpoint: {
    method: string;
    path: string;
    description: string;
  };
  components: GeneratedComponent[];
}

export function CustomEndpointModal({ projectId, onClose, onSuccess }: CustomEndpointModalProps) {
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<GenerationPlan | null>(null);

  async function handleAnalyze() {
    if (!description.trim()) {
      showToast('Please describe your API endpoint', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      // Call AI to analyze and create plan
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate/custom-endpoint-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, description }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze endpoint');
      }

      const data = await response.json();
      setPlan(data.plan);
      showToast('Analysis complete! Review the plan below.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to analyze endpoint', 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!plan) return;

    setGenerating(true);
    try {
      // Generate all components
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate/custom-endpoint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, description, plan }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate components');
      }

      const data = await response.json();
      showToast(`✨ Created ${data.components.length} components!`, 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to generate endpoint', 'error');
    } finally {
      setGenerating(false);
    }
  }

  const componentTypeIcons: Record<string, any> = {
    element: '🔷',
    manipulator: '🌐',
    worker: '⚙️',
    helper: '🔧',
    auditor: '📋',
    workflow: '🔄',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Generate Custom API Endpoint
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
            Describe what you want your API to do, and AI will create all the components needed.
          </p>
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What should this API endpoint do?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Create an endpoint that accepts an order, validates the items, checks inventory, processes payment via Stripe, creates a shipping label, and sends confirmation email to the customer"
            rows={6}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
          />
          <div className="mt-2 flex items-start space-x-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Be specific! Mention: data to accept, validation rules, external services, and what should happen step-by-step.
            </p>
          </div>
        </div>

        {!plan && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !description.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI is analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        )}

        {/* Generation Plan */}
        {plan && (
          <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Code className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-purple-900">AI Generation Plan</h3>
              </div>

              {/* Endpoint Info */}
              <div className="mb-4 rounded-lg bg-white border border-purple-200 p-4">
                <div className="text-xs font-semibold text-purple-600 mb-2">API Endpoint</div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono text-xs font-bold">
                    {plan.endpoint.method}
                  </span>
                  <span className="font-mono text-sm text-gray-900">
                    {plan.endpoint.path}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600">{plan.endpoint.description}</p>
              </div>

              {/* Components to Create */}
              <div>
                <div className="text-xs font-semibold text-purple-600 mb-3">
                  Components to Create ({plan.components.length})
                </div>
                <div className="space-y-2">
                  {plan.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white border border-purple-200 p-3"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{componentTypeIcons[comp.type] || '📦'}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{comp.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                              {comp.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{comp.description}</p>
                          <div className="mt-2 flex items-start space-x-1">
                            <Zap className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-purple-700 italic">{comp.reason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setPlan(null)}
                className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Components...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate All Components</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

