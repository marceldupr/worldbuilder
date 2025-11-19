import { useEffect, useState } from 'react';
import { componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { Lock, Unlock, Link2, FileText, Globe as GlobeIcon, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

interface ComponentDetailsProps {
  nodeId: string | null;
  nodes: any[];
  onRequestGenerateData?: (componentId: string, componentName: string) => void;
}

export function ComponentDetails({ nodeId, nodes, onRequestGenerateData }: ComponentDetailsProps) {
  const [component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lockedTests, setLockedTests] = useState<any[]>([]);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    if (nodeId) {
      loadComponent(nodeId);
      loadTests(nodeId);
    } else {
      setComponent(null);
      setLockedTests([]);
    }
  }, [nodeId]);

  async function loadComponent(id: string) {
    setLoading(true);
    try {
      const data = await componentsApi.get(id);
      setComponent(data);
    } catch (error) {
      console.error('Failed to load component:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTests(id: string) {
    try {
      const data = await componentsApi.getTests(id);
      setLockedTests(data.tests || []);
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  }

  async function handleLockToggle() {
    if (!component) return;
    
    if (component.locked) {
      // Unlock
      setLocking(true);
      try {
        await componentsApi.unlock(component.id);
        showToast('Tests unlocked', 'success');
        setComponent({ ...component, locked: false });
        setLockedTests([]);
      } catch (error: any) {
        showToast(error.message || 'Failed to unlock', 'error');
      } finally {
        setLocking(false);
      }
    } else {
      // Trigger the parent modal
      if (onRequestGenerateData) {
        onRequestGenerateData(component.id, component.name);
      }
    }
  }

  if (!nodeId || !component) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Click on a component to view details
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  const getLinkedElement = () => {
    if (component.type === 'manipulator' && component.schema?.linkedElementId) {
      const linkedNode = nodes.find(n => n.id === component.schema.linkedElementId);
      return linkedNode?.data.label;
    }
    return null;
  };

  const getRelationships = () => {
    if (component.schema?.relationships) {
      return component.schema.relationships;
    }
    return [];
  };

  const linkedElement = getLinkedElement();
  const relationships = getRelationships();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-md border border-gray-200">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-bold text-gray-900 text-base">{component.name}</h3>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {component.type}
          </span>
        </div>
        
        {component.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{component.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className={`h-2.5 w-2.5 rounded-full ${
              component.status === 'ready' ? 'bg-green-500' :
              component.status === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            } shadow-sm`} />
            <span className="text-xs font-semibold text-gray-600 capitalize">{component.status}</span>
          </div>
          
          {(component.type === 'element' || component.type === 'manipulator') && (
            <button
              onClick={handleLockToggle}
              disabled={locking}
              className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                component.locked
                  ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {component.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{component.locked ? 'Locked' : 'Protect with Tests'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Locked Tests */}
      {component.locked && lockedTests.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 border border-purple-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-500 text-white">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-purple-900">
              Locked Tests ({lockedTests.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lockedTests.map((test: any) => (
              <div key={test.id} className="rounded-xl bg-white p-3 border border-purple-100 shadow-sm">
                <div className="font-semibold text-gray-900 text-xs mb-1">{test.testName}</div>
                {test.description && (
                  <div className="text-xs text-gray-600 mb-2">{test.description}</div>
                )}
                <div className="flex items-center space-x-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    test.testType === 'unit' ? 'bg-blue-100 text-blue-700' :
                    test.testType === 'integration' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {test.testType}
                  </span>
                  <span className="text-gray-400 font-mono text-xs">{test.checksum.substring(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-purple-200/50 border border-purple-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-purple-700 flex-shrink-0" />
            <p className="text-xs text-purple-900 font-semibold">
              These tests must pass before deploying
            </p>
          </div>
        </div>
      )}

      {/* Linked Element (for Data APIs) */}
      {linkedElement && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 border border-indigo-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500 text-white">
              <Link2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-indigo-900">
              Linked Element
            </h4>
          </div>
          <div className="rounded-xl bg-white p-3 border border-indigo-100">
            <span className="text-sm font-bold text-indigo-900">{linkedElement}</span>
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-200/50 border border-indigo-300">
            <p className="text-xs text-indigo-800 font-medium text-center">
              This API automatically syncs with the {linkedElement} schema
            </p>
          </div>
        </div>
      )}

      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 border border-blue-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <Link2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-blue-900">
              Relationships
            </h4>
          </div>
          <div className="space-y-2">
            {relationships.map((rel: any, i: number) => (
              <div key={i} className="rounded-xl bg-white p-3 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900 text-sm">{rel.fieldName}</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {rel.type}
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {rel.from} → {rel.to}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behaviors & Lifecycle Hooks (for Elements) */}
      {component.type === 'element' && component.schema?.behaviors && component.schema.behaviors.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 border border-purple-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-500 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-purple-900">
              Behaviors & Lifecycle Hooks ({component.schema.behaviors.length})
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {component.schema.behaviors.map((behavior: any, i: number) => (
              <div key={i} className="rounded-xl bg-white p-3 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">
                    {behavior.type === 'custom_method' ? behavior.name : `${behavior.trigger} Hook`}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    behavior.type === 'custom_method' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {behavior.type === 'custom_method' ? 'Method' : 'Hook'}
                  </span>
                </div>
                {behavior.description && (
                  <div className="text-xs text-gray-600 mb-1">{behavior.description}</div>
                )}
                {behavior.action && (
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">{behavior.action}</span>
                    {behavior.target && <span> → {behavior.target}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Properties (for Elements) */}
      {component.type === 'element' && component.schema?.properties && (
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-5 border border-gray-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gray-700 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">
              Properties ({component.schema.properties.length})
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {component.schema.properties.map((prop: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-gray-200 shadow-sm">
                <span className="font-semibold text-gray-900 text-sm">{prop.name}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                  {prop.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operations (for Data APIs) */}
      {component.type === 'manipulator' && component.schema?.operations && (
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-5 border border-gray-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500 text-white">
              <GlobeIcon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">
              API Operations
            </h4>
          </div>
          <div className="space-y-2">
            {Object.entries(component.schema.operations)
              .filter(([_, enabled]) => enabled)
              .map(([op, _], i) => (
                <div key={i} className="rounded-xl bg-white p-2.5 border border-gray-200 shadow-sm">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold inline-block ${
                    op === 'create' ? 'bg-green-100 text-green-700' :
                    op === 'read' ? 'bg-blue-100 text-blue-700' :
                    op === 'update' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {op.toUpperCase()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Custom Endpoints (for Data APIs) */}
      {component.type === 'manipulator' && component.schema?.customEndpoints && component.schema.customEndpoints.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 border border-purple-200 shadow-md">
          <div className="mb-3 flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-500 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-purple-900">
              Custom Endpoints
            </h4>
          </div>
          <div className="space-y-2">
            {component.schema.customEndpoints.map((endpoint: any, i: number) => (
              <div key={i} className="rounded-xl bg-white p-3 border border-purple-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                    endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                    endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                    endpoint.method === 'PATCH' ? 'bg-yellow-100 text-yellow-700' :
                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-xs text-gray-900">{endpoint.path}</span>
                </div>
                <p className="text-xs text-gray-600">{endpoint.description}</p>
                {endpoint.addedAt && (
                  <p className="text-xs text-purple-600 mt-2 italic">
                    Added: {new Date(endpoint.addedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

