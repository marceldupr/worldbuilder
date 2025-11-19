import { useState } from 'react';
import { generateApi, componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { 
  Database, X, Sparkles, RotateCcw, Check, Trash2, 
  Plus, Lightbulb, ChevronRight, ChevronDown, Loader2,
  RefreshCw
} from 'lucide-react';

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
  const [showBehaviors, setShowBehaviors] = useState(false);
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);

  const examples = [
    'A Product with name, price, description, inventory count, and images (array of image URLs). Price must be positive. Images field is for file uploads.',
    'A User with email (unique), name, avatar (image URL for profile pic), and role (admin, user, guest). Email is required and must be valid.',
    'A Document with title, description, file (document URL), and uploadedBy (user reference). File field is for PDF/Word uploads.',
    'A BlogPost with title, content, author, coverImage (image URL), publishDate, and status (draft, published). CoverImage is for file upload.',
  ];

  async function loadComponents() {
    try {
      const { projectsApi } = await import('../../lib/api');
      const project = await projectsApi.get(projectId);
      setAvailableComponents(project.components || []);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  }

  async function handleGenerate() {
    if (!name.trim() || !description.trim()) {
      showToast('Please provide both name and description', 'error');
      return;
    }

    setLoading(true);
    try {
      // Load components for behavior linking
      await loadComponents();
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
      showToast(isEditing ? 'Schema updated with AI!' : 'Schema generated successfully!', 'success');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {step === 'describe' ? (
          <>
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isEditing ? 'Edit Element' : 'Create Element'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {isEditing 
                        ? 'Update your element description and regenerate the schema.'
                        : 'Describe your data entity in natural language. AI will generate the schema for you.'
                      }
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Element Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Product, User, Order"
                  className="block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
                {isEditing && (
                  <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium">
                      AI Enhancement Mode: Describe your changes and AI will intelligently merge them with the existing schema
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 shadow-sm">
                <div className="flex items-start space-x-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <h4 className="text-sm font-bold text-blue-900">
                    {isEditing ? 'Example Changes:' : 'Examples:'}
                  </h4>
                </div>
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
                      className="block w-full rounded-lg bg-white p-3 text-left text-xs text-gray-700 hover:bg-blue-50 hover:shadow-sm transition-all border border-transparent hover:border-blue-200"
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
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isEditing ? 'Updating...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      {isEditing ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      <span>{isEditing ? 'Update with AI' : 'Generate with AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Review Schema
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Review the AI-generated schema. You can regenerate or save to continue.
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
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                {name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

              {/* Show what changed if editing */}
              {isEditing && existingComponent.schema && (
                <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4 shadow-sm">
                  <div className="flex items-start space-x-2 mb-3">
                    <RefreshCw className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <h4 className="text-sm font-bold text-blue-900">
                      Changes Applied by AI:
                    </h4>
                  </div>
                  <div className="text-xs text-blue-800 space-y-2">
                    {schema.properties && existingComponent.schema.properties && (
                      <>
                        {schema.properties.length > existingComponent.schema.properties.length && (
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3" />
                            <span>Added {schema.properties.length - existingComponent.schema.properties.length} new properties</span>
                          </div>
                        )}
                        {schema.properties.length < existingComponent.schema.properties.length && (
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3" />
                            <span>Removed {existingComponent.schema.properties.length - schema.properties.length} properties</span>
                          </div>
                        )}
                        {schema.properties.length === existingComponent.schema.properties.length && (
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3" />
                            <span>Updated existing properties</span>
                          </div>
                        )}
                      </>
                    )}
                    {schema.relationships && (!existingComponent.schema.relationships || schema.relationships.length !== existingComponent.schema.relationships.length) && (
                      <div className="flex items-center space-x-2">
                        <Check className="w-3 h-3" />
                        <span>Relationships preserved and updated</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {schema && schema.properties && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900">
                      Properties ({schema.properties.length}):
                    </h4>
                    <button
                      onClick={() => {
                        const newProp = {
                          name: 'newField',
                          type: 'string',
                          required: false,
                        };
                        setSchema({
                          ...schema,
                          properties: [...schema.properties, newProp],
                        });
                      }}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Property</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {schema.properties.map((prop: any, i: number) => {
                      const isNew = isEditing && existingComponent.schema && 
                        !existingComponent.schema.properties?.some((p: any) => p.name === prop.name);
                      
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded-xl p-3 text-sm group hover:shadow-sm transition-all ${
                            isNew ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300' : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            {isNew && (
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                NEW
                              </span>
                            )}
                            <input
                              type="text"
                              value={prop.name}
                              onChange={(e) => {
                                const updated = [...schema.properties];
                                updated[i] = { ...prop, name: e.target.value };
                                setSchema({ ...schema, properties: updated });
                              }}
                              className="font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                              style={{ width: `${Math.max(prop.name.length, 5)}ch` }}
                            />
                            <select
                              value={prop.type}
                              onChange={(e) => {
                                const updated = [...schema.properties];
                                updated[i] = { ...prop, type: e.target.value };
                                setSchema({ ...schema, properties: updated });
                              }}
                              className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                            >
                              <option value="string">string</option>
                              <option value="integer">integer</option>
                              <option value="decimal">decimal</option>
                              <option value="boolean">boolean</option>
                              <option value="date">date</option>
                              <option value="datetime">datetime</option>
                              <option value="uuid">uuid</option>
                              <option value="enum">enum</option>
                              <option value="json">json</option>
                              <option value="image">image</option>
                              <option value="file">file</option>
                              <option value="document">document</option>
                            </select>
                            <button
                              onClick={() => {
                                const updated = [...schema.properties];
                                updated[i] = { ...prop, required: !prop.required };
                                setSchema({ ...schema, properties: updated });
                              }}
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                                prop.required
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {prop.required ? 'required' : 'optional'}
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            {prop.default && (
                              <span className="text-xs text-gray-500 font-medium">
                                default: {prop.default}
                              </span>
                            )}
                            {!['id', 'createdAt', 'updatedAt'].includes(prop.name) && (
                              <button
                                onClick={() => {
                                  const updated = schema.properties.filter((_: any, idx: number) => idx !== i);
                                  setSchema({ ...schema, properties: updated });
                                  showToast('Property removed', 'info');
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium">
                      Click property names to edit, click type badges to change type, toggle required/optional
                    </p>
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

              {/* Behaviors Section */}
              <div className="mt-5">
                <button
                  onClick={() => setShowBehaviors(!showBehaviors)}
                  className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {showBehaviors ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>Behaviors & Lifecycle Hooks ({schema.behaviors?.length || 0})</span>
                </button>
                
                {showBehaviors && (
                  <div className="mt-3 space-y-3">
                    {/* Add Behavior Button */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const newBehavior = {
                            type: 'custom_method',
                            name: 'newMethod',
                            description: 'Custom method',
                            parameters: [],
                          };
                          setSchema({
                            ...schema,
                            behaviors: [...(schema.behaviors || []), newBehavior],
                          });
                        }}
                        className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-3 text-xs font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm transition-all flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Custom Method</span>
                      </button>
                      <button
                        onClick={() => {
                          const newHook = {
                            type: 'lifecycle_hook',
                            trigger: 'afterCreate',
                            action: 'triggerWorkflow',
                            target: '',
                          };
                          setSchema({
                            ...schema,
                            behaviors: [...(schema.behaviors || []), newHook],
                          });
                        }}
                        className="rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-3 text-xs font-semibold text-purple-700 hover:border-purple-400 hover:bg-purple-100 hover:shadow-sm transition-all flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Lifecycle Hook</span>
                      </button>
                    </div>

                    {/* Existing Behaviors */}
                    {schema.behaviors && schema.behaviors.length > 0 && (
                      <div className="space-y-2">
                        {schema.behaviors.map((behavior: any, i: number) => (
                          <div key={i} className="rounded-xl border border-gray-200 p-3 bg-white group hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                {behavior.type === 'custom_method' ? (
                                  <>
                                    <div className="flex items-center space-x-2">
                                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                                        Method
                                      </span>
                                      <input
                                        type="text"
                                        value={behavior.name}
                                        onChange={(e) => {
                                          const updated = [...schema.behaviors];
                                          updated[i] = { ...behavior, name: e.target.value };
                                          setSchema({ ...schema, behaviors: updated });
                                        }}
                                        placeholder="methodName"
                                        className="text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={behavior.description || ''}
                                      onChange={(e) => {
                                        const updated = [...schema.behaviors];
                                        updated[i] = { ...behavior, description: e.target.value };
                                        setSchema({ ...schema, behaviors: updated });
                                      }}
                                      placeholder="What does this method do?"
                                      className="w-full text-xs text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center space-x-2">
                                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                                        Hook
                                      </span>
                                      <select
                                        value={behavior.trigger}
                                        onChange={(e) => {
                                          const updated = [...schema.behaviors];
                                          updated[i] = { ...behavior, trigger: e.target.value };
                                          setSchema({ ...schema, behaviors: updated });
                                        }}
                                        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      >
                                        <option value="beforeCreate">Before Create</option>
                                        <option value="afterCreate">After Create</option>
                                        <option value="beforeUpdate">Before Update</option>
                                        <option value="afterUpdate">After Update</option>
                                        <option value="beforeDelete">Before Delete</option>
                                        <option value="afterDelete">After Delete</option>
                                      </select>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs">
                                      <select
                                        value={behavior.action}
                                        onChange={(e) => {
                                          const updated = [...schema.behaviors];
                                          updated[i] = { ...behavior, action: e.target.value };
                                          setSchema({ ...schema, behaviors: updated });
                                        }}
                                        className="border rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      >
                                        <option value="triggerWorkflow">Trigger Workflow</option>
                                        <option value="callAuditor">Call Auditor</option>
                                        <option value="enforceRules">Enforce Rules</option>
                                        <option value="queueJob">Queue Job (Worker)</option>
                                        <option value="sendNotification">Send Notification</option>
                                      </select>
                                      <select
                                        value={behavior.target || ''}
                                        onChange={(e) => {
                                          const updated = [...schema.behaviors];
                                          updated[i] = { ...behavior, target: e.target.value };
                                          setSchema({ ...schema, behaviors: updated });
                                        }}
                                        className="flex-1 border rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      >
                                        <option value="">Select component...</option>
                                        {availableComponents
                                          .filter((c: any) => {
                                            if (behavior.action === 'triggerWorkflow') return c.type === 'workflow';
                                            if (behavior.action === 'callAuditor') return c.type === 'auditor';
                                            if (behavior.action === 'enforceRules') return c.type === 'enforcer';
                                            if (behavior.action === 'queueJob') return c.type === 'worker';
                                            if (behavior.action === 'sendNotification') return c.type === 'helper';
                                            return false;
                                          })
                                          .map((c: any) => (
                                            <option key={c.id} value={c.name}>
                                              {c.name}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                  </>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const updated = schema.behaviors.filter((_: any, idx: number) => idx !== i);
                                  setSchema({ ...schema, behaviors: updated });
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Behavior Examples */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 shadow-sm">
                      <div className="flex items-start space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-900 font-bold">Examples:</p>
                      </div>
                      <div className="text-xs text-blue-800 space-y-1.5 font-medium">
                        <div><strong>Custom Method:</strong> Product.restock(quantity)</div>
                        <div><strong>After Create:</strong> Trigger "Welcome Workflow"</div>
                        <div><strong>Before Delete:</strong> Enforce "Deletion Rules"</div>
                        <div><strong>After Update:</strong> Call "Change Auditor"</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

              <div className="rounded-xl bg-gray-100 border border-gray-200 p-4">
                <details>
                  <summary className="cursor-pointer text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">
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
                    className="rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isEditing ? 'Update Component' : 'Save Component'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

