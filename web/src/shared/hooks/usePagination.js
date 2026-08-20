import { useCallback, useMemo, useState } from 'react'

export default function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  totalCount = 0,
} = {}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.min(page, totalPages)

  const changePage = useCallback(
    (nextPage) => {
      setPage(Math.min(Math.max(1, nextPage), totalPages))
    },
    [totalPages],
  )

  const changePageSize = useCallback((nextPageSize) => {
    setPageSize(nextPageSize)
    setPage(1)
  }, [])

  const resetPagination = useCallback(() => setPage(1), [])

  return useMemo(
    () => ({
      page: currentPage,
      pageSize,
      totalCount,
      totalPages,
      setPage: changePage,
      setPageSize: changePageSize,
      resetPagination,
    }),
    [
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      changePage,
      changePageSize,
      resetPagination,
    ],
  )
}
