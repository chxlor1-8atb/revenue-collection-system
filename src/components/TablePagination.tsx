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
        return <span key={`dots-${i}`} className="px-1 sm:px-2 text-slate-400 text-xs sm:text-sm">...</span>;
      }
      const isActive = p === currentPage;
      return (
        <button
          key={p}
          onClick={() => onPageChange(p as number)}
          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            isActive 
              ? 'bg-[blue-600] text-white shadow-xs shadow-[blue-600]/25' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-slate-100 gap-3 sm:gap-4 relative z-10">
      
      {/* Left: Item Range */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 whitespace-nowrap order-1 sm:order-none">
        <div className="bg-[blue-50] text-[blue-600] font-semibold px-2.5 py-1 rounded-lg border border-[blue-200]">
          {startItem}-{isInfinite ? Math.max(startItem, startItem + totalItems - 1) : endItem}
        </div>
        {!isInfinite && (
          <span>จาก <strong className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-semibold">{totalItems}</strong> รายการ</span>
        )}
      </div>

      {/* Center: Pagination Buttons */}
      <div className="flex items-center gap-0.5 sm:gap-1 order-3 sm:order-none">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="หน้าแรกสุด"
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="หน้าก่อนหน้า"
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors mr-0.5 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={15} />
        </button>
        
        {!isInfinite && (
          <div className="flex items-center gap-0.5 sm:gap-1">
            {renderPageNumbers()}
          </div>
        )}
        {isInfinite && (
          <span className="px-3 text-xs sm:text-sm font-semibold text-slate-700">หน้า {currentPage}</span>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          aria-label="หน้าถัดไป"
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ml-0.5 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight size={15} />
        </button>
        {!isInfinite && (
          <button
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage >= safeTotalPages}
            aria-label="หน้าสุดท้าย"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronsRight size={15} />
          </button>
        )}
      </div>

      {/* Right: Jump & Limit */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 whitespace-nowrap order-2 sm:order-none">
        
        {!isInfinite && totalPages > 5 && (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span>ไป</span>
            <input
              type="text"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              aria-label="ระบุเลขหน้าเพื่อกระโดดไป"
              className="w-8 sm:w-9 h-6 sm:h-7 text-center border border-slate-200 rounded text-slate-700 bg-white focus:outline-none focus:border-[blue-600] text-xs font-semibold"
            />
            <button 
              onClick={handleJump}
              aria-label="ไปที่หน้าที่ระบุ"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[blue-600]/10 hover:bg-[blue-600]/20 text-[blue-600] rounded transition-colors cursor-pointer"
            >
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {onLimitChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span>แสดง</span>
            
            <div className="relative" ref={limitRef}>
              <button
                type="button"
                onClick={() => setIsLimitOpen(!isLimitOpen)}
                aria-label={`เลือกจำนวนรายการต่อหน้า (ปัจจุบัน ${itemsPerPage} รายการ)`}
                className="flex items-center gap-1 font-bold text-[blue-600] hover:text-[blue-700] transition-colors focus:outline-none cursor-pointer"
              >
                {itemsPerPage}
                <ChevronDown size={13} className={`transition-transform duration-200 ${isLimitOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLimitOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-20 z-[100] origin-bottom p-1"
                  >
                    <div className="flex flex-col gap-0.5">
                      {[10, 20, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            onLimitChange(val);
                            setIsLimitOpen(false);
                          }}
                          className={`px-2 py-1.5 text-xs font-semibold text-center rounded-lg transition-colors cursor-pointer ${
                            itemsPerPage === val 
                              ? 'bg-[blue-600] text-white' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
