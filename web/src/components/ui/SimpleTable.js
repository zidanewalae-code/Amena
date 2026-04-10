// Beginner-friendly simple table with optional sortable columns and actions.
import { useMemo, useState } from 'react';

export default function SimpleTable({ columns, rows, emptyText = 'No data.', renderActions }) {
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  function toggleSort(columnKey) {
    if (!columnKey) return;
    if (sortKey !== columnKey) {
      setSortKey(columnKey);
      setSortDirection('asc');
      return;
    }
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a?.[sortKey];
      const vb = b?.[sortKey];
      if (va === vb) return 0;
      if (va === undefined || va === null) return 1;
      if (vb === undefined || vb === null) return -1;
      const compare = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return copy;
  }, [rows, sortKey, sortDirection]);

  return (
    <div className="card overflow-x-auto">
      <table className="simple-table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>
                {col.sortable === false ? (
                  col.label
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 border-0 bg-transparent p-0 font-inherit text-inherit cursor-pointer"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </button>
                )}
              </th>
            ))}
            {renderActions ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length ? sortedRows.map((row) => (
            <tr key={row.id || JSON.stringify(row)}>
              {columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>)}
              {renderActions ? <td>{renderActions(row)}</td> : null}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length + (renderActions ? 1 : 0)} className="muted">{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
