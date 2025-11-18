import { useState } from 'react';
import { generateApi, componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';

interface ElementModalProps {
  projectId: string;
  position: { x: number; y: number };
  existingComponent?: any;
  onClose: () => void;
  onSuccess: (component: any) => void;
}

export function ElementModal({ projectId, position, existingComponent, onClose, onSuccess }: ElementModalProps) {
  const isEditing = !!existingComponent;
  const [step, setStep] = useState<'describe' | 'review'>(existingComponent ? 'review' : 'describe');
  const [name, setName] = useState(existingComponent?.name || '');
  const [description, setDescription] = useState(existingComponent?.description || '');
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<any>(existingComponent?.schema || null);

  const examples = [
    'A Product with name, price, description, and inventory count. Price must be positive. Inventory defaults to 0.',
    'A User with email (unique), name, and role (admin, user, guest). Email is required and must be valid.',
    'An Order with status (pending, processing, completed, cancelled), total amount, and order date. Status defaults to pending.',
    'A BlogPost with title, content, author, publish date, and status (draft, published). Slug should be auto-generated from title.',
  ];

  async function handleGenerate() {
    if (!name.trim() || !description.trim()) {
      showToast('Please provide both name and description', 'error');
      return;
    }

    setLoading(true);
    try {
      // Enhanced prompt for editing mode
      let enhancedDescription = description.trim();
      if (isEditing && existingComponent.schema) {
        enhancedDescription = `EXISTING SCHEMA:\n${JSON.stringify(existingComponent.schema, null, 2)}\n\n` +
          `CHANGES/IMPROVEMENTS REQUESTED:\n${description.trim()}\n\n` +
          `Please update the schema based on the requested changes while preserving existing properties that aren't being modified. ` +
          `Keep all relationships intact.`;
      }

      const result = await generateApi.schema({
        componentType: 'element',
        name: name.trim(),
        description: enhancedDescription,
        projectId,
      });

      setSchema(result.schema);
      setStep('review');
      showToast(isEditing ? 'Schema updated with AI! 🔄' : 'Schema generated successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to generate schema', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      let component;
      if (isEditing) {
        component = await componentsApi.update(existingComponent.id, {
          name: name.trim(),
          description: description.trim(),
          schema,
        });
        showToast('Component updated successfully!', 'success');
      } else {
        component = await componentsApi.create({
          projectId,
          type: 'element',
          name: name.trim(),
          description: description.trim(),
          schema,
          position,
        });
        showToast('Component created successfully!', 'success');
      }

      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to save component', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerate() {
    setStep('describe');
    setSchema(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        {step === 'describe' ? (
          <>
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Element 🔷' : 'Create Element 🔷'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {isEditing 
                  ? 'Update your element description and regenerate the schema.'
                  : 'Describe your data entity in natural language. AI will generate the schema for you.'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Element Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Product, User, Order"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isEditing ? 'Changes or Improvements' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isEditing 
                    ? "Describe what you want to add, change, or improve... AI will intelligently update the schema"
                    : "Describe the properties, validations, and behavior..."
                  }
                  rows={6}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-blue-600">
                    💡 AI Enhancement Mode: Describe your changes and AI will intelligently merge them with the existing schema
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-blue-900">
                  💡 {isEditing ? 'Example Changes:' : 'Examples:'}
                </h4>
                <div className="space-y-2">
                  {(isEditing ? [
                    'Add a "priority" field (low, medium, high) with default "medium"',
                    'Make the slug field unique and auto-generated from the name',
                    'Add a "completedAt" timestamp field that is set when status changes to completed',
                    'Add validation: deadline must be in the future',
                  ] : examples).map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDescription(example);
                        if (!isEditing) {
                          const exampleName = example.split(' ')[1];
                          setName(exampleName);
                        }
                      }}
                      className="block w-full rounded-md bg-white p-2 text-left text-xs text-gray-700 hover:bg-blue-100"
                    >
                      {example}
                    </button>
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
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? (isEditing ? 'Updating...' : 'Generating...') : (isEditing ? 'Update with AI 🔄' : 'Generate with AI ✨')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Review Schema
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Review the AI-generated schema. You can regenerate or save to
                continue.
              </p>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {name}
              </h3>
              <p className="mb-4 text-sm text-gray-600">{description}</p>

              {/* Show what changed if editing */}
              {isEditing && existingComponent.schema && (
                <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    🔄 Changes Applied by AI:
                  </h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    {schema.properties && existingComponent.schema.properties && (
                      <>
                        {schema.properties.length > existingComponent.schema.properties.length && (
                          <div>✓ Added {schema.properties.length - existingComponent.schema.properties.length} new properties</div>
                        )}
                        {schema.properties.length < existingComponent.schema.properties.length && (
                          <div>✓ Removed {existingComponent.schema.properties.length - schema.properties.length} properties</div>
                        )}
                        {schema.properties.length === existingComponent.schema.properties.length && (
                          <div>✓ Updated existing properties</div>
                        )}
                      </>
                    )}
                    {schema.relationships && (!existingComponent.schema.relationships || schema.relationships.length !== existingComponent.schema.relationships.length) && (
                      <div>✓ Relationships preserved and updated</div>
                    )}
                  </div>
                </div>
              )}

              {schema && schema.properties && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Properties ({schema.properties.length}):
                  </h4>
                  <div className="space-y-1">
                    {schema.properties.map((prop: any, i: number) => {
                      const isNew = isEditing && existingComponent.schema && 
                        !existingComponent.schema.properties?.some((p: any) => p.name === prop.name);
                      
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded p-2 text-sm ${
                            isNew ? 'bg-green-50 border border-green-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isNew && <span className="text-green-600 text-xs">NEW</span>}
                            <span className="font-medium text-gray-900">
                              {prop.name}
                            </span>
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                              {prop.type}
                            </span>
                            {prop.required && (
                              <span className="text-xs text-red-600">
                                required
                              </span>
                            )}
                          </div>
                          {prop.default && (
                            <span className="text-xs text-gray-500">
                              default: {prop.default}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {schema && schema.indexes && schema.indexes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Indexes:
                  </h4>
                  <div className="mt-1 space-y-1">
                    {schema.indexes.map((index: any, i: number) => (
                      <div key={i} className="text-sm text-gray-600">
                        {index.fields.join(', ')}
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
                  className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update Component ✓' : 'Save Component ✓')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

