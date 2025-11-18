interface ComponentStatsProps {
  components: Array<{ type: string }>;
}

export function ComponentStats({ components }: ComponentStatsProps) {
  const stats = {
    element: components.filter((c) => c.type === 'element').length,
    manipulator: components.filter((c) => c.type === 'manipulator').length,
    worker: components.filter((c) => c.type === 'worker').length,
    helper: components.filter((c) => c.type === 'helper').length,
    auth: components.filter((c) => c.type === 'auth').length,
    auditor: components.filter((c) => c.type === 'auditor').length,
    enforcer: components.filter((c) => c.type === 'enforcer').length,
    workflow: components.filter((c) => c.type === 'workflow').length,
  };

  const total = components.length;

  if (total === 0) return null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">
        Component Summary
      </h4>
      <div className="space-y-2">
        {stats.element > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>🔷</span>
              <span className="text-gray-600">Elements</span>
            </span>
            <span className="font-semibold text-blue-600">{stats.element}</span>
          </div>
        )}
        {stats.manipulator > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>🌐</span>
              <span className="text-gray-600">APIs</span>
            </span>
            <span className="font-semibold text-indigo-600">{stats.manipulator}</span>
          </div>
        )}
        {stats.worker > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>⚙️</span>
              <span className="text-gray-600">Workers</span>
            </span>
            <span className="font-semibold text-purple-600">{stats.worker}</span>
          </div>
        )}
        {stats.helper > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>🔧</span>
              <span className="text-gray-600">Helpers</span>
            </span>
            <span className="font-semibold text-yellow-600">{stats.helper}</span>
          </div>
        )}
        {stats.auth > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>🔐</span>
              <span className="text-gray-600">Auth</span>
            </span>
            <span className="font-semibold text-cyan-600">{stats.auth}</span>
          </div>
        )}
        {stats.auditor > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>📋</span>
              <span className="text-gray-600">Auditors</span>
            </span>
            <span className="font-semibold text-green-600">{stats.auditor}</span>
          </div>
        )}
        {stats.enforcer > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>✅</span>
              <span className="text-gray-600">Enforcers</span>
            </span>
            <span className="font-semibold text-red-600">{stats.enforcer}</span>
          </div>
        )}
        {stats.workflow > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <span>🔄</span>
              <span className="text-gray-600">Workflows</span>
            </span>
            <span className="font-semibold text-pink-600">{stats.workflow}</span>
          </div>
        )}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-gray-700">Total</span>
            <span className="text-gray-900">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

