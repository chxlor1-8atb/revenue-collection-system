"use client";

import { useState } from "react";
import { searchHouseByNumber, getUnpaidInvoicesForHouse, approveLineSlip, rejectLineSlip } from "./actions";
import { CheckCircle2, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";
import ConfirmModal from "@/components/ConfirmModal";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TablePagination from "@/components/TablePagination";

interface LineSlipsClientProps {
  slips: any[];
  activeTab: "pending" | "verified";
  currentPage: number;
  totalPages: number;
  pendingCount: number;
  verifiedCount: number;
}

export default function LineSlipsClient({ 
  slips, 
  activeTab, 
  currentPage, 
  totalPages, 
  pendingCount, 
  verifiedCount 
}: LineSlipsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [searchHouseNumber, setSearchHouseNumber] = useState("");
  const [foundHouse, setFoundHouse] = useState<any | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null);

  const handleTabChange = (tab: "pending" | "verified") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('page'); // Reset to page 1 when changing tabs
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const openMatchModal = async (slip: any) => {
    setSelectedSlip(slip);
    setSearchHouseNumber(slip.houseNumber || "");
    setFoundHouse(null);
    setUnpaidInvoices([]);
    setSelectedInvoices([]);
    setErrorMsg("");

    // If houseNumber already exists from LINE text, search immediately
    if (slip.houseNumber) {
      await handleSearchHouseForSlip(slip.houseNumber, parseFloat(slip.amount || "0"));
    }
  };

  const handleSearchHouseForSlip = async (houseNumber: string, slipAmt: number) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const house = await searchHouseByNumber(houseNumber);
      if (house) {
        setFoundHouse(house);
        const invoices = await getUnpaidInvoicesForHouse(house.id);
        setUnpaidInvoices(invoices);
        const totalDebt = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0);
        if (totalDebt > 0 && slipAmt === totalDebt) {
          setSelectedInvoices(invoices.map((i: any) => i.id));
        }
      } else {
        setFoundHouse(null);
        setUnpaidInvoices([]);
        setErrorMsg("ไม่พบบ้านเลขที่นี้ในระบบ");
      }
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาดในการค้นหาบ้าน");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInvoice = (id: number) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(i => i !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  const handleApprove = async () => {
    if (!foundHouse) return;
    setIsLoading(true);
    setErrorMsg("");

    const res = await approveLineSlip(
      selectedSlip.id,
      foundHouse.id,
      selectedInvoices,
      parseFloat(selectedSlip.amount || "0"),
      selectedSlip.imageUrl || ""
    );

    setIsLoading(false);
    if (res.success) {
      setSelectedSlip(null);
      router.refresh();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleRejectClick = (slipId: number) => {
    setRejectConfirmId(slipId);
  };

  const executeReject = async () => {
    if (!rejectConfirmId) return;
    setIsLoading(true);
    try {
      const res = await rejectLineSlip(rejectConfirmId);
      if (res.success) {
        setRejectConfirmId(null);
        router.refresh();
      } else {
        alert(res.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchHouse = (houseNumber: string) => {
    handleSearchHouseForSlip(houseNumber, slipAmount);
  };
  
  const slipAmount = parseFloat(selectedSlip?.amount || "0");
  const selectedTotal = unpaidInvoices
    .filter(i => selectedInvoices.includes(i.id))
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pending" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Clock size={14} />
          รอดำเนินการ
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => handleTabChange("verified")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "verified" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <CheckCircle2 size={14} />
          ยืนยันแล้ว
          {verifiedCount > 0 && (
            <span className="bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">{verifiedCount}</span>
          )}
        </button>
      </div>

      {/* Slips Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {slips.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-sans">
            {activeTab === "pending" ? "ไม่มีสลิปจาก LINE ที่รอดำเนินการ" : "ยังไม่มีสลิปที่ยืนยันสำเร็จอัตโนมัติ"}
          </div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="sm:hidden divide-y divide-slate-100">
              {slips.map((slip) => (
                <div key={slip.id} className="p-4">
                  <div className="flex gap-3 items-start mb-3">
                    {slip.imageUrl ? (
                      <SlipModalButton imageUrl={slip.imageUrl}>
                        <img src={slip.imageUrl} alt="Slip" className="w-16 h-16 object-cover rounded-md border border-slate-200 cursor-pointer hover:opacity-80 shrink-0" />
                      </SlipModalButton>
                    ) : <div className="w-16 h-16 bg-slate-100 rounded-md shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-slate-400 mb-1">{slip.createdAt?.toLocaleString("th-TH")}</p>
                      {activeTab === "verified" ? (
                        <div>
                           <p className="text-sm text-slate-700">{slip.senderName || "-"}</p>
                           <p className="font-bold text-emerald-600">฿{slip.amount}</p>
                           <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-100 mt-1">
                             <CheckCircle2 size={10} /> ยืนยันอัตโนมัติ
                           </span>
                        </div>
                      ) : (
                        <>
                          {slip.isVerified ? (
                            <div>
                              <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1 border border-emerald-100">สลิปแท้</span>
                              <p className="text-xs text-slate-500">ยอด: <strong>฿{slip.amount}</strong></p>
                              <p className="text-xs text-slate-500">ผู้โอน: {slip.senderName}</p>
                            </div>
                          ) : (
                            <span className="text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-100">รอตรวจสอบ</span>
                          )}
                          {slip.houseNumber ? (
                            <span className="block mt-1 font-semibold text-slate-700 text-sm">บ้าน {slip.houseNumber}</span>
                          ) : (
                            <span className="block mt-1 text-amber-600 text-xs">ยังไม่แจ้งบ้านเลขที่</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {activeTab === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openMatchModal(slip)}
                        className="flex-1 bg-[#C9A227] hover:bg-[#B38E1E] text-white font-sans text-sm px-3 py-2 rounded-lg shadow-sm transition-colors font-medium"
                      >
                        จับคู่ / อนุมัติ
                      </button>
                      <button
                        onClick={() => handleRejectClick(slip.id)}
                        className="flex-1 font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 px-3 py-2 text-sm"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Desktop: Table layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">วัน-เวลา</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">รูปสลิป</th>
                    {activeTab === "pending" ? (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">ข้อมูลจาก Slip2Go</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">บ้านเลขที่</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans text-right">การจัดการ</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">ผู้โอน</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">ยอดเงิน</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">สถานะ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{slip.createdAt?.toLocaleString("th-TH")}</td>
                      <td className="px-6 py-4">
                        {slip.imageUrl ? (
                          <SlipModalButton imageUrl={slip.imageUrl}>
                            <img src={slip.imageUrl} alt="Slip" className="w-16 h-16 object-cover rounded-md border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" />
                          </SlipModalButton>
                        ) : <span className="text-slate-400 text-sm font-sans">-</span>}
                      </td>
                      
                      {activeTab === "pending" ? (
                        <>
                          <td className="px-6 py-4 font-sans">
                            {slip.isVerified ? (
                              <div className="flex flex-col">
                                <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-md inline-block w-fit mb-1 border border-emerald-100">สลิปแท้</span>
                                <span className="text-xs text-slate-500 mt-1">ยอดเงิน: <strong className="text-slate-800">฿{slip.amount}</strong></span>
                                <span className="text-xs text-slate-500">ผู้โอน: {slip.senderName}</span>
                              </div>
                            ) : (
                              <span className="text-amber-500 font-bold text-sm bg-amber-50 px-2 py-1 rounded-md inline-block border border-amber-100">รอตรวจสอบ (ไม่ได้ผ่าน Slip2go)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-sans">
                            {slip.houseNumber ? (
                              <span className="font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{slip.houseNumber}</span>
                            ) : (
                              <span className="text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-full border border-amber-100">ยังไม่พิมพ์บ้านเลขที่ตามมา</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openMatchModal(slip)}
                              className="bg-[#C9A227] hover:bg-[#B38E1E] text-white font-sans text-sm px-4 py-2 rounded-lg shadow-sm transition-colors mr-2 font-medium"
                            >
                              จับคู่บ้าน / อนุมัติ
                            </button>
                            <button
                              onClick={() => handleRejectClick(slip.id)}
                              className="px-4 py-2 font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                            >
                              ปฏิเสธ
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-700">{slip.senderName || "-"}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">฿{slip.amount}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full border border-emerald-100">
                              <CheckCircle2 size={11} /> ยืนยันอัตโนมัติ
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Pagination Controls */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={activeTab === "pending" ? pendingCount : verifiedCount}
          itemsPerPage={20} // Assuming limit=20 in page.tsx
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">จับคู่บ้านและอนุมัติสลิป</h2>
              <button 
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 font-sans flex flex-col md:flex-row gap-6">
              
              {/* Left Column: Slip Details */}
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-2">ข้อมูลสลิป</h3>
                  <div className="text-sm text-slate-600 mb-1">ยอดเงินโอน: <strong className="text-xl text-emerald-600">฿{slipAmount}</strong></div>
                  <div className="text-sm text-slate-500 mb-4">ผู้โอน: {selectedSlip.senderName || '-'}</div>
                  
                  {selectedSlip.imageUrl ? (
                    <SlipModalButton imageUrl={selectedSlip.imageUrl}>
                      <img src={selectedSlip.imageUrl} alt="Slip" className="w-full rounded-md border border-slate-200 cursor-zoom-in" />
                    </SlipModalButton>
                  ) : (
                    <div className="w-full aspect-[9/16] bg-slate-100 rounded flex items-center justify-center text-slate-400">ไม่มีรูป</div>
                  )}
                </div>
              </div>

              {/* Right Column: House and Invoices */}
              <div className="w-full md:w-2/3 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-3">ค้นหาบ้านเลขที่</h3>
                <div className="flex gap-2 mb-4">
                  <SearchAutocomplete 
                    value={searchHouseNumber}
                    onChange={setSearchHouseNumber}
                    onSubmit={() => handleSearchHouse(searchHouseNumber)}
                    placeholder="ใส่บ้านเลขที่ หรือ ชื่อเจ้าบ้าน..."
                    className="w-full placeholder:text-slate-400 focus:ring-[#1F2E22] cursor-text"
                  />
                  <button 
                    onClick={() => handleSearchHouse(searchHouseNumber)}
                    disabled={isLoading || !searchHouseNumber}
                    className="bg-[#1F2E22] hover:bg-slate-800 text-white px-6 h-[42px] rounded-full font-medium transition-colors disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    ค้นหา
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
                    {errorMsg}
                  </div>
                )}

                {foundHouse && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-emerald-800 text-lg">บ้านเลขที่ {foundHouse.houseNumber}</h4>
                        <p className="text-emerald-700 text-sm">ชื่อเจ้าบ้าน: {foundHouse.ownerName}</p>
                        <p className="text-emerald-700 text-sm">ชุมชน: {foundHouse.zone || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {foundHouse && (
                  <div className="flex-1 overflow-y-auto">
                    <h3 className="font-bold text-slate-700 mb-3">บิลที่ยังค้างชำระของบ้านหลังนี้ ({unpaidInvoices.length} รายการ)</h3>
                    
                    {unpaidInvoices.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-6 bg-slate-50 rounded-lg border border-slate-100">บ้านหลังนี้ไม่มีบิลค้างชำระเลย 🎉</p>
                    ) : (
                      <div className="space-y-2">
                        {unpaidInvoices.map(inv => (
                          <label 
                            key={inv.id} 
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedInvoices.includes(inv.id) 
                                ? "bg-emerald-50 border-emerald-200" 
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedInvoices.includes(inv.id)}
                              onChange={() => toggleInvoice(inv.id)}
                            />
                            <div className="ml-3 flex-1 flex justify-between items-center">
                              <div>
                                <div className="font-medium text-slate-800">ประจำเดือน {inv.monthYear}</div>
                                <div className="text-xs text-slate-500">บิลที่ {inv.id}</div>
                              </div>
                              <div className="font-bold text-slate-700">฿{inv.amount}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="font-sans">
                <span className="text-slate-500 text-sm mr-2">ยอดสลิป: <strong className="text-emerald-600">฿{slipAmount}</strong></span>
                <span className="text-slate-300 mx-2">|</span>
                <span className="text-slate-500 text-sm">ยอดบิลที่เลือก: <strong className={selectedTotal === slipAmount ? "text-emerald-600" : "text-amber-600"}>฿{selectedTotal}</strong></span>
                
                {selectedTotal !== slipAmount && selectedTotal > 0 && (
                  <div className="text-xs text-amber-600 mt-1">
                    *ยอดเงินที่เลือกไม่ตรงกับยอดโอน คุณสามารถอนุมัติได้แต่ควรตรวจสอบให้แน่ใจ
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedSlip(null)}
                  className="px-4 py-2 font-sans text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={isLoading || !foundHouse}
                  className="px-6 py-2 font-sans bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {isLoading ? "กำลังประมวลผล..." : "ยืนยันอนุมัติ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!rejectConfirmId}
        onClose={() => setRejectConfirmId(null)}
        onConfirm={executeReject}
        isLoading={isLoading}
        title="ปฏิเสธสลิป LINE"
        description="คุณแน่ใจหรือไม่ที่จะปฏิเสธสลิปใบนี้ ?"
        warningText="สลิปนี้จะถูกลบออกจากระบบ และไม่สามารถนำกลับมาตรวจสอบได้อีก"
        confirmText="ใช่, ปฏิเสธสลิป"
      />
    </div>
  );
}
