import React from 'react';

/**
 * Renders a vertical stop-by-stop route timeline.
 * stops: Array<{ stop: { stopName, _id }, order: number }>
 */
const RouteTimeline = ({ stops = [], compact = false }) => {
  const ordered = [...stops].sort((a, b) => a.order - b.order);
  if (!ordered.length) return <p className="text-sm text-gray-400">No stops defined</p>;

  return (
    <div className="space-y-0">
      {ordered.map((s, i) => {
        const isFirst = i === 0;
        const isLast  = i === ordered.length - 1;
        const name    = s.stop?.stopName || s.stop?.name || `Stop ${s.order}`;

        return (
          <div key={i} className="flex gap-3">
            {/* connector */}
            <div className="flex flex-col items-center w-5 flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ring-2 ring-white flex-shrink-0 mt-1 ${
                isFirst ? 'bg-emerald-500 ring-emerald-200' : isLast ? 'bg-red-400 ring-red-200' : 'bg-indigo-400 ring-indigo-200'
              }`} />
              {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-0.5 min-h-[16px]" />}
            </div>
            {/* label */}
            <div className={`pb-3 ${compact ? 'pb-2' : ''}`}>
              <p className={`text-sm leading-tight font-medium ${isFirst ? 'text-emerald-700' : isLast ? 'text-red-600' : 'text-gray-700'}`}>
                {name}
                {isFirst && <span className="ml-1.5 text-[9px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">Start</span>}
                {isLast  && <span className="ml-1.5 text-[9px] uppercase tracking-wider font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded">End</span>}
              </p>
              {!compact && <p className="text-[10px] text-gray-400 mt-0.5">Stop {s.order}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RouteTimeline;
