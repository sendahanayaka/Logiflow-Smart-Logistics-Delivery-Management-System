export default function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
}) {
  if (totalPages <= 1) return null

  const firstPage = Math.max(1, page - siblingCount)
  const lastPage = Math.min(totalPages, page + siblingCount)
  const pages = Array.from(
    { length: lastPage - firstPage + 1 },
    (_, index) => firstPage + index,
  )

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {firstPage > 1 && (
        <button type="button" onClick={() => onPageChange(1)}>
          1
        </button>
      )}
      {firstPage > 2 && <span aria-hidden="true">…</span>}

      {pages.map((pageNumber) => (
        <button
          type="button"
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          className={pageNumber === page ? 'is-active' : ''}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber}
        </button>
      ))}

      {lastPage < totalPages - 1 && <span aria-hidden="true">…</span>}
      {lastPage < totalPages && (
        <button type="button" onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </button>
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  )
}
