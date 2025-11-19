import { useState, useEffect } from 'react';
import { componentsApi, projectsApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { supabase } from '../../lib/supabase';
import { 
  Globe, X, Check, Loader2, AlertTriangle, Upload, Database, Sparkles
} from 'lucide-react';

interface ManipulatorModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

export function ManipulatorModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: ManipulatorModalProps) {
  const [name, setName] = useState('');
  const [linkedElement, setLinkedElement] = useState('');
  const [elements, setElements] = useState<any[]>([]);
  const [operations, setOperations] = useState({
    create: true,
    read: true,
    update: true,
    delete: true,
  });
  const [authentication, setAuthentication] = useState({
    create: 'authenticated',
    read: 'public',
    update: 'authenticated',
    delete: 'authenticated',
  });
  const [enableFileUpload, setEnableFileUpload] = useState(false);
  const [uploadFields, setUploadFields] = useState('images');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'custom'>('standard');
  const [customEndpointDescription, setCustomEndpointDescription] = useState('');
  const [customEndpointPlan, setCustomEndpointPlan] = useState<any>(null);
  const [showingPlan, setShowingPlan] = useState(false);

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
        setName(`${elementComponents[0].name} API`);
        
        // Auto-detect file fields in Element
        const hasFileFields = elementComponents[0].schema?.properties?.some(
          (p: any) => ['image', 'file', 'document'].includes(p.type)
        );
        
        if (hasFileFields) {
          setEnableFileUpload(true);
          const fileFields = elementComponents[0].schema.properties
            .filter((p: any) => ['image', 'file', 'document'].includes(p.type))
            .map((p: any) => p.name)
            .join(', ');
          setUploadFields(fileFields);
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load elements', 'error');
    }
  }

  async function handleAnalyzeCustomEndpoint() {
    if (!customEndpointDescription.trim()) {
      showToast('Please describe your custom endpoint', 'error');
      return;
    }
    
    setLoading(true);
    try {
      showToast('🤖 AI is analyzing your endpoint...', 'info');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call AI to create plan
      const planResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate/custom-endpoint-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            projectId, 
            description: customEndpointDescription 
          }),
        }
      );

      if (!planResponse.ok) throw new Error('Failed to analyze endpoint');
      
      const planData = await planResponse.json();
      setCustomEndpointPlan(planData.plan);
      setShowingPlan(true);
      showToast(`✨ Review the plan before generating`, 'success');
      
    } catch (error: any) {
      showToast(error.message || 'Failed to analyze endpoint', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateFromPlan() {
    if (!customEndpointPlan) return;
    
    setLoading(true);
    try {
      showToast('🔨 Generating components...', 'info');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Generate all components
      const generateResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate/custom-endpoint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            projectId, 
            description: customEndpointDescription,
            plan: customEndpointPlan
          }),
        }
      );

      if (!generateResponse.ok) throw new Error('Failed to generate components');
      
      const generateData = await generateResponse.json();
      
      if (customEndpointPlan.addToExistingApi) {
        if (generateData.components.length > 0) {
          showToast(`✅ Added endpoint to ${customEndpointPlan.addToExistingApi} + created ${generateData.components.length} components!`, 'success');
          onSuccess(generateData.components[0]);
          onClose();
        } else {
          showToast(`✅ Added endpoint to ${customEndpointPlan.addToExistingApi}!`, 'success');
          // No new components created, just close the modal
          // The parent will handle refreshing if needed
          onClose();
        }
      } else {
        showToast(`✅ Created ${generateData.components.length} components!`, 'success');
        if (generateData.components.length > 0) {
          onSuccess(generateData.components[0]);
        }
        onClose();
      }
      
    } catch (error: any) {
      showToast(error.message || 'Failed to generate components', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    // Custom endpoint mode - already showing plan
    if (mode === 'custom' && showingPlan) {
      await handleGenerateFromPlan();
      return;
    }
    
    // Custom endpoint mode - need to analyze first
    if (mode === 'custom') {
      await handleAnalyzeCustomEndpoint();
      return;
    }
    
    // Standard mode
    if (!name.trim() || !linkedElement) {
      showToast('Please provide a name and select an element', 'error');
      return;
    }

    setLoading(true);
    try {
      const selectedElement = elements.find((e) => e.id === linkedElement);
      
      const schema = {
        linkedElement: selectedElement.name,
        linkedElementId: linkedElement,
        operations,
        authentication,
        endpoints: generateEndpoints(selectedElement.name),
        fileUpload: enableFileUpload ? {
          enabled: true,
          fields: uploadFields.split(',').map(f => f.trim()),
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['image/*', 'application/pdf'],
        } : null,
      };

      const component = await componentsApi.create({
        projectId,
        type: 'manipulator',
        name: name.trim(),
        description: `REST API for ${selectedElement.name}`,
        schema,
        position,
      });

      showToast('API component created successfully!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create component', 'error');
    } finally {
      setLoading(false);
    }
  }

  function generateEndpoints(elementName: string) {
    const kebabName = elementName
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    
    const endpoints = [];
    
    if (operations.create) {
      endpoints.push({ method: 'POST', path: `/${kebabName}`, auth: authentication.create });
    }
    if (operations.read) {
      endpoints.push({ method: 'GET', path: `/${kebabName}`, auth: authentication.read });
      endpoints.push({ method: 'GET', path: `/${kebabName}/:id`, auth: authentication.read });
    }
    if (operations.update) {
      endpoints.push({ method: 'PATCH', path: `/${kebabName}/:id`, auth: authentication.update });
    }
    if (operations.delete) {
      endpoints.push({ method: 'DELETE', path: `/${kebabName}/:id`, auth: authentication.delete });
    }
    
    return endpoints;
  }

  if (elements.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create Data API
            </h2>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-5 shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-900 font-medium leading-relaxed">
                You need to create at least one Element component first before creating a Data API.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-3xl h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create Data API
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Create a REST API to expose your Element data through HTTP endpoints.
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
          
          {/* Mode Selector */}
          <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-4">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              API Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  mode === 'standard'
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Database className={`w-5 h-5 ${mode === 'standard' ? 'text-indigo-600' : 'text-gray-600'}`} />
                  <span className={`font-bold text-sm ${mode === 'standard' ? 'text-indigo-900' : 'text-gray-900'}`}>
                    Standard CRUD
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  REST API for existing Element
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  mode === 'custom'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className={`w-5 h-5 ${mode === 'custom' ? 'text-purple-600' : 'text-gray-600'}`} />
                  <span className={`font-bold text-sm ${mode === 'custom' ? 'text-purple-900' : 'text-gray-900'}`}>
                    Custom Endpoint
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  AI generates from description
                </p>
              </button>
            </div>
          </div>

          {mode === 'custom' && !showingPlan && (
            <div className="rounded-xl bg-purple-50 border-2 border-purple-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">
                  Describe Your Custom Endpoint
                </label>
                <textarea
                  value={customEndpointDescription}
                  onChange={(e) => setCustomEndpointDescription(e.target.value)}
                  placeholder="Example: Create an endpoint that accepts an order, validates items, checks inventory, processes payment via Stripe, and sends confirmation email..."
                  rows={5}
                  className="w-full rounded-xl border border-purple-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                />
              </div>
              
              <div className="rounded-lg bg-white border border-purple-300 p-4">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-purple-800">
                    <p className="font-semibold mb-1">AI will create:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>All necessary Elements (data models)</li>
                      <li>Validation components (Auditors)</li>
                      <li>External integrations (Helpers)</li>
                      <li>Background jobs (Workers)</li>
                      <li>Complete workflow orchestration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'custom' && showingPlan && customEndpointPlan && (
            <div className="rounded-xl bg-purple-50 border-2 border-purple-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-purple-900">Review AI Plan</h3>
                <button
                  onClick={() => {
                    setShowingPlan(false);
                    setCustomEndpointPlan(null);
                  }}
                  className="text-sm text-purple-700 hover:text-purple-900 underline"
                >
                  ← Edit Description
                </button>
              </div>

              {/* Endpoint Info */}
              <div className="rounded-lg bg-white border border-purple-300 p-4">
                <div className="text-xs font-semibold text-purple-600 mb-2">API Endpoint</div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono text-xs font-bold">
                    {customEndpointPlan.endpoint.method}
                  </span>
                  <span className="font-mono text-sm text-gray-900">
                    {customEndpointPlan.endpoint.path}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600">{customEndpointPlan.endpoint.description}</p>
                
                {customEndpointPlan.addToExistingApi && (
                  <div className="mt-3 flex items-start space-x-2 p-2 rounded bg-green-50 border border-green-200">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-green-800">
                      <p className="font-semibold">Adding to existing API</p>
                      <p className="mt-1">This endpoint will be added to <strong>{customEndpointPlan.addToExistingApi}</strong> instead of creating a new API.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Components List */}
              <div>
                <div className="text-sm font-semibold text-purple-900 mb-3">
                  {customEndpointPlan.components.length === 0 ? 'No new components needed' : `New Components to Create (${customEndpointPlan.components.length})`}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customEndpointPlan.components.length === 0 && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                      <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-800 font-medium">
                        All components already exist!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        The endpoint will be added to your existing API.
                      </p>
                    </div>
                  )}
                  {customEndpointPlan.components.map((comp: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white border border-purple-200 p-3"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">
                          {comp.type === 'element' && '🔷'}
                          {comp.type === 'manipulator' && '🌐'}
                          {comp.type === 'worker' && '⚙️'}
                          {comp.type === 'helper' && '🔧'}
                          {comp.type === 'auditor' && '📋'}
                          {comp.type === 'enforcer' && '✅'}
                          {comp.type === 'workflow' && '🔄'}
                          {comp.type === 'auth' && '🔒'}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 text-sm">{comp.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                              {comp.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{comp.description}</p>
                          <p className="text-xs text-purple-700 italic mt-1">💡 {comp.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'standard' && (
            <>
          {/* API Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product API, User API"
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Linked Element */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Linked Element
            </label>
            <div className="relative">
              <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={linkedElement}
                onChange={(e) => {
                  setLinkedElement(e.target.value);
                  const el = elements.find((el) => el.id === e.target.value);
                  if (el) {
                    setName(`${el.name} API`);
                    
                    // Auto-detect file fields when changing element
                    const hasFileFields = el.schema?.properties?.some(
                      (p: any) => ['image', 'file', 'document'].includes(p.type)
                    );
                    
                    if (hasFileFields) {
                      setEnableFileUpload(true);
                      const fileFields = el.schema.properties
                        .filter((p: any) => ['image', 'file', 'document'].includes(p.type))
                        .map((p: any) => p.name)
                        .join(', ');
                      setUploadFields(fileFields);
                      showToast(`Auto-detected file fields: ${fileFields}`, 'info');
                    } else {
                      setEnableFileUpload(false);
                      setUploadFields('');
                    }
                  }
                }}
                className="block w-full rounded-xl border border-gray-300 pl-12 pr-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                {elements.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500 font-medium">
              The data entity this API will expose
            </p>
          </div>

          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                File Upload Support
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFileUpload}
                  onChange={(e) => setEnableFileUpload(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-gray-700">Enable uploads</span>
              </label>
            </div>
            
            {enableFileUpload && (
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-5 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <label className="block text-sm font-bold text-indigo-900">
                    Upload Fields (comma-separated)
                  </label>
                </div>
                <input
                  type="text"
                  value={uploadFields}
                  onChange={(e) => setUploadFields(e.target.value)}
                  placeholder="images, documents, avatar"
                  className="block w-full rounded-lg border border-indigo-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <div className="mt-3 space-y-2 text-xs text-indigo-800 font-medium">
                  <div className="flex items-center space-x-2">
                    <Check className="w-3 h-3" />
                    <span>Auto-detected from Element properties with type "image", "file", or "document"</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3 h-3" />
                    <span>Generates upload endpoints: POST /{elements.find((e) => e.id === linkedElement)?.name.toLowerCase()}/upload</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3 h-3" />
                    <span>Handles multipart/form-data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3 h-3" />
                    <span>Integrates with Storage Helper (create one if needed!)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3 h-3" />
                    <span>Max 10MB per file, supports images/PDFs</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Operations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Operations to Expose
            </label>
            <div className="space-y-3">
              {Object.entries(operations).map(([op, enabled]) => (
                <div key={op} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        setOperations({ ...operations, [op]: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-gray-900 capitalize">
                        {op}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                        op === 'create' ? 'bg-green-100 text-green-700' :
                        op === 'read' ? 'bg-blue-100 text-blue-700' :
                        op === 'update' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {op === 'create' && 'POST'}
                        {op === 'read' && 'GET'}
                        {op === 'update' && 'PATCH'}
                        {op === 'delete' && 'DELETE'}
                      </span>
                    </div>
                  </div>
                  
                  {enabled && (
                    <select
                      value={authentication[op as keyof typeof authentication]}
                      onChange={(e) =>
                        setAuthentication({
                          ...authentication,
                          [op]: e.target.value,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="authenticated">Authenticated</option>
                      <option value="admin">Admin Only</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              Generated Endpoints:
            </h4>
            <div className="space-y-1">
              {generateEndpoints(
                elements.find((e) => e.id === linkedElement)?.name || ''
              ).map((endpoint, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm font-mono"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        endpoint.method === 'POST'
                          ? 'bg-green-100 text-green-800'
                          : endpoint.method === 'GET'
                          ? 'bg-blue-100 text-blue-800'
                          : endpoint.method === 'PATCH'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="text-gray-700">{endpoint.path}</span>
                  </div>
                  <span className="text-xs text-gray-500">{endpoint.auth}</span>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
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
                (mode === 'standard' && (!name.trim() || !linkedElement)) ||
                (mode === 'custom' && !showingPlan && !customEndpointDescription.trim())
              }
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{showingPlan ? 'Generating...' : 'Analyzing...'}</span>
                </>
              ) : (
                <>
                  {mode === 'custom' && !showingPlan && <Sparkles className="w-4 h-4" />}
                  {mode === 'custom' && showingPlan && <Check className="w-4 h-4" />}
                  {mode === 'standard' && <Check className="w-4 h-4" />}
                  <span>
                    {mode === 'custom' && !showingPlan && 'Analyze with AI'}
                    {mode === 'custom' && showingPlan && (
                      customEndpointPlan?.addToExistingApi 
                        ? `Add to ${customEndpointPlan.addToExistingApi}${customEndpointPlan.components.length > 0 ? ` + ${customEndpointPlan.components.length} New` : ''}` 
                        : `Generate ${customEndpointPlan?.components.length || 0} Components`
                    )}
                    {mode === 'standard' && 'Create API'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

