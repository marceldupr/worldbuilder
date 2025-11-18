import { useState } from 'react';
import { componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';

interface HelperModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

interface Method {
  id: string;
  name: string;
  parameters: string;
  returns: string;
}

const HELPER_TEMPLATES = [
  {
    name: 'Email Helper',
    type: 'email',
    integration: 'sendgrid',
    description: 'Send transactional emails via SendGrid',
    methods: [
      {
        name: 'sendTransactional',
        parameters: 'to: string, template: string, data: object',
        returns: 'Promise<boolean>',
      },
    ],
    config: ['SENDGRID_API_KEY', 'FROM_EMAIL'],
  },
  {
    name: 'Payment Helper',
    type: 'payment',
    integration: 'stripe',
    description: 'Process payments through Stripe',
    methods: [
      {
        name: 'createPaymentIntent',
        parameters: 'amount: number, currency: string',
        returns: 'Promise<PaymentIntent>',
      },
      {
        name: 'confirmPayment',
        parameters: 'intentId: string',
        returns: 'Promise<boolean>',
      },
    ],
    config: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  },
  {
    name: 'Storage Helper',
    type: 'storage',
    integration: 'supabase',
    description: 'Upload and manage files in Supabase Storage',
    methods: [
      {
        name: 'uploadFile',
        parameters: 'bucket: string, path: string, file: File',
        returns: 'Promise<string>',
      },
      {
        name: 'getPublicUrl',
        parameters: 'bucket: string, path: string',
        returns: 'string',
      },
    ],
    config: ['SUPABASE_URL', 'SUPABASE_KEY'],
  },
  {
    name: 'SMS Helper',
    type: 'sms',
    integration: 'twilio',
    description: 'Send SMS messages via Twilio',
    methods: [
      {
        name: 'sendSMS',
        parameters: 'to: string, message: string',
        returns: 'Promise<boolean>',
      },
    ],
    config: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
  },
];

export function HelperModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: HelperModalProps) {
  const [step, setStep] = useState<'select' | 'custom'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [integration, setIntegration] = useState('');
  const [methods, setMethods] = useState<Method[]>([
    { id: '1', name: '', parameters: '', returns: 'Promise<any>' },
  ]);
  const [loading, setLoading] = useState(false);

  function selectTemplate(template: any) {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setIntegration(template.integration);
    setMethods(
      template.methods.map((m: any, i: number) => ({
        id: (i + 1).toString(),
        ...m,
      }))
    );
  }

  function addMethod() {
    setMethods([
      ...methods,
      {
        id: Date.now().toString(),
        name: '',
        parameters: '',
        returns: 'Promise<any>',
      },
    ]);
  }

  function removeMethod(id: string) {
    setMethods(methods.filter((m) => m.id !== id));
  }

  function updateMethod(id: string, field: keyof Method, value: string) {
    setMethods(methods.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  async function handleCreate() {
    if (!name.trim() || !description.trim()) {
      showToast('Please fill in name and description', 'error');
      return;
    }

    if (methods.length === 0 || methods.some((m) => !m.name.trim())) {
      showToast('Please add at least one method with a name', 'error');
      return;
    }

    setLoading(true);
    try {
      const schema = {
        integration: integration || 'custom',
        methods: methods.map((m) => ({
          name: m.name,
          parameters: m.parameters,
          returns: m.returns,
        })),
        configuration:
          selectedTemplate?.config?.reduce(
            (acc: any, key: string) => {
              acc[key] = `\${${key}}`;
              return acc;
            },
            {}
          ) || {},
      };

      const component = await componentsApi.create({
        projectId,
        type: 'helper',
        name: name.trim(),
        description: description.trim(),
        schema,
        position,
      });

      showToast('Helper created successfully!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create helper', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Helper 🔧
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Choose a pre-built helper or create a custom one.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {HELPER_TEMPLATES.map((template, i) => (
              <button
                key={i}
                onClick={() => {
                  selectTemplate(template);
                  setStep('custom');
                }}
                className="rounded-lg border-2 border-gray-200 p-4 text-left transition-all hover:border-yellow-400 hover:bg-yellow-50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    {template.type}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-600">{template.description}</p>
                <div className="text-xs text-gray-500">
                  {template.methods.length} method
                  {template.methods.length > 1 ? 's' : ''} • {template.integration}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('custom')}
              className="rounded-md bg-yellow-600 px-6 py-2 text-sm font-semibold text-white hover:bg-yellow-500"
            >
              Create Custom Helper →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Configure Helper 🔧
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => {
              setStep('select');
              setSelectedTemplate(null);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to templates
          </button>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Helper Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Email Helper"
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
              placeholder="What does this helper do?"
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Integration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Integration
            </label>
            <input
              type="text"
              value={integration}
              onChange={(e) => setIntegration(e.target.value)}
              placeholder="e.g., stripe, sendgrid, twilio"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Methods */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Methods *
              </label>
              <button
                onClick={addMethod}
                className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
              >
                + Add Method
              </button>
            </div>

            <div className="space-y-3">
              {methods.map((method) => (
                <div key={method.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <input
                      type="text"
                      value={method.name}
                      onChange={(e) =>
                        updateMethod(method.id, 'name', e.target.value)
                      }
                      placeholder="Method name (e.g., sendEmail)"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                    />
                    {methods.length > 1 && (
                      <button
                        onClick={() => removeMethod(method.id)}
                        className="ml-3 text-gray-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={method.parameters}
                      onChange={(e) =>
                        updateMethod(method.id, 'parameters', e.target.value)
                      }
                      placeholder="Parameters (e.g., email: string, subject: string)"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                    />
                    <input
                      type="text"
                      value={method.returns}
                      onChange={(e) =>
                        updateMethod(method.id, 'returns', e.target.value)
                      }
                      placeholder="Return type (e.g., Promise<boolean>)"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Preview */}
          {selectedTemplate?.config && (
            <div className="rounded-lg bg-yellow-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-yellow-900">
                ⚙️ Required Environment Variables:
              </h4>
              <div className="space-y-1">
                {selectedTemplate.config.map((key: string) => (
                  <div key={key} className="font-mono text-xs text-yellow-800">
                    {key}
                  </div>
                ))}
              </div>
            </div>
          )}
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
            disabled={loading || !name.trim() || !description.trim()}
            className="rounded-md bg-yellow-600 px-6 py-2 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Helper ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

