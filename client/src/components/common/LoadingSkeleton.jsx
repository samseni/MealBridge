export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-circle"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text w-2/3"></div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="skeleton-text w-24 mb-2"></div>
          <div className="skeleton h-8 w-16"></div>
        </div>
        <div className="skeleton-circle"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card card-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-48"></div>
              <div className="skeleton-text w-32"></div>
            </div>
            <div className="skeleton h-6 w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="skeleton-circle"></div>
          <div className="flex-1 space-y-2">
            <div className="skeleton-text"></div>
            <div className="skeleton-text w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default {
  Card: SkeletonCard,
  Stats: SkeletonStats,
  Table: SkeletonTable,
  List: SkeletonList,
  Page: PageLoader,
};