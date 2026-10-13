import React from 'react';

const baseBlock = 'rounded-xl bg-slate-200/80 animate-pulse';

export const SkeletonText = ({ width = '100%', className = '' }) => (
  <div className={`${baseBlock} h-3 ${className}`} style={{ width }} />
);

export const SkeletonAvatar = ({ size = 'w-10 h-10', className = '' }) => (
  <div className={`${baseBlock} ${size} ${className}`} />
);

export const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-xs">
    <div className="flex items-center gap-4">
      <div className={`${baseBlock} h-11 w-11 rounded-xl`} />
      <div className="flex-1 space-y-2">
        <div className={`${baseBlock} h-3 w-20`} />
        <div className={`${baseBlock} h-6 w-24`} />
      </div>
    </div>
  </div>
);

export const SkeletonStatValue = () => (
  <span className={`${baseBlock} inline-block h-7 w-12 align-middle`} aria-label="Loading" />
);

export const SkeletonTableRow = ({ columns = 5 }) => (
  <div
    className="grid items-center gap-3 px-5 py-3.5 border-b border-gray-100"
    style={{ gridTemplateColumns: `minmax(0, 1.7fr) repeat(${Math.max(columns - 2, 1)}, minmax(0, 1fr)) auto` }}
    aria-hidden="true"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={`${baseBlock} h-10 w-10 rounded-xl`} />
      <div className="space-y-2 flex-1 min-w-0">
        <div className={`${baseBlock} h-3.5 w-3/5`} />
        <div className={`${baseBlock} h-2.5 w-2/5`} />
      </div>
    </div>
    {Array.from({ length: Math.max(columns - 2, 1) }).map((_, index) => (
      <div key={index} className={`${baseBlock} h-3 w-full max-w-[120px] justify-self-start`} />
    ))}
    <div className={`${baseBlock} h-6 w-16 justify-self-end rounded-full`} />
  </div>
);

export const SkeletonTable = ({ rows = 6, columns = 5 }) => (
  <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
    <div
      className="hidden md:grid items-center gap-3 px-5 py-3.5 border-b border-gray-100"
      style={{ gridTemplateColumns: `minmax(0, 1.7fr) repeat(${Math.max(columns - 2, 1)}, minmax(0, 1fr)) auto` }}
      aria-hidden="true"
    >
      {Array.from({ length: columns }).map((_, index) => (
        <div key={index} className={`${baseBlock} h-3 w-4/5`} />
      ))}
    </div>
    <div>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonTableRow key={index} columns={columns} />
      ))}
    </div>
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200/80 shadow-xs p-4 ${className}`} aria-hidden="true">
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-11 h-11" />
        <div className="space-y-2">
          <SkeletonText width="110px" />
          <SkeletonText width="80px" className="h-2.5" />
        </div>
      </div>
      <div className={`${baseBlock} h-6 w-16 rounded-full`} />
    </div>
    <div className="space-y-3">
      <SkeletonText width="100%" />
      <SkeletonText width="85%" />
      <SkeletonText width="70%" className="h-2.5" />
    </div>
  </div>
);

export const SkeletonStopCard = () => (
  <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5" aria-hidden="true">
    <div className="flex items-center gap-3">
      <div className={`${baseBlock} h-10 w-10 rounded-xl`} />
      <div className="flex-1 space-y-2">
        <SkeletonText width="65%" />
        <SkeletonText width="40%" className="h-2.5" />
      </div>
    </div>
    <div className="my-4 border-t border-gray-100" />
    <div className="grid grid-cols-2 gap-3">
      <SkeletonText width="90%" />
      <SkeletonText width="75%" />
      <SkeletonText width="70%" />
      <SkeletonText width="85%" />
    </div>
  </div>
);

export const SkeletonAssignmentCard = () => (
  <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5" aria-hidden="true">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-11 h-11" />
        <div className="space-y-2">
          <SkeletonText width="110px" />
          <SkeletonText width="78px" className="h-2.5" />
        </div>
      </div>
      <div className={`${baseBlock} h-6 w-16 rounded-full`} />
    </div>
    <div className="my-4 border-t border-gray-100" />
    <div className="space-y-3">
      <div className="flex items-center gap-3"><SkeletonAvatar size="w-9 h-9" /><SkeletonText width="48%" /></div>
      <div className="flex items-center gap-3"><SkeletonAvatar size="w-9 h-9" /><SkeletonText width="62%" /></div>
    </div>
    <div className="mt-4 flex justify-end gap-2">
      <div className={`${baseBlock} h-8 w-16 rounded-lg`} />
      <div className={`${baseBlock} h-8 w-16 rounded-lg`} />
    </div>
  </div>
);

export const SkeletonCardGrid = ({ count = 6, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl border border-gray-200/80 p-3 shadow-xs">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <SkeletonText width="50%" />
            <SkeletonText width="70%" className="h-2.5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonMap = () => (
  <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-4" aria-hidden="true">
    <div className={`${baseBlock} h-72 w-full rounded-xl`} />
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className={`${baseBlock} h-12 rounded-xl`} />
      <div className={`${baseBlock} h-12 rounded-xl`} />
    </div>
  </div>
);

export const AdminSkeleton = ({ variant = 'table', count, ...props }) => {
  if (variant === 'card') return <SkeletonCardGrid count={count || 6} {...props} />;
  if (variant === 'stop') {
    return <div className={props.className || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>{Array.from({ length: count || 6 }).map((_, index) => <SkeletonStopCard key={index} />)}</div>;
  }
  if (variant === 'assignment') {
    return <div className={props.className || 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}>{Array.from({ length: count || 6 }).map((_, index) => <SkeletonAssignmentCard key={index} />)}</div>;
  }
  if (variant === 'list') return <SkeletonList count={count || 5} {...props} />;
  if (variant === 'map') return <SkeletonMap {...props} />;
  return <SkeletonTable {...props} />;
};

export default AdminSkeleton;
