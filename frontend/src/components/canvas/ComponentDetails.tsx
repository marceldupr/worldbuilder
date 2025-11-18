import { useEffect, useState } from 'react';
import { componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';

interface ComponentDetailsProps {
  nodeId: string | null;
  nodes: any[];
}

export function ComponentDetails({ nodeId, nodes }: ComponentDetailsProps) {
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
    
    setLocking(true);
    try {
      if (component.locked) {
        await componentsApi.unlock(component.id);
        showToast('Tests unlocked', 'success');
        setComponent({ ...component, locked: false });
        setLockedTests([]);
      } else {
        const result = await componentsApi.lock(component.id);
        showToast(`${result.testCount} tests locked! 🔒`, 'success');
        setComponent({ ...component, locked: true });
        await loadTests(component.id);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to toggle lock', 'error');
    } finally {
      setLocking(false);
    }
  }

  if (!nodeId || !component) {
    return (
      <div className="text-center text-sm text-gray-500 py-8">
        Click on a component to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-sm text-gray-500 py-8">
        Loading...
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
      <div className="rounded-lg bg-white p-4 shadow-sm border">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{component.name}</h3>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {component.type}
          </span>
        </div>
        
        {component.description && (
          <p className="text-sm text-gray-600 mb-3">{component.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${
              component.status === 'ready' ? 'bg-green-500' :
              component.status === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-500 capitalize">{component.status}</span>
          </div>
          
          {(component.type === 'element' || component.type === 'manipulator') && (
            <button
              onClick={handleLockToggle}
              disabled={locking}
              className={`flex items-center space-x-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                component.locked
                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <span>{component.locked ? '🔒' : '🔓'}</span>
              <span>{component.locked ? 'Locked' : 'Lock Tests'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Locked Tests */}
      {component.locked && lockedTests.length > 0 && (
        <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-purple-900">
              🔒 Locked Tests ({lockedTests.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {lockedTests.map((test: any) => (
              <div key={test.id} className="rounded bg-white p-2 text-xs border border-purple-100">
                <div className="font-medium text-gray-900">{test.testName}</div>
                {test.description && (
                  <div className="mt-1 text-gray-600">{test.description}</div>
                )}
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                    test.testType === 'unit' ? 'bg-blue-100 text-blue-800' :
                    test.testType === 'integration' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {test.testType}
                  </span>
                  <span className="text-gray-400 font-mono">{test.checksum.substring(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-purple-700">
            ⚠️ These tests must pass before deploying
          </p>
        </div>
      )}

      {/* Linked Element (for Data APIs) */}
      {linkedElement && (
        <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2">
            📎 Linked Element
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔷</span>
            <span className="text-sm font-medium text-indigo-800">{linkedElement}</span>
          </div>
          <p className="mt-2 text-xs text-indigo-700">
            This API automatically syncs with the {linkedElement} schema
          </p>
        </div>
      )}

      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            🔗 Relationships
          </h4>
          <div className="space-y-2">
            {relationships.map((rel: any, i: number) => (
              <div key={i} className="rounded bg-white p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{rel.fieldName}</span>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    {rel.type}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {rel.from} → {rel.to}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Properties (for Elements) */}
      {component.type === 'element' && component.schema?.properties && (
        <div className="rounded-lg bg-gray-50 p-4 border">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            📋 Properties ({component.schema.properties.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {component.schema.properties.map((prop: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs">
                <span className="font-medium text-gray-900">{prop.name}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {prop.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operations (for Data APIs) */}
      {component.type === 'manipulator' && component.schema?.operations && (
        <div className="rounded-lg bg-gray-50 p-4 border">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            🌐 API Operations
          </h4>
          <div className="space-y-1">
            {Object.entries(component.schema.operations)
              .filter(([_, enabled]) => enabled)
              .map(([op, _], i) => (
                <div key={i} className="flex items-center space-x-2 text-sm">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    op === 'create' ? 'bg-green-100 text-green-800' :
                    op === 'read' ? 'bg-blue-100 text-blue-800' :
                    op === 'update' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {op.toUpperCase()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

