import { useState, useEffect } from 'react';
import { generateApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  Loader2,
  ChevronDown,
  ChevronRight,
  Database,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface MagicImproveModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Improvement {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'easy' | 'medium' | 'hard';
  action: {
    type: string;
    targetComponent?: string;
    details: any;
  };
  selected?: boolean;
}

interface Analysis {
  analysis: {
    summary: string;
    strengths: string[];
    gaps: string[];
  };
  improvements: Improvement[];
  estimatedImpact: string;
}

export function MagicImproveModal({ projectId, projectName, onClose, onSuccess }: MagicImproveModalProps) {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedImprovements, setSelectedImprovements] = useState<Set<number>>(new Set());
  const [expandedImprovements, setExpandedImprovements] = useState<Set<number>>(new Set());
  const [projectContext, setProjectContext] = useState<any>(null);
  const [analysisPhase, setAnalysisPhase] = useState<string>('Starting analysis...');
  const [applyProgress, setApplyProgress] = useState<{
    current: number;
    total: number;
    currentItem: string;
    status: 'processing' | 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    analyzeProject();
  }, []);

  const analyzeProject = async () => {
    try {
      setLoading(true);
      setAnalysisPhase('Loading project components...');
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UX
      
      setAnalysisPhase('Analyzing architecture and relationships...');
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
      
      setAnalysisPhase('AI is examining your system deeply...');
      
      const result = await generateApi.magicImprove(projectId);
      
      setAnalysisPhase('Processing recommendations...');
      
      setAnalysis(result.analysis);
      setProjectContext(result.projectContext);
      
      // Auto-select all high priority improvements
      const highPriorityIndexes = result.analysis.improvements
        .map((imp: Improvement, idx: number) => imp.priority === 'high' ? idx : -1)
        .filter((idx: number) => idx !== -1);
      setSelectedImprovements(new Set(highPriorityIndexes));
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UX
      
      showToast(`Found ${result.analysis.improvements.length} improvements!`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to analyze project', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleImprovement = (index: number) => {
    const newSelected = new Set(selectedImprovements);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedImprovements(newSelected);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedImprovements);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedImprovements(newExpanded);
  };

  const applyImprovements = async () => {
    if (selectedImprovements.size === 0) {
      showToast('Please select at least one improvement', 'error');
      return;
    }

    const improvementsToApply = Array.from(selectedImprovements).map(idx => analysis!.improvements[idx]);

    try {
      setApplying(true);
      setApplyProgress({
        current: 0,
        total: improvementsToApply.length,
        currentItem: 'Initializing...',
        status: 'processing',
      });
      
      const results: any[] = [];
      let successCount = 0;
      let failedCount = 0;
      
      // Apply each improvement ONE AT A TIME to show real progress
      for (let i = 0; i < improvementsToApply.length; i++) {
        const improvement = improvementsToApply[i];
        
        setApplyProgress({
          current: i,
          total: improvementsToApply.length,
          currentItem: improvement.title,
          status: 'processing',
        });
        
        try {
          // Call backend for THIS improvement
          const result = await generateApi.applyImprovement(projectId, improvement);
          
          if (result.success) {
            successCount++;
            results.push({ ...result, improvement: improvement.title });
          } else {
            failedCount++;
            results.push({ success: false, error: result.error, improvement: improvement.title });
          }
        } catch (error: any) {
          failedCount++;
          results.push({ 
            success: false, 
            error: error.message || 'Failed to apply', 
            improvement: improvement.title 
          });
        }
        
        // Update progress after completing this improvement
        setApplyProgress({
          current: i + 1,
          total: improvementsToApply.length,
          currentItem: improvement.title,
          status: 'processing',
        });
      }
      
      // All done!
      setApplyProgress({
        current: improvementsToApply.length,
        total: improvementsToApply.length,
        currentItem: 'Complete!',
        status: successCount > 0 ? 'success' : 'error',
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (successCount > 0) {
        showToast(`✨ Applied ${successCount}/${improvementsToApply.length} improvements!`, 'success');
        
        if (failedCount > 0) {
          showToast(`⚠️ ${failedCount} improvements failed - check console`, 'error');
          console.error('Failed improvements:', results.filter((r: any) => !r.success));
        }
        
        onSuccess();
        onClose();
      } else {
        showToast('No improvements were applied successfully', 'error');
        console.error('All improvements failed:', results);
        setApplying(false);
        setApplyProgress(null);
      }
    } catch (error: any) {
      setApplyProgress({
        current: 0,
        total: improvementsToApply.length,
        currentItem: 'Error occurred',
        status: 'error',
      });
      showToast(error.message || 'Failed to apply improvements', 'error');
      setTimeout(() => {
        setApplying(false);
        setApplyProgress(null);
      }, 2000);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'easy': return '⚡';
      case 'medium': return '⚙️';
      case 'hard': return '🔨';
      default: return '🔧';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'missing_component': return Database;
      case 'missing_relationship': return ArrowRight;
      case 'schema_improvement': return Database;
      case 'architecture': return Settings;
      case 'integration': return Zap;
      default: return Sparkles;
    }
  };

  const selectAll = () => {
    if (analysis) {
      const allIndexes = analysis.improvements.map((_, idx) => idx);
      setSelectedImprovements(new Set(allIndexes));
    }
  };

  const selectNone = () => {
    setSelectedImprovements(new Set());
  };

  const selectHighPriority = () => {
    if (analysis) {
      const highPriorityIndexes = analysis.improvements
        .map((imp, idx) => imp.priority === 'high' ? idx : -1)
        .filter(idx => idx !== -1);
      setSelectedImprovements(new Set(highPriorityIndexes));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your System</h3>
            <p className="text-gray-600 mb-6">{analysisPhase}</p>
            
            {/* Progress steps */}
            <div className="mb-6 space-y-3 text-left max-w-md mx-auto">
              <div className={`flex items-center space-x-3 transition-all ${analysisPhase.includes('Loading') ? 'text-blue-600' : 'text-green-600'}`}>
                {analysisPhase.includes('Loading') ? (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">Load project components</span>
              </div>
              
              <div className={`flex items-center space-x-3 transition-all ${
                analysisPhase.includes('Analyzing') ? 'text-blue-600' : 
                analysisPhase.includes('AI') || analysisPhase.includes('Processing') ? 'text-green-600' : 
                'text-gray-400'
              }`}>
                {analysisPhase.includes('Analyzing') ? (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : analysisPhase.includes('AI') || analysisPhase.includes('Processing') ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">Analyze architecture & relationships</span>
              </div>
              
              <div className={`flex items-center space-x-3 transition-all ${
                analysisPhase.includes('AI') ? 'text-blue-600' : 
                analysisPhase.includes('Processing') ? 'text-green-600' : 
                'text-gray-400'
              }`}>
                {analysisPhase.includes('AI') ? (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : analysisPhase.includes('Processing') ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">Deep AI analysis (GPT-4)</span>
              </div>
              
              <div className={`flex items-center space-x-3 transition-all ${
                analysisPhase.includes('Processing') ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {analysisPhase.includes('Processing') ? (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">Generate recommendations</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <span className="text-xs">Using GPT-4 for deep analysis • This may take 30-60 seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const highPriorityCount = analysis.improvements.filter(i => i.priority === 'high').length;
  const mediumPriorityCount = analysis.improvements.filter(i => i.priority === 'medium').length;
  const lowPriorityCount = analysis.improvements.filter(i => i.priority === 'low').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Magic Improve</h2>
                <p className="text-blue-100 mt-1">AI-Powered System Enhancement</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Project Overview */}
          {projectContext && (
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Project: {projectName}</span>
              </h3>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <div className="p-3 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Total</div>
                  <div className="text-2xl font-bold text-gray-900">{projectContext.totalComponents}</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">Elements</div>
                  <div className="text-2xl font-bold text-blue-700">{projectContext.componentCounts.elements}</div>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                  <div className="text-xs text-indigo-600 mb-1">APIs</div>
                  <div className="text-2xl font-bold text-indigo-700">{projectContext.componentCounts.apis}</div>
                </div>
                <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                  <div className="text-xs text-cyan-600 mb-1">Auth</div>
                  <div className="text-2xl font-bold text-cyan-700">{projectContext.componentCounts.auth || 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1">Others</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {projectContext.totalComponents - projectContext.componentCounts.elements - projectContext.componentCounts.apis - (projectContext.componentCounts.auth || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Analysis Summary</span>
            </h3>
            <p className="text-sm text-gray-700 mb-4">{analysis.analysis.summary}</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-sm text-green-900">Strengths</h4>
                </div>
                <ul className="space-y-1.5">
                  {analysis.analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-xs text-green-800 flex items-start space-x-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-sm text-amber-900">Areas to Improve</h4>
                </div>
                <ul className="space-y-1.5">
                  {analysis.analysis.gaps.map((gap, idx) => (
                    <li key={idx} className="text-xs text-amber-800 flex items-start space-x-2">
                      <span className="text-amber-600 mt-0.5">!</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Improvement Statistics */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="font-bold text-gray-900">
                Suggested Improvements ({analysis.improvements.length})
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-semibold border ${getPriorityColor('high')}`}>
                  {highPriorityCount} High
                </span>
                <span className={`px-2 py-1 rounded-full font-semibold border ${getPriorityColor('medium')}`}>
                  {mediumPriorityCount} Medium
                </span>
                <span className={`px-2 py-1 rounded-full font-semibold border ${getPriorityColor('low')}`}>
                  {lowPriorityCount} Low
                </span>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={selectHighPriority}
                className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
              >
                High Priority
              </button>
              <button
                onClick={selectAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                className="text-xs font-medium text-gray-600 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Improvements List */}
          <div className="space-y-3">
            {analysis.improvements.map((improvement, idx) => {
              const isSelected = selectedImprovements.has(idx);
              const isExpanded = expandedImprovements.has(idx);
              const CategoryIcon = getCategoryIcon(improvement.category);

              return (
                <div
                  key={idx}
                  className={`rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleImprovement(idx)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1">
                            <CategoryIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            <h4 className="font-bold text-gray-900 text-sm">{improvement.title}</h4>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(improvement.priority)}`}>
                              {improvement.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getEffortIcon(improvement.effort)} {improvement.effort}
                            </span>
                            <button
                              onClick={() => toggleExpanded(idx)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">{improvement.description}</p>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                            {/* Impact */}
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                              <div className="flex items-start space-x-2">
                                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-semibold text-green-900 mb-1">Impact</div>
                                  <div className="text-xs text-green-800">{improvement.impact}</div>
                                </div>
                              </div>
                            </div>

                            {/* Action Details */}
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                              <div className="text-xs font-semibold text-blue-900 mb-2">Action Plan</div>
                              <div className="space-y-1 text-xs text-blue-800">
                                <div><span className="font-medium">Type:</span> {improvement.action.type.replace(/_/g, ' ')}</div>
                                {improvement.action.targetComponent && (
                                  <div><span className="font-medium">Target:</span> {improvement.action.targetComponent}</div>
                                )}
                                {improvement.action.details.componentType && (
                                  <div><span className="font-medium">Component:</span> {improvement.action.details.componentType}</div>
                                )}
                                {improvement.action.details.name && (
                                  <div><span className="font-medium">Name:</span> {improvement.action.details.name}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estimated Impact */}
          <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-purple-900 mb-2">Estimated Impact</h3>
                <p className="text-sm text-purple-800">{analysis.estimatedImpact}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 p-6 rounded-b-2xl">
          {applyProgress ? (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        applyProgress.status === 'success' ? 'bg-green-500' :
                        applyProgress.status === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${(applyProgress.current / applyProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 min-w-[60px] text-right">
                  {applyProgress.current}/{applyProgress.total}
                </span>
              </div>
              
              {/* Current item */}
              <div className="flex items-center space-x-2 text-sm">
                {applyProgress.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                {applyProgress.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {applyProgress.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className={`font-medium ${
                  applyProgress.status === 'success' ? 'text-green-600' :
                  applyProgress.status === 'error' ? 'text-red-600' :
                  'text-gray-700'
                }`}>
                  {applyProgress.currentItem}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{selectedImprovements.size}</span> of{' '}
                <span className="font-semibold text-gray-900">{analysis.improvements.length}</span> improvements selected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={applying}
                  className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={applyImprovements}
                  disabled={selectedImprovements.size === 0 || applying}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Apply Selected Improvements</span>
                  </>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

