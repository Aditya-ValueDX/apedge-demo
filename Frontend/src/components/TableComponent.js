// src/components/TableComponent.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, Calendar, X } from 'lucide-react';
// No direct CSS import needed if all styles are in index.css

/**
 * Reusable Table Component for displaying paginated, sortable, and filterable data.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The array of data objects to display in the table.
 * @param {Array} props.columns - An array of column definitions.
 * Each column object should have:
 * - {string} key: The key in the data object that corresponds to this column's data.
 * - {string} header: The display text for the column header.
 * - {boolean} [sortable=false]: Whether the column can be sorted.
 * - {boolean} [filterable=false]: Whether the column can be filtered.
 * - {string} [filterType='text']: Type of filter input ('text', 'number', 'date', 'select').
 * - {Function} [render]: Optional render function for custom cell content (e.g., status badges, action buttons).
 * Receives (item, index, page) as arguments.
 * - {Function} [filterOptions]: For 'select' filterType, a function that returns an array of unique filter options.
 * - {string} [width]: Optional CSS width for the column (e.g., '100px', '10%').
 * @param {Object} props.columnFilters - State object for column-specific filters.
 * @param {Function} props.setColumnFilters - Setter for columnFilters state.
 * @param {string} props.sortField - The current field by which the table is sorted.
 * @param {Function} props.setSortField - Setter for sortField state.
 * @param {boolean} props.sortAsc - The current sort direction (true for ascending, false for descending).
 * @param {Function} props.setSortAsc - Setter for sortAsc state.
 * @param {number} props.page - The current page number for pagination.
 * @param {Function} props.setPage - Setter for page state.
 * @param {Function} props.onRowClick - Optional callback function when a row is clicked.
 * Receives the data item as an argument.
 * @param {string} [props.emptyMessage="No data found matching your criteria."] - Message to display when no data is found.
 * @param {number} [props.pageSize=10] - Number of items per page for pagination.
 */
