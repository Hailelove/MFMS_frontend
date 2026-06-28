import React from "react";

/**
 * Reusable pagination component.
 * Props:
 *  - currentPage  : 1-based current page number
 *  - totalItems   : total number of items
 *  - itemsPerPage : items per page (default 10)
 *  - onPageChange : callback(newPage)
 */
const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
      pages.push("...");
    }
  }

  // Deduplicate consecutive ellipses
  const dedupedPages = pages.filter(
    (p, idx) => !(p === "..." && pages[idx - 1] === "..."),
  );

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        Showing{" "}
        <strong>
          {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
        </strong>
        {" – "}
        <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong>
        {" of "}
        <strong>{totalItems}</strong>
      </div>
      <nav className="pagination-nav" aria-label="Pagination">
        <button
          className="page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {dedupedPages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`page-btn${currentPage === p ? " page-btn--active" : ""}`}
              onClick={() => onPageChange(p)}
              aria-current={currentPage === p ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          className="page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
