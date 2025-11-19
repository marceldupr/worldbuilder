import { useState, useEffect } from 'react';
import { componentsApi, projectsApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { 
  Globe, X, Check, Loader2, AlertTriangle, Upload, Database
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

  async function handleCreate() {
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
              disabled={loading || !name.trim() || !linkedElement}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create API</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

