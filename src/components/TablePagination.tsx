"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ArrowRight, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const limitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (limitRef.current && !limitRef.current.contains(event.target as Node)) {
        setIsLimitOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="flex flex-col lg:flex-row items-center justify-between px-6 py-4 bg-white border-t border-slate-200 gap-4 relative z-10">
      
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
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>แสดง</span>
            
            <div className="relative" ref={limitRef}>
              <button
                type="button"
                onClick={() => setIsLimitOpen(!isLimitOpen)}
                className="flex items-center gap-1 font-semibold text-[#1F2E22] hover:text-[#2A3E2E] transition-colors focus:outline-none"
              >
                {itemsPerPage}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isLimitOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLimitOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden w-20 z-[100] origin-bottom"
                  >
                    <div className="flex flex-col p-1">
                      {[10, 20, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            onLimitChange(val);
                            setIsLimitOpen(false);
                          }}
                          className={`px-3 py-2 text-sm text-center rounded-lg transition-colors ${
                            itemsPerPage === val 
                              ? 'bg-[#1F2E22] text-white font-medium' 
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span>รายการ</span>
          </div>
        )}
      </div>
    </div>
  );
}
