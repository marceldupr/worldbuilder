import { useState, useEffect } from 'react';
import { componentsApi, projectsApi } from '../../lib/api';
import { showToast } from '../ui/toast';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Create Data API 🌐
          </h2>
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ You need to create at least one Element component first before
              creating a Data API.
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
              Create Data API 🌐
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Create a REST API to expose your Element data through HTTP endpoints.
          </p>
        </div>

        <div className="space-y-6">
          {/* API Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              API Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product API, User API"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {elements.map((element) => (
                <option key={element.id} value={element.id}>
                  {element.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              The data entity this API will expose
            </p>
          </div>

          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                File Upload Support
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableFileUpload}
                  onChange={(e) => setEnableFileUpload(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Enable uploads</span>
              </label>
            </div>
            
            {enableFileUpload && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                <label className="block text-xs font-medium text-indigo-900 mb-1">
                  Upload Fields (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadFields}
                  onChange={(e) => setUploadFields(e.target.value)}
                  placeholder="images, documents, avatar"
                  className="block w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="mt-2 text-xs text-indigo-700">
                  ✓ Auto-detected from Element properties with type "image", "file", or "document"
                  <br />
                  ✓ Generates upload endpoints: POST /{elements.find((e) => e.id === linkedElement)?.name.toLowerCase()}/upload
                  <br />
                  ✓ Handles multipart/form-data
                  <br />
                  ✓ Integrates with Storage Helper (create one if needed!)
                  <br />
                  ✓ Max 10MB per file, supports images/PDFs
                </p>
              </div>
            )}
          </div>

          {/* Operations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Operations to Expose
            </label>
            <div className="space-y-3">
              {Object.entries(operations).map(([op, enabled]) => (
                <div key={op} className="flex items-center justify-between rounded-lg border p-3">
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
                      <span className="font-medium text-gray-900 capitalize">
                        {op}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
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

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !linkedElement}
            className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create API ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

