import { useState } from 'react';
import { generateApi, componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { 
  Database, X, Sparkles, RotateCcw, Check, Trash2, 
  Plus, Lightbulb, ChevronRight, ChevronDown, Loader2,
  RefreshCw, Workflow as WorkflowIcon, ClipboardCheck, 
  Lock as LockIcon, Settings, Wrench
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
  const [step, setStep] = useState<'describe' | 'review' | 'reviewSuggestions'>(existingComponent ? 'review' : 'describe');
  const [name, setName] = useState(existingComponent?.name || '');
  const [description, setDescription] = useState(existingComponent?.description || '');
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<any>(existingComponent?.schema || null);
  const [showBehaviors, setShowBehaviors] = useState(false);
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [createdSupportElements, setCreatedSupportElements] = useState<any[]>([]);
  const [allCreatedComponents, setAllCreatedComponents] = useState<any[]>([]);
  const [suggestedElements, setSuggestedElements] = useState<any[]>([]);
  const [suggestedComponents, setSuggestedComponents] = useState<any>({
    workflows: [],
    auditors: [],
    enforcers: [],
    workers: [],
    helpers: []
  });
  const [creationProgress, setCreationProgress] = useState<{current: number; total: number; message: string; phase?: string} | null>(null);

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
    setCreationProgress({
      phase: 'AI Analysis',
      current: 1,
      total: 1,
      message: '🤖 AI is analyzing your description and generating schemas for all related components...'
    });
    
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

      console.log('[ElementModal] AI response:', result);
      
      // Validate schema structure
      if (!result || !result.schema) {
        throw new Error('Invalid response from AI - no schema returned');
      }
      
      if (!result.schema.properties || !Array.isArray(result.schema.properties)) {
        console.error('[ElementModal] Invalid schema structure:', result.schema);
        throw new Error('Invalid schema structure - properties must be an array');
      }

      // Check if there are missing components (just names, no schemas yet)
      const hasMissing = result.missingComponents && 
        Object.values(result.missingComponents).some((arr: any) => arr && arr.length > 0);
      
      // Clear loading overlay FIRST before any state updates
      setCreationProgress(null);
      setLoading(false);
      
      setSchema(result.schema);
      
      if (hasMissing) {
        console.log('[ElementModal] Missing components detected:', result.missingComponents);
        
        // Initialize selection state with all components selected by default
        const initialElements = (result.missingComponents.elements || []).map((name: string) => ({ 
          name, 
          selected: true,
          type: 'element' as const
        }));
        const initialWorkflows = (result.missingComponents.workflows || []).map((name: string) => ({ 
          name, 
          selected: true,
          type: 'workflow' as const
        }));
        const initialAuditors = (result.missingComponents.auditors || []).map((name: string) => ({ 
          name, 
          selected: true,
          type: 'auditor' as const
        }));
        const initialEnforcers = (result.missingComponents.enforcers || []).map((name: string) => ({ 
          name, 
          selected: true,
          type: 'enforcer' as const
        }));
        const initialWorkers = (result.missingComponents.workers || []).map((name: string) => ({ 
          name, 
          selected: true,
          type: 'worker' as const
        }));
        const initialHelpers = (result.missingComponents.helpers || []).map((name: string) => ({ 
          name, 
          selected: true,
          type: 'helper' as const
        }));
        
        setSuggestedElements(initialElements);
        setSuggestedComponents({
          workflows: initialWorkflows,
          auditors: initialAuditors,
          enforcers: initialEnforcers,
          workers: initialWorkers,
          helpers: initialHelpers,
        });
        
        setStep('reviewSuggestions');
        
        const totalSuggested = 
          initialElements.length +
          initialWorkflows.length +
          initialAuditors.length +
          initialEnforcers.length +
          initialWorkers.length +
          initialHelpers.length;
          
        showToast(`✨ Found ${totalSuggested} related component(s). Select which to create.`, 'success');
      } else {
        // No missing components - go straight to review
        setStep('review');
        showToast(isEditing ? 'Schema updated with AI!' : 'Schema generated successfully!', 'success');
      }
    } catch (error: any) {
      console.error('[ElementModal] Error generating schema:', error);
      setCreationProgress(null);
      setLoading(false);
      showToast(`❌ Error: ${error.message || 'Failed to generate schema'}`, 'error');
    }
  }

  async function handleGenerateSelected() {
    // Collect all selected components
    const selectedItems = [
      ...suggestedElements.filter((el: any) => el.selected),
      ...suggestedComponents.workflows.filter((w: any) => w.selected),
      ...suggestedComponents.auditors.filter((a: any) => a.selected),
      ...suggestedComponents.enforcers.filter((e: any) => e.selected),
      ...suggestedComponents.workers.filter((w: any) => w.selected),
      ...suggestedComponents.helpers.filter((h: any) => h.selected),
    ];
    
    if (selectedItems.length === 0) {
      showToast('Please select at least one component to generate', 'error');
      return;
    }
    
    setLoading(true);
    setCreationProgress({
      phase: 'Generating Schemas',
      current: 0,
      total: selectedItems.length,
      message: `🤖 Generating schemas for ${selectedItems.length} component(s)...`
    });
    
    try {
      const generatedElements = [];
      const generatedComponents: any = {
        workflows: [],
        auditors: [],
        enforcers: [],
        workers: [],
        helpers: [],
      };
      
      let completed = 0;
      
      // Generate schemas for each selected component
      for (const item of selectedItems) {
        try {
          console.log(`[ElementModal] Generating schema for ${item.type}: ${item.name}`);
          
          const result = await generateApi.single({
            componentType: item.type,
            name: item.name,
            relatedTo: name.trim(),
          });
          
          const componentWithSchema = {
            ...item,
            schema: result.schema,
            description: result.description,
            approved: true,
          };
          
          if (item.type === 'element') {
            generatedElements.push(componentWithSchema);
          } else {
            generatedComponents[item.type + 's'].push(componentWithSchema);
          }
          
          completed++;
          setCreationProgress({
            phase: 'Generating Schemas',
            current: completed,
            total: selectedItems.length,
            message: `🤖 Generated ${completed} of ${selectedItems.length} schemas...`
          });
          
        } catch (error: any) {
          console.error(`[ElementModal] Failed to generate ${item.name}:`, error);
          showToast(`⚠️ Failed to generate ${item.name}`, 'error');
        }
      }
      
      // Clear progress and update state
      setCreationProgress(null);
      setLoading(false);
      
      setSuggestedElements(generatedElements);
      setSuggestedComponents(generatedComponents);
      
      // Now proceed to show the approval screen with full schemas
      showToast(`✨ Successfully generated ${completed} schema(s)!`, 'success');
      
    } catch (error: any) {
      console.error('[ElementModal] Error during schema generation:', error);
      setCreationProgress(null);
      setLoading(false);
      showToast(`❌ Error: ${error.message || 'Failed to generate schemas'}`, 'error');
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
    <>
      {/* Progress Overlay */}
      {(creationProgress || loading) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 border border-gray-200/50">
            {/* Header with Icon */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30 relative">
                <Sparkles className="w-7 h-7 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {creationProgress?.phase || 'Processing'}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  AI is working its magic
                </p>
              </div>
            </div>
            
            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                {creationProgress?.message || '🤖 AI is analyzing your description and generating schemas...'}
              </p>
            </div>
            
            {/* Progress Bar */}
            {creationProgress && (
              <div className="mb-6">
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span>Progress</span>
                  <span className="text-purple-600">{creationProgress.current} of {creationProgress.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg relative"
                    style={{ width: `${(creationProgress.current / creationProgress.total) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Info Box */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200/50 p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 rounded-lg bg-white shadow-sm">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {creationProgress 
                    ? 'This may take a moment depending on the number of components...'
                    : 'AI is analyzing your description and generating schemas...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
                      <span>{isEditing ? 'AI is updating...' : 'AI is generating...'}</span>
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
        ) : step === 'reviewSuggestions' ? (
          <>
            {/* Review Suggested Elements Step */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Review AI-Suggested Elements
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      AI found related components. Select which ones you want, then generate their schemas.
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
              <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 p-4">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-purple-900 mb-1">AI Generated Suggestions</h4>
                    <p className="text-xs text-purple-700">
                      Based on your {name} element, AI identified related components and dependencies.
                      Review and select which ones to create. All are selected by default for your convenience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Suggested Elements */}
                {suggestedElements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span>Elements ({suggestedElements.length})</span>
                    </h3>
                    <div className="space-y-2">
                {suggestedElements.map((suggested: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{suggested.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{suggested.reason}</p>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={suggested.selected !== false}
                          onChange={(e) => {
                            const updated = [...suggestedElements];
                            updated[idx] = { ...suggested, selected: e.target.checked };
                            setSuggestedElements(updated);
                          }}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">Select</span>
                      </label>
                    </div>

                    {/* Properties Preview (only if schema exists) */}
                    {suggested.schema && (
                      <div className="mt-3">
                        <h4 className="text-xs font-bold text-gray-700 mb-2">Properties ({suggested.schema.schema?.properties?.length || suggested.schema.properties?.length || 0}):</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(suggested.schema.schema?.properties || suggested.schema.properties || []).slice(0, 6).map((prop: any, i: number) => (
                            <div key={i} className="text-xs bg-gray-50 px-2 py-1 rounded">
                              <span className="font-semibold">{prop.name}</span>: <span className="text-gray-600">{prop.type}</span>
                            </div>
                          ))}
                        </div>
                        {(suggested.schema.schema?.properties?.length || suggested.schema.properties?.length || 0) > 6 && (
                          <p className="text-xs text-gray-500 mt-1">+ {(suggested.schema.schema?.properties?.length || suggested.schema.properties?.length) - 6} more...</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                    </div>
                  </div>
                )}

                {/* Suggested Workflows */}
                {suggestedComponents.workflows.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <WorkflowIcon className="w-4 h-4 text-indigo-600" />
                      <span>Workflows ({suggestedComponents.workflows.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestedComponents.workflows.map((comp: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 flex items-start space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comp.selected !== false}
                              onChange={(e) => {
                                const updated = { ...suggestedComponents };
                                updated.workflows[idx] = { ...comp, selected: e.target.checked };
                                setSuggestedComponents(updated);
                              }}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </label>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{comp.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{comp.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Auditors */}
                {suggestedComponents.auditors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <ClipboardCheck className="w-4 h-4 text-green-600" />
                      <span>Auditors ({suggestedComponents.auditors.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestedComponents.auditors.map((comp: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-start space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comp.selected !== false}
                              onChange={(e) => {
                                const updated = { ...suggestedComponents };
                                updated.auditors[idx] = { ...comp, selected: e.target.checked };
                                setSuggestedComponents(updated);
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                          </label>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{comp.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{comp.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Enforcers */}
                {suggestedComponents.enforcers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <LockIcon className="w-4 h-4 text-red-600" />
                      <span>Enforcers ({suggestedComponents.enforcers.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestedComponents.enforcers.map((comp: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comp.selected !== false}
                              onChange={(e) => {
                                const updated = { ...suggestedComponents };
                                updated.enforcers[idx] = { ...comp, selected: e.target.checked };
                                setSuggestedComponents(updated);
                              }}
                              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                          </label>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{comp.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{comp.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Workers */}
                {suggestedComponents.workers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-orange-600" />
                      <span>Workers ({suggestedComponents.workers.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestedComponents.workers.map((comp: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-orange-200 bg-orange-50 p-3 flex items-start space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comp.selected !== false}
                              onChange={(e) => {
                                const updated = { ...suggestedComponents };
                                updated.workers[idx] = { ...comp, selected: e.target.checked };
                                setSuggestedComponents(updated);
                              }}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                          </label>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{comp.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{comp.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Helpers */}
                {suggestedComponents.helpers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-yellow-600" />
                      <span>Helpers ({suggestedComponents.helpers.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestedComponents.helpers.map((comp: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 flex items-start space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comp.selected !== false}
                              onChange={(e) => {
                                const updated = { ...suggestedComponents };
                                updated.helpers[idx] = { ...comp, selected: e.target.checked };
                                setSuggestedComponents(updated);
                              }}
                              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                            />
                          </label>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{comp.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{comp.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-5">
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('describe')}
                  className="rounded-xl bg-white border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={async () => {
                    // Check if any component has a schema - if not, generate schemas first
                    const hasSchemas = suggestedElements.some((el: any) => el.schema) ||
                      suggestedComponents.workflows.some((w: any) => w.schema) ||
                      suggestedComponents.auditors.some((a: any) => a.schema) ||
                      suggestedComponents.enforcers.some((e: any) => e.schema) ||
                      suggestedComponents.workers.some((w: any) => w.schema) ||
                      suggestedComponents.helpers.some((h: any) => h.schema);
                    
                    if (!hasSchemas) {
                      // Generate schemas for selected components
                      await handleGenerateSelected();
                      return;
                    }
                    
                    // Schemas exist - proceed with creation
                    setLoading(true);
                    try {
                      // Collect all selected components with schemas
                      const allToCreate: any[] = [];
                      
                      // Elements
                      suggestedElements.filter(s => s.selected !== false && s.schema).forEach(el => {
                        allToCreate.push({ ...el, componentType: 'element' });
                      });
                      
                      // Workflows
                      suggestedComponents.workflows.filter((s: any) => s.selected !== false && s.schema).forEach((wf: any) => {
                        allToCreate.push({ ...wf, componentType: 'workflow' });
                      });
                      
                      // Auditors
                      suggestedComponents.auditors.filter((s: any) => s.selected !== false && s.schema).forEach((aud: any) => {
                        allToCreate.push({ ...aud, componentType: 'auditor' });
                      });
                      
                      // Enforcers
                      suggestedComponents.enforcers.filter((s: any) => s.selected !== false && s.schema).forEach((enf: any) => {
                        allToCreate.push({ ...enf, componentType: 'enforcer' });
                      });
                      
                      // Workers
                      suggestedComponents.workers.filter((s: any) => s.selected !== false && s.schema).forEach((wrk: any) => {
                        allToCreate.push({ ...wrk, componentType: 'worker' });
                      });
                      
                      // Helpers
                      suggestedComponents.helpers.filter((s: any) => s.selected !== false && s.schema).forEach((hlp: any) => {
                        allToCreate.push({ ...hlp, componentType: 'helper' });
                      });
                      
                      const allCreated: any[] = [];
                      let yOffset = 0;
                      
                      const errors: string[] = [];
                      
                      for (let i = 0; i < allToCreate.length; i++) {
                        const comp = allToCreate[i];
                        
                        try {
                          // Show progress
                          setCreationProgress({
                            phase: 'Creating Components',
                            current: i + 1,
                            total: allToCreate.length,
                            message: `Creating ${comp.componentType}: ${comp.name}...`
                          });
                          
                          const created = await componentsApi.create({
                            projectId,
                            type: comp.componentType,
                            name: comp.name,
                            description: comp.description || `Support ${comp.componentType} for ${name}`,
                            schema: comp.schema.schema || comp.schema,
                            position: {
                              x: position.x + 350,
                              y: position.y + yOffset,
                            },
                          });
                          
                          allCreated.push(created);
                          onSuccess(created);
                          yOffset += 150;
                          
                          console.log(`[ElementModal] ✅ Created ${comp.componentType}: ${comp.name}`);
                        } catch (error: any) {
                          console.error(`[ElementModal] ❌ Failed to create ${comp.componentType}: ${comp.name}`, error);
                          errors.push(`${comp.name}: ${error.message || 'Unknown error'}`);
                        }
                        
                        // Small delay to prevent connection pool exhaustion
                        if (i < allToCreate.length - 1) {
                          await new Promise(resolve => setTimeout(resolve, 150));
                        }
                      }
                      
                      setCreationProgress(null); // Clear progress
                      
                      // Store elements separately for relationship highlighting
                      const createdElements = allCreated.filter(c => c.type === 'element');
                      setCreatedSupportElements(createdElements);
                      setAllCreatedComponents(allCreated);
                      
                      // Show results
                      if (allCreated.length > 0) {
                        const summary = Object.entries(
                          allCreated.reduce((acc: any, comp: any) => {
                            acc[comp.type] = (acc[comp.type] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([type, count]) => `${count} ${type}(s)`).join(', ');
                        
                        if (errors.length > 0) {
                          showToast(`⚠️ Created ${allCreated.length} component(s) with ${errors.length} error(s). Check console for details.`, 'error');
                          console.error('[ElementModal] Creation errors:', errors);
                        } else {
                          showToast(`✅ Successfully created ${allCreated.length} component(s): ${summary}`, 'success');
                        }
                      } else if (errors.length > 0) {
                        showToast(`❌ Failed to create components. See console for details.`, 'error');
                        console.error('[ElementModal] All creations failed:', errors);
                      }
                      
                      setStep('review');
                    } catch (error: any) {
                      setCreationProgress(null);
                      showToast(`❌ Error: ${error.message || 'Failed to create components'}`, 'error');
                      console.error('[ElementModal] Creation error:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {suggestedElements.some((el: any) => el.schema) ||
                         suggestedComponents.workflows.some((w: any) => w.schema) ||
                         suggestedComponents.auditors.some((a: any) => a.schema) ||
                         suggestedComponents.enforcers.some((e: any) => e.schema) ||
                         suggestedComponents.workers.some((w: any) => w.schema) ||
                         suggestedComponents.helpers.some((h: any) => h.schema)
                           ? 'Create Components →'
                           : 'Generate & Continue →'}
                      </span>
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
              {/* Auto-Create Banner */}
              {allCreatedComponents.length > 0 && (
                <div className="mb-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-4 shadow-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white mb-1">
                        ✨ Auto-Created {allCreatedComponents.length} Component{allCreatedComponents.length > 1 ? 's' : ''}
                      </h4>
                      <p className="text-xs text-green-50 mb-2">
                        The following components were automatically created and added to your canvas:
                      </p>
                      <div className="space-y-2">
                        {Object.entries(
                          allCreatedComponents.reduce((acc: any, comp: any) => {
                            if (!acc[comp.type]) acc[comp.type] = [];
                            acc[comp.type].push(comp);
                            return acc;
                          }, {})
                        ).map(([type, comps]: [string, any]) => (
                          <div key={type}>
                            <div className="text-xs text-green-100 font-semibold mb-1 uppercase">{type}s:</div>
                            <div className="flex flex-wrap gap-2">
                              {comps.map((comp: any) => (
                                <span key={comp.id} className="bg-white text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                  {comp.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-50 mt-3 font-medium">
                        💡 Click on any component to customize its properties and behavior
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Debug info if schema is invalid */}
              {schema && (!schema.properties || !Array.isArray(schema.properties) || schema.properties.length === 0) && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 mt-4">
                  <div className="flex items-start space-x-2">
                    <div className="text-red-600">⚠️</div>
                    <div>
                      <h4 className="text-sm font-bold text-red-900 mb-2">Invalid Schema Structure</h4>
                      <p className="text-xs text-red-700 mb-2">
                        The AI generated a schema with an unexpected structure. Please try regenerating or contact support.
                      </p>
                      <details className="text-xs text-red-600">
                        <summary className="cursor-pointer font-semibold mb-1">Debug Info</summary>
                        <pre className="bg-red-100 p-2 rounded mt-2 overflow-auto max-h-40">
                          {JSON.stringify(schema, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {schema && Array.isArray(schema.properties) && schema.properties.length > 0 && (
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

              {/* Relationships Section */}
              {schema && schema.relationships && schema.relationships.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-900">
                      Relationships ({schema.relationships.length})
                    </h4>
                    {createdSupportElements.length > 0 && (
                      <span className="text-xs text-green-600 font-semibold">
                        {createdSupportElements.length} auto-created ✨
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {schema.relationships.map((rel: any, i: number) => {
                      const isNewlyCreated = createdSupportElements.some(el => el.name === rel.to);
                      return (
                        <div 
                          key={i} 
                          className={`rounded-xl p-4 border-2 shadow-sm transition-all ${
                            isNewlyCreated 
                              ? 'bg-gradient-to-r from-green-50 via-green-100 to-green-50 border-green-400 ring-2 ring-green-300 ring-offset-1' 
                              : 'bg-white border-blue-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1">
                              {isNewlyCreated && (
                                <div className="flex-shrink-0">
                                  <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    ✨ AUTO-CREATED
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900 text-sm">{rel.fieldName}</span>
                                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                                    {rel.type || 'belongsTo'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs text-gray-600 font-medium">
                              {rel.from || name}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`text-xs font-bold ${isNewlyCreated ? 'text-green-700' : 'text-gray-900'}`}>
                              {rel.to}
                            </span>
                          </div>
                          {isNewlyCreated && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700 font-medium leading-relaxed">
                                  <strong>{rel.to}</strong> element was automatically created on your canvas with basic properties. 
                                  Click on it to customize its fields and add more details.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                                    <div className="space-y-2">
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
                                        <span className="text-gray-400">→</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={behavior.target || ''}
                                          onChange={(e) => {
                                            const updated = [...schema.behaviors];
                                            updated[i] = { ...behavior, target: e.target.value };
                                            setSchema({ ...schema, behaviors: updated });
                                          }}
                                          placeholder="Component name (e.g., EmailHelper, ProductAuditor)..."
                                          className="flex-1 border rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                                        />
                                        {availableComponents.filter((c: any) => {
                                          if (behavior.action === 'triggerWorkflow') return c.type === 'workflow';
                                          if (behavior.action === 'callAuditor') return c.type === 'auditor';
                                          if (behavior.action === 'enforceRules') return c.type === 'enforcer';
                                          if (behavior.action === 'queueJob') return c.type === 'worker';
                                          if (behavior.action === 'sendNotification') return c.type === 'helper';
                                          return false;
                                        }).length > 0 && (
                                          <select
                                            value=""
                                            onChange={(e) => {
                                              const updated = [...schema.behaviors];
                                              updated[i] = { ...behavior, target: e.target.value };
                                              setSchema({ ...schema, behaviors: updated });
                                            }}
                                            className="border rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50"
                                          >
                                            <option value="">or pick existing...</option>
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
                                        )}
                                      </div>
                                      {behavior.target && (
                                        <div className="text-xs text-purple-600 font-medium">
                                          Will call: {behavior.target}
                                        </div>
                                      )}
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
    </>
  );
}

