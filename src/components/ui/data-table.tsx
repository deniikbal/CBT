'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  header: string | (() => React.ReactNode)
  accessor: keyof T | ((row: T, index: number) => React.ReactNode)
  cell?: (row: T, index: number) => React.ReactNode
  className?: string
  sortable?: boolean
  sortKey?: keyof T
  sortLabel?: string
  customSort?: (a: T, b: T, direction: 'asc' | 'desc') => number
}

export interface FilterOption {
  key: string
  label: string
  options: { value: string; label: string }[]
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  filters?: FilterOption[]
  emptyMessage?: React.ReactNode
  itemsPerPageOptions?: number[]
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Cari...',
  searchKeys = [],
  filters = [],
  emptyMessage = 'Tidak ada data',
  itemsPerPageOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter, search, and sort logic
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key]
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      )
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter((item) => String(item[key]) === value)
      }
    })

    // Apply sorting
    if (sortColumn) {
      const column = columns.find(col => {
        if (typeof col.accessor === 'string') {
          return col.sortKey === sortColumn || col.accessor === sortColumn
        }
        return col.sortKey === sortColumn
      })

      result.sort((a, b) => {
        if (column?.customSort) {
          return column.customSort(a, b, sortDirection)
        }

        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()

        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    }

    return result
  }, [data, searchQuery, searchKeys, activeFilters, sortColumn, sortDirection, columns])

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilters, itemsPerPage])

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setActiveFilters({})
    setSortColumn(null)
    setSortDirection('asc')
  }

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    const key = column.sortKey || (typeof column.accessor === 'string' ? column.accessor as keyof T : null)
    if (!key) return

    if (sortColumn === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortColumn(null)
        setSortDirection('asc')
      }
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const key = column.sortKey || (typeof column.accessor === 'string' ? column.accessor as keyof T : null)
    
    if (sortColumn === key) {
      return sortDirection === 'asc' ? 
        <ArrowUp className="h-4 w-4" /> : 
        <ArrowDown className="h-4 w-4" />
    }
    
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />
  }

  const hasActiveFilters = searchQuery || Object.values(activeFilters).some((v) => v && v !== 'all') || sortColumn !== null

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || 'all'}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearAllFilters} size="sm" className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column)}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors font-medium"
                      title={`Sort by ${column.sortLabel || (typeof column.header === 'string' ? column.header : 'column')}`}
                    >
                      {typeof column.header === 'function' ? column.header() : column.header}
                      {getSortIcon(column)}
                    </button>
                  ) : (
                    typeof column.header === 'function' ? column.header() : column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const actualIndex = startIndex + rowIndex
                return (
                  <TableRow key={rowIndex} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => {
                      let content: React.ReactNode

                      if (column.cell) {
                        content = column.cell(row, actualIndex)
                      } else if (typeof column.accessor === 'function') {
                        content = column.accessor(row, actualIndex)
                      } else {
                        content = row[column.accessor]
                      }

                      return (
                        <TableCell key={colIndex} className={column.className}>
                          {content}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tampilkan</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">data</span>
        </div>

        {/* Info */}
        <div className="text-sm text-gray-600">
          Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1} -{' '}
          {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
        </div>

        {/* Page controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? 'w-9 bg-blue-600 hover:bg-blue-700 text-white' : 'w-9'}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
