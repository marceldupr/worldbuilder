import { useState } from 'react';
import { componentsApi } from '../../lib/api';
import { showToast } from '../ui/toast';

interface AuthModalProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSuccess: (component: any) => void;
}

const authProviders = [
  { value: 'supabase', label: 'Supabase', icon: '⚡', description: 'Full auth + database' },
  { value: 'auth0', label: 'Auth0', icon: '🔐', description: 'Enterprise auth service' },
  { value: 'jwt', label: 'JWT', icon: '🔑', description: 'Custom JWT implementation' },
];

const authFeatures = [
  { value: 'email_password', label: 'Email/Password', description: 'Traditional signup/login' },
  { value: 'magic_link', label: 'Magic Link', description: 'Passwordless email login' },
  { value: 'oauth', label: 'OAuth Providers', description: 'Google, GitHub, etc.' },
  { value: 'mfa', label: 'Multi-Factor Auth', description: '2FA via SMS or authenticator' },
  { value: 'password_reset', label: 'Password Reset', description: 'Email-based reset flow' },
  { value: 'email_verification', label: 'Email Verification', description: 'Verify email on signup' },
];

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'manager', label: 'Manager', description: 'Manage users and content' },
  { value: 'user', label: 'User', description: 'Standard user access' },
  { value: 'guest', label: 'Guest', description: 'Limited read-only access' },
];

export function AuthModal({
  projectId,
  position,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [name, setName] = useState('Authentication');
  const [provider, setProvider] = useState('supabase');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'email_password',
    'password_reset',
    'email_verification',
  ]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    'admin',
    'user',
  ]);
  const [enableRBAC, setEnableRBAC] = useState(true);
  const [loading, setLoading] = useState(false);

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  }

  async function handleCreate() {
    if (!name.trim()) {
      showToast('Please provide a name', 'error');
      return;
    }

    if (selectedFeatures.length === 0) {
      showToast('Please select at least one auth feature', 'error');
      return;
    }

    if (enableRBAC && selectedRoles.length === 0) {
      showToast('Please select at least one role', 'error');
      return;
    }

    setLoading(true);
    try {
      const schema = {
        provider,
        features: selectedFeatures,
        rbac: enableRBAC ? {
          enabled: true,
          roles: selectedRoles,
          defaultRole: 'user',
          hierarchy: {
            guest: 1,
            user: 2,
            manager: 3,
            admin: 4,
          },
        } : null,
        endpoints: {
          signup: '/auth/signup',
          login: '/auth/login',
          logout: '/auth/logout',
          refresh: '/auth/refresh',
          ...(selectedFeatures.includes('password_reset') && {
            resetRequest: '/auth/reset-request',
            resetConfirm: '/auth/reset-confirm',
          }),
          ...(selectedFeatures.includes('email_verification') && {
            verify: '/auth/verify',
          }),
        },
      };

      const component = await componentsApi.create({
        projectId,
        type: 'auth',
        name: name.trim(),
        description: `Authentication with ${provider} and ${selectedFeatures.length} features`,
        schema,
        position,
      });

      showToast('Authentication component created!', 'success');
      onSuccess(component);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create component', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Setup Authentication 🔐
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Configure user authentication and role-based access control for your application.
          </p>
        </div>

        <div className="space-y-6">
          {/* Component Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Component Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Authentication"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Auth Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {authProviders.map((prov) => (
                <button
                  key={prov.value}
                  onClick={() => setProvider(prov.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    provider === prov.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{prov.icon}</span>
                    <span className="font-semibold text-gray-900">{prov.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{prov.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Auth Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Authentication Features
            </label>
            <div className="space-y-2">
              {authFeatures.map((feature) => (
                <div
                  key={feature.value}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.value)}
                      onChange={() => toggleFeature(feature.value)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{feature.label}</span>
                      <p className="text-xs text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RBAC */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Role-Based Access Control (RBAC)
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableRBAC}
                  onChange={(e) => setEnableRBAC(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Enable RBAC</span>
              </label>
            </div>

            {enableRBAC && (
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  User Roles
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((role) => (
                    <div
                      key={role.value}
                      className="flex items-center space-x-2 rounded bg-white border border-purple-200 p-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.value)}
                        onChange={() => toggleRole(role.value)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{role.label}</div>
                        <div className="text-xs text-gray-600">{role.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-purple-700">
                  ✓ Generates role hierarchy: {selectedRoles.join(' < ')}
                  <br />
                  ✓ Permission middleware for all Data APIs
                  <br />
                  ✓ Role-based route protection
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              Generated Endpoints:
            </h4>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <div>POST /auth/signup - Create new user</div>
              <div>POST /auth/login - Login user</div>
              <div>POST /auth/logout - Logout user</div>
              <div>POST /auth/refresh - Refresh token</div>
              {selectedFeatures.includes('password_reset') && (
                <>
                  <div>POST /auth/reset-request - Request password reset</div>
                  <div>POST /auth/reset-confirm - Confirm password reset</div>
                </>
              )}
              {selectedFeatures.includes('email_verification') && (
                <div>GET /auth/verify?token=... - Verify email</div>
              )}
              {enableRBAC && (
                <>
                  <div className="mt-2 text-gray-700 not-italic">+ RBAC Middleware:</div>
                  <div>• requireRole(role) - Check user role</div>
                  <div>• requireAdmin() - Admin only</div>
                  <div>• requireOwnership() - Resource owner</div>
                </>
              )}
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
            disabled={loading || !name.trim() || selectedFeatures.length === 0}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Auth System ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

