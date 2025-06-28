import React from "react";

const ActivityLog = ({ log }) => (
  <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
    <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
    <div className="bg-black/30 rounded p-3 h-64 overflow-y-auto">
      {log.length > 0 ? (
        <ul className="text-sm space-y-1">
          {log.slice(-20).map((line, idx) => (
            <li key={idx} className="text-gray-300">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic">No activity yet...</p>
      )}
    </div>
  </div>
);

export default ActivityLog;
