import { useState } from 'react';
import { deployApi } from '../../lib/api';
import { showToast } from '../ui/toast';
import { X, Loader2, Upload } from 'lucide-react';

interface GitHubPushModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function GitHubPushModal({
  projectId,
  projectName,
  onClose,
}: GitHubPushModalProps) {
  const [repoName, setRepoName] = useState(
    projectName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [pushing, setPushing] = useState(false);

  async function handlePush() {
    if (!repoName.trim() || !githubToken.trim()) {
      showToast('Please provide repository name and GitHub token', 'error');
      return;
    }

    setPushing(true);
    try {
      const result = await deployApi.github(projectId, repoName, githubToken, isPrivate);
      
      showToast('Code pushed to GitHub successfully!', 'success');
      
      // Open GitHub repo in new tab
      if (result.repoUrl) {
        window.open(result.repoUrl, '_blank');
      }
      
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to push to GitHub', 'error');
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Push to GitHub 🐙
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Push your generated code to a GitHub repository.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Repository Name
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-awesome-app"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Need a token?{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Create one here
              </a>{' '}
              (requires 'repo' scope)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Create as private repository
            </label>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-blue-900">
              What happens next:
            </h4>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• A new repository will be created (or updated if exists)</li>
              <li>• All generated code files will be pushed</li>
              <li>• An initial commit will be created</li>
              <li>• You'll get a link to view your repository</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={pushing}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePush}
            disabled={pushing || !repoName.trim() || !githubToken.trim()}
            className="rounded-md bg-gray-900 px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pushing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pushing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Push to GitHub</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

