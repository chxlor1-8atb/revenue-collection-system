import { db } from "@/lib/db";
import { houses, invoices, transactions, systemSettings } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, User, MapPin, ExternalLink, Receipt, CheckCircle2, Clock, AlertCircle, Phone, Info, MessageCircle, Banknote, CalendarDays } from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";
import CashPaymentButton from "./CashPaymentButton";

export const dynamic = "force-dynamic";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  if (!monthYear) return "";
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default async function AdminHouseDetailPage({ params }: { params: Promise<{ houseId: string }> }) {
  const houseId = parseInt((await params).houseId, 10);
  if (isNaN(houseId)) notFound();

  // Fetch house details and system settings
  const [houseResult, settingsResult] = await Promise.all([
    db.select().from(houses).where(eq(houses.id, houseId)).limit(1),
    db.select().from(systemSettings).limit(1)
  ]);
  
  if (houseResult.length === 0) notFound();
  const house = houseResult[0];
  const schema = (settingsResult[0]?.houseCustomFieldsSchema as any[]) || [];

  // Fetch all invoices for this house
  const houseInvoices = await db.select({
    id: invoices.id,
    monthYear: invoices.monthYear,
    amount: invoices.amount,
    status: invoices.status,
    transactionId: invoices.transactionId,
    tx: transactions,
  })
  .from(invoices)
  .leftJoin(transactions, eq(invoices.transactionId, transactions.id))
  .where(eq(invoices.houseId, houseId))
  .orderBy(desc(invoices.monthYear));

  // Calculate stats
  const totalUnpaid = houseInvoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalPaid = houseInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  
  // Format Address
  const addressParts = [];
  if (house.houseNumber) addressParts.push(`บ้านเลขที่ ${house.houseNumber}`);
  if (house.moo) addressParts.push(`หมู่ ${house.moo}`);
  if (house.soi) addressParts.push(`ซอย${house.soi}`);
  if (house.road) addressParts.push(`ถนน${house.road}`);
  if (house.zone) addressParts.push(`ชุมชน: ${house.zone}`);
  const fullAddress = addressParts.join(" ");

  // Custom Fields
  const customFieldsData = house.customFields as Record<string, any> || {};
  const sysFieldIds = ["houseNumber", "ownerName", "zone", "moo", "soi", "road"];
  const displayCustomFields = schema.filter(f => !sysFieldIds.includes(f.id) && customFieldsData[f.id] !== undefined && customFieldsData[f.id] !== "");

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Link href="/dashboard/houses" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm mb-3 transition-colors">
            <ArrowLeft size={16} /> กลับไปหน้ารวมบ้าน
          </Link>
          <h1 className="font-bold text-3xl text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Home size={28} />
            </div>
            บ้านเลขที่ {house.houseNumber}
          </h1>
        </div>
        <a 
          href={`/house/${house.id}`} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          เปิดหน้าเว็บของลูกบ้าน <ExternalLink size={16} />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Info size={18} className="text-slate-500" />
              <h3 className="font-semibold text-slate-700">ข้อมูลพื้นฐาน</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">ชื่อเจ้าบ้าน / ผู้รับผิดชอบ</p>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-emerald-600" />
                  <p className="font-bold text-slate-800 text-lg">{house.ownerName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">ที่อยู่แบบเต็ม</p>
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="font-medium text-slate-700 leading-relaxed">{fullAddress || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <SettingsIcon />
              <h3 className="font-semibold text-slate-700">ข้อมูลระบบ</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">เรทค่าจัดเก็บประจำเดือน</p>
                <div className="flex items-center gap-2">
                  <Banknote size={18} className="text-emerald-600" />
                  <p className="font-bold text-slate-800">฿{house.defaultBillingAmount || "20.00"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">สถานะการผูกบัญชี LINE</p>
                <div className="flex items-center gap-2 mt-1">
                  {house.lineUserId ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <MessageCircle size={14} /> ผูกบัญชี LINE แล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      <MessageCircle size={14} /> ยังไม่ผูกบัญชี
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">ลงทะเบียนเมื่อ</p>
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-slate-400" />
                  <p className="font-medium text-slate-700 text-sm">{house.createdAt ? new Date(house.createdAt).toLocaleDateString("th-TH") : "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields Card (Only if they exist) */}
          {displayCustomFields.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <FileTextIcon />
                <h3 className="font-semibold text-slate-700">ข้อมูลเพิ่มเติม</h3>
              </div>
              <div className="p-5 space-y-4">
                {displayCustomFields.map((field) => (
                  <div key={field.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-slate-500 font-medium mb-1">{field.name}</p>
                    <p className="font-medium text-slate-800">{customFieldsData[field.id]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Summaries & Bills */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertCircle size={80} />
              </div>
              <p className="text-red-600 font-semibold mb-1 text-sm">ยอดค้างชำระรวม (รอเก็บ)</p>
              <p className="text-4xl font-black text-red-600 tracking-tight">฿{totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CheckCircle2 size={80} />
              </div>
              <p className="text-emerald-600 font-semibold mb-1 text-sm">ยอดที่ชำระแล้วรวม</p>
              <p className="text-4xl font-black text-emerald-600 tracking-tight">฿{totalPaid.toFixed(2)}</p>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Receipt size={20} className="text-emerald-600" /> ประวัติรายการบิลทั้งหมด
              </h2>
              <div className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                {houseInvoices.length} รายการ
              </div>
            </div>
            
            {houseInvoices.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium text-lg text-slate-500">ยังไม่มีรายการบิลสำหรับบ้านหลังนี้</p>
                <p className="text-sm mt-1">บิลจะถูกสร้างอัตโนมัติตามรอบบิลที่คุณตั้งค่าไว้</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">ประจำเดือน</th>
                      <th className="px-6 py-4">ยอดเงิน</th>
                      <th className="px-6 py-4">สถานะ</th>
                      <th className="px-6 py-4">วันที่ทำรายการ</th>
                      <th className="px-6 py-4 text-right">หลักฐาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {houseInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{formatThaiMonth(inv.monthYear)}</td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">฿{parseFloat(inv.amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          {inv.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={14} /> ชำระแล้ว
                            </span>
                          ) : inv.status === 'pending_advance' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              <Clock size={14} /> จ่ายล่วงหน้า (รอตรวจ)
                            </span>
                          ) : inv.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              <Clock size={14} /> รอตรวจสอบสลิป
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                <AlertCircle size={14} /> ค้างชำระ
                              </span>
                              <CashPaymentButton invoiceId={inv.id} monthYear={inv.monthYear} />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {inv.tx?.paidAt ? new Date(inv.tx.paidAt).toLocaleDateString("th-TH") : (inv.tx?.createdAt ? new Date(inv.tx.createdAt).toLocaleDateString("th-TH") : "-")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inv.tx?.slipImageUrl && inv.tx.slipImageUrl !== "pending" ? (
                            <SlipModalButton imageUrl={inv.tx.slipImageUrl} buttonStyle="house" />
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function FileTextIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
}
