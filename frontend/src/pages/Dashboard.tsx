import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { projectsApi } from '../lib/api';
import { showToast, Toaster } from '../components/ui/toast';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { Plus, Trash2, Package, Loader2, Calendar, Clock, Sparkles, ArrowRight, Search, SortAsc, Grid3x3, List, X } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count?: { components: number };
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const newProject = await projectsApi.create({
        name: newProjectName,
        description: newProjectDescription,
      });
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProject(false);
      showToast('Project created successfully!', 'success');
      navigate(`/project/${newProject.id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete({ id, name });
  };

  const executeDeleteProject = async () => {
    if (!confirmDelete) return;

    try {
      await projectsApi.delete(confirmDelete.id);
      setProjects(projects.filter((p) => p.id !== confirmDelete.id));
      showToast('Project deleted', 'success');
      setConfirmDelete(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete project', 'error');
      setConfirmDelete(null);
    }
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Toaster />
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Worldbuilder
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600 bg-gray-100/50 px-3 py-1.5 rounded-full">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all hover:shadow-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">My Projects</h2>
              <p className="mt-2 text-sm text-gray-600">
                {projects.length > 0 
                  ? `${projects.length} project${projects.length !== 1 ? 's' : ''} • ${filteredProjects.length} displayed`
                  : 'Create and manage your applications'
                }
              </p>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 flex items-center space-x-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>New Project</span>
            </button>
          </div>

          {/* Search and filters */}
          {!loading && projects.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm bg-white/80 backdrop-blur-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'name')}
                  className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium bg-white/80 backdrop-blur-sm cursor-pointer hover:border-gray-400"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="created">Recently Created</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View mode toggle */}
              <div className="flex rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2.5 text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 text-sm font-medium transition-all border-l border-gray-300 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        {/* New project modal */}
        {showNewProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Create New Project</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="What does this app do?"
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewProject(false)}
                  disabled={creating}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProjectName.trim() || creating}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="text-center text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 font-medium">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 && projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              No projects yet
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
              Get started by creating your first project and bring your ideas to life
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              No projects found
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
              Try adjusting your search or create a new project
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all inline-flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear Search</span>
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredProjects.map((project, index) => {
              const createdDate = new Date(project.createdAt);
              const updatedDate = new Date(project.updatedAt);
              const isRecent = Date.now() - updatedDate.getTime() < 24 * 60 * 60 * 1000; // Updated in last 24h
              
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className={`group cursor-pointer rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-md hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:border-blue-300 relative animate-in fade-in slide-in-from-bottom-4 ${
                    viewMode === 'grid' ? 'hover:-translate-y-1' : 'hover:scale-[1.01]'
                  }`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50/80 group-hover:via-purple-50/50 group-hover:to-pink-50/80 transition-all duration-500 pointer-events-none"></div>
                  
                  {/* Content */}
                  <div className={`relative ${viewMode === 'grid' ? 'p-6' : 'p-5 flex items-center gap-6'}`}>
                    {viewMode === 'grid' ? (
                      <>
                        {/* Grid View Layout */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              {isRecent && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Active</span>
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300 truncate">
                              {project.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              ID: {project.id.slice(0, 8)}...
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteProject(project.id, project.name, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all rounded-lg p-1.5 hover:bg-red-50 hover:scale-110"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem] mb-4">
                          {project.description || (
                            <span className="text-gray-400 italic">No description provided</span>
                          )}
                        </p>

                        <div className="mb-4">
                          <div className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all">
                            <Package className="w-4 h-4" />
                            <span>{project._count?.components || 0}</span>
                            <span className="font-normal opacity-90">component{project._count?.components !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-200 group-hover:border-blue-200 transition-colors">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5 text-gray-600 group-hover:text-blue-600 transition-colors">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-medium">Created:</span>
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                              {createdDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5 text-gray-600 group-hover:text-purple-600 transition-colors">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-medium">Updated:</span>
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">
                              {updatedDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                              <span className="ml-1 text-gray-500">
                                {updatedDate.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 group-hover:border-blue-200 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <div className="flex items-center justify-center space-x-2 text-sm font-bold text-blue-600 group-hover:text-purple-600 transition-colors">
                            <span>Open Project</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* List View Layout */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all flex-shrink-0">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300 truncate">
                                {project.name}
                              </h3>
                              {isRecent && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm flex-shrink-0">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Active</span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {project.description || (
                                <span className="text-gray-400 italic">No description provided</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
                            <Package className="w-3.5 h-3.5" />
                            <span>{project._count?.components || 0}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center space-x-1.5 text-gray-600">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-medium text-gray-700">
                                {createdDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-gray-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-medium text-gray-700">
                                {updatedDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => deleteProject(project.id, project.name, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all rounded-lg p-2 hover:bg-red-50"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <ArrowRight className="w-5 h-5 text-blue-600 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete "${confirmDelete.name}"?`}
          message="This will permanently delete the project and all its components."
          details={[confirmDelete.name]}
          confirmText="Delete Project"
          cancelText="Cancel"
          variant="danger"
          onConfirm={executeDeleteProject}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

