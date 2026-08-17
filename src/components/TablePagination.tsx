"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isInfinite?: boolean; // For cursor-based pagination where total is unknown
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  isInfinite = false
}: TablePaginationProps) {
  const [jumpPage, setJumpPage] = useState(currentPage.toString());

  useEffect(() => {
    setJumpPage(currentPage.toString());
  }, [currentPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handleJump = () => {
    const p = parseInt(jumpPage);
    if (!isNaN(p) && p >= 1 && p <= Math.max(1, totalPages)) {
      onPageChange(p);
    } else {
      setJumpPage(currentPage.toString());
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    if (pages.length === 0) pages.push(1);

    return pages.map((p, i) => {
      if (p === '...') {
        return <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>;
      }
      const isActive = p === currentPage;
      return (
        <button
          key={p}
          onClick={() => onPageChange(p as number)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            isActive 
              ? 'bg-[#1F2E22] text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      );
    });
  };

  // Safe totalPages fallback
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between px-6 py-4 bg-white border-t border-slate-200 gap-4 overflow-x-auto">
      
      {/* Left: Item Range */}
      <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
        <div className="bg-emerald-50 text-emerald-700 font-medium px-3 py-1 rounded-lg border border-emerald-100/50">
          {startItem}-{isInfinite ? Math.max(startItem, startItem + totalItems - 1) : endItem}
        </div>
        {!isInfinite && (
          <span>จาก <strong className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{totalItems}</strong> รายการ</span>
        )}
      </div>

      {/* Center: Pagination Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors mr-1"
        >
          <ChevronLeft size={16} />
        </button>
        
        {!isInfinite && (
          <>
            {renderPageNumbers()}
          </>
        )}
        {isInfinite && (
          <span className="px-3 text-sm font-medium text-slate-700">หน้า {currentPage}</span>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ml-1"
        >
          <ChevronRight size={16} />
        </button>
        {!isInfinite && (
          <button
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage >= safeTotalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>

      {/* Right: Jump & Limit */}
      <div className="flex items-center gap-4 text-sm text-slate-500 whitespace-nowrap">
        
        {!isInfinite && (
          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span>ไป</span>
            <input
              type="text"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              className="w-10 h-7 text-center border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-emerald-500"
            />
            <button 
              onClick={handleJump}
              className="w-7 h-7 flex items-center justify-center bg-[#1F2E22]/10 hover:bg-[#1F2E22]/20 text-[#1F2E22] rounded transition-colors"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {onLimitChange && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            <span>แสดง</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>รายการ</span>
          </div>
        )}
      </div>
    </div>
  );
}