const TableComponent = ({
  data,
  columns,
  columnFilters,
  setColumnFilters,
  sortField,
  setSortField,
  sortAsc,
  setSortAsc,
  page,
  setPage,
  onRowClick,
  emptyMessage = "No data found matching your criteria.",
  pageSize = 10,
}) => {

  // Use local state for column filters to allow immediate UI updates
  const [localColumnFilters, setLocalColumnFilters] = useState(columnFilters);

  // Sync local filters with external prop changes
  useEffect(() => {
    setLocalColumnFilters(columnFilters);
  }, [columnFilters]);

  // Handle filter changes from input fields
  const handleFilterChange = useCallback((key, value) => {
    setLocalColumnFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset page on filter change
  }, [setPage]);

  // Memoized filtered and sorted data to optimize performance
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply column filters
    result = result.filter(item => {
      return columns.every(col => {
        const filterValue = localColumnFilters[col.key];
        if (!filterValue) return true; // No filter applied for this column

        const itemValue = item[col.key];
        const columnDefinition = columns.find(c => c.key === col.key);

        if (columnDefinition?.filterType === 'date') {
          if (!itemValue) return false;

          try {
            const parsedFilterDate = new Date(filterValue);
            const parsedItemDate = new Date(itemValue);

            if (isNaN(parsedFilterDate.getTime()) || isNaN(parsedItemDate.getTime())) {
              console.warn(`Invalid date encountered during filtering: filterValue=${filterValue}, itemValue=${itemValue}`);
              return true;
            }

            parsedFilterDate.setHours(0, 0, 0, 0);
            parsedItemDate.setHours(0, 0, 0, 0);

            return parsedItemDate >= parsedFilterDate;

          } catch (e) {
            console.error(`Error processing date filter for column ${col.key}:`, e);
            return true;
          }
        } else if (columnDefinition?.filterType === 'select') {
          return String(itemValue).toLowerCase() === String(filterValue).toLowerCase();
        } else if (columnDefinition?.filterType === 'number') {
          const numItemValue = parseFloat(itemValue);
          const filterNumValue = parseFloat(filterValue);
          return !isNaN(numItemValue) && !isNaN(filterNumValue) && String(numItemValue).includes(String(filterNumValue));
        } else {
          return String(itemValue || '').toLowerCase().includes(String(filterValue).toLowerCase());
        }
      });
    });

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const sortColumnDefinition = columns.find(col => col.key === sortField);

        if (sortColumnDefinition?.filterType === 'date') {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return sortAsc ? 1 : -1;
            if (isNaN(dateB.getTime())) return sortAsc ? -1 : 1;
          }
          return sortAsc ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortAsc ? aValue - bValue : bValue - aValue;
        }

        const stringA = String(aValue || '').toLowerCase();
        const stringB = String(bValue || '').toLowerCase();
        return sortAsc ? stringA.localeCompare(stringB) : stringB.localeCompare(stringA);
      });
    }

    return result;
  }, [data, columns, localColumnFilters, sortField, sortAsc]);

  // Update parent's columnFilters when local filters change (e.g., when clearing individual filters)
  useEffect(() => {
    setColumnFilters(localColumnFilters);
  }, [localColumnFilters, setColumnFilters]);


  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, page, pageSize]);

  // Toggle sort direction for a given field
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true); // Default to ascending when changing sort field
    }
    setPage(1); // Reset page on sort change
  };

  // Generate pagination range (e.g., 1 2 3 ... 10)
  const getPaginationRange = (current, total) => {
    const range = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      if (current <= 3) {
        range.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        range.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        range.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }
    return range;
  };

  // Capitalize string utility
  const capitalize = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="table-component-container">
      <div className="table-container">
        <table className="data-table">{/* Removed leading whitespace here */}
          <thead>{/* Removed leading whitespace here */}
            <tr>
              {/* Serial Number Column */}
              <th style={{ width: '50px' }}>
                <div className="th-content">
                  <div>Sr No</div>
                </div>
              </th>
              {/* Dynamic Columns */}
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width || 'auto' }}>
                  <div className="th-content">
                    {col.sortable ? (
                      <div className="sortable-header" onClick={() => toggleSort(col.key)}>
                        {col.header} {sortField === col.key ? (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronDown size={14} style={{ opacity: 0.3 }} />}
                      </div>
                    ) : (
                      <div>{col.header}</div>
                    )}
                    {col.filterable && (
                      <div className="column-filter-row">
                        {col.filterType === 'select' ? (
                          <select
                            value={localColumnFilters[col.key] || ''}
                            onChange={e => handleFilterChange(col.key, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="filter-select"
                          >
                            <option value="">All</option>
                            {col.filterOptions && col.filterOptions().map(option => (
                              <option key={option} value={option}>{capitalize(option)}</option>
                            ))}
                          </select>
                        ) : col.filterType === 'date' ? (
                          <div className="date-filter-wrapper">
                            <input
                              type="date"
                              value={localColumnFilters[col.key] || ''}
                              onChange={(e) => handleFilterChange(col.key, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="filter-input date-input"
                            />
                             {localColumnFilters[col.key] && (
                              <button
                                className="clear-filter-btn"
                                onClick={(e) => { e.stopPropagation(); handleFilterChange(col.key, ''); }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-filter-wrapper">
                            <input
                              type={col.filterType || 'text'}
                              placeholder={`Filter ${capitalize(col.key)}...`}
                              value={localColumnFilters[col.key] || ''}
                              onChange={e => handleFilterChange(col.key, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="filter-input"
                            />
                            {localColumnFilters[col.key] && (
                              <button
                                className="clear-filter-btn"
                                onClick={(e) => { e.stopPropagation(); handleFilterChange(col.key, ''); }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{/* Removed leading whitespace here */}
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr key={item.id || index} onClick={() => onRowClick && onRowClick(item)}>
                  <td>{(page - 1) * pageSize + index + 1}</td>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(item, index, page) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ‹
        </button>
        {getPaginationRange(page, totalPages).map((pg, i) => (
          <button
            key={i}
            disabled={pg === '...'}
            className={`page-btn ${pg === page ? 'active' : ''}`}
            onClick={() => typeof pg === 'number' && setPage(pg)}
          >
            {pg}
          </button>
        ))}
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || filteredAndSortedData.length === 0}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default TableComponent;
