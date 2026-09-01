"use client";

import { useState } from "react";
import { Wallet, Plus, CheckCircle2, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WalletModalButton({ houseId, currentWallet }: { houseId: number; currentWallet: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"add" | "set">("add");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/houses/${houseId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, action })
      });

      if (res.ok) {
        setIsOpen(false);
        setAmount("");
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาดในการปรับยอดยอดเงินในกระเป๋า");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-200/80 cursor-pointer shadow-2xs active:scale-98"
        title="เติมเงิน / ปรับยอดยอดเงินล่วงหน้า"
      >
        <Wallet size={13} />
        <span>จัดการเครดิต</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full relative border border-slate-200/90 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-[blue-600] flex items-center justify-center font-bold">
                  <Wallet size={16} />
                </div>
                <span>ปรับยอดเงินในกระเป๋า (Wallet)</span>
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold">ยอดคงเหลือปัจจุบัน:</span>
                <span className="text-base font-black font-mono text-indigo-700">
                  ฿{parseFloat(currentWallet || "0").toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รูปแบบการทำรายการ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction("add")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      action === "add" 
                        ? "bg-[blue-600] text-white border-[blue-600] shadow-2xs" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    + เติมเงินเพิ่ม
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("set")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      action === "set" 
                        ? "bg-[blue-600] text-white border-[blue-600] shadow-2xs" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    = ตั้งค่าระบุยอดใหม่
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">จำนวนเงิน (บาท)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    ฿
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 pr-4 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[blue-600]/30 focus:border-[blue-600] outline-hidden"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[blue-600] to-indigo-600 hover:from-[blue-700] hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>บันทึกยอดเงิน</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
