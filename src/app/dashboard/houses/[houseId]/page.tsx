import { encodeSecureId } from "@/lib/secureId";
import { db } from "@/lib/db";
import { houses, invoices, transactions, systemSettings } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import LottieIcon from "@/components/LottieIcon";
import { 
  ArrowLeft, 
  Home, 
  User, 
  MapPin, 
  ExternalLink, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Info, 
  MessageCircle, 
  Banknote, 
  CalendarDays,
  Wallet,
  Building2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Check
} from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";
import CashPaymentButton from "./CashPaymentButton";
import WalletModalButton from "./WalletModalButton";
import HouseActionsClient from "./HouseActionsClient";
import CurrencyDisplay from "@/components/CurrencyDisplay";

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

  // Fetch all invoices for this house with transaction details
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
  const unpaidInvoices = houseInvoices.filter(inv => inv.status === 'unpaid');
  const paidInvoices = houseInvoices.filter(inv => inv.status === 'paid');
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const walletBalanceNum = parseFloat(house.walletBalance || "0");

  // Format Address
  const addressParts = [];
  if (house.houseNumber) addressParts.push(`บ้านเลขที่ ${house.houseNumber}`);
  if (house.moo) addressParts.push(`หมู่ ${house.moo}`);
  if (house.soi) addressParts.push(`ซอย${house.soi}`);
  if (house.road) addressParts.push(`ถนน${house.road}`);
  if (house.zone) addressParts.push(`ชุมชน${house.zone}`);
  const fullAddress = addressParts.join(" ");

  // Custom Fields
  const customFieldsData = (house.customFields as Record<string, any>) || {};
  const sysFieldIds = ["houseNumber", "ownerName", "zone", "moo", "soi", "road", "defaultBillingAmount"];
  const displayCustomFields = schema.filter(f => !sysFieldIds.includes(f.id) && customFieldsData[f.id] !== undefined && customFieldsData[f.id] !== "");

  // Owner Name Initials
  const ownerInitials = house.ownerName ? house.ownerName.slice(0, 2) : "บห";

  return (
    <div className="max-w-7xl mx-auto pb-16 px-3 sm:px-6 font-sans space-y-6">
      
      {/* ========================================================
          1. ULTRA-POLISHED HERO HEADER
      ======================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="relative z-10 space-y-2">
          <Link 
            href="/dashboard/houses" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100/80 hover:bg-indigo-50 px-2.5 py-1 rounded-lg"
          >
            <ArrowLeft size={13} />
            <span>กลับไปหน้ารวมบ้าน</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center justify-center shrink-0">
              <LottieIcon src="/icons/icons8-home.json" size={48} loop autoplay />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  บ้านเลขที่ {house.houseNumber}
                </h1>
                {house.zone && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    <Building2 size={12} />
                    ชุมชน{house.zone}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                เจ้าของบ้าน: <strong className="text-slate-800 font-semibold">{house.ownerName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-2 w-full md:w-auto mt-4 md:mt-0">
          <HouseActionsClient house={house as any} customFieldsSchema={schema} />
        </div>
      </div>

      {/* ========================================================
          2. 3 GLASSMORPHIC KPI METRIC CARDS
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        
        {/* Card 1: Outstanding Overdue Debt */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between ${
          totalUnpaid > 0 
            ? "bg-gradient-to-br from-white to-rose-50/40 border-rose-200/80 shadow-2xs" 
            : "bg-white border-slate-200/80 shadow-2xs"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${totalUnpaid > 0 ? "text-rose-800" : "text-slate-500"}`}>
              ยอดค้างชำระ (รอเก็บ)
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalUnpaid > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"
            }`}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <CurrencyDisplay
              amount={totalUnpaid}
              size="2xl"
              variant={totalUnpaid > 0 ? "danger" : "default"}
            />
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                totalUnpaid > 0 ? "bg-rose-100/80 text-rose-800" : "bg-slate-100 text-slate-500"
              }`}>
                {unpaidInvoices.length} งวดค้างชำระ
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Paid Accumulation */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">ยอดชำระแล้วสะสม</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <CurrencyDisplay
              amount={totalPaid}
              size="2xl"
              variant="success"
            />
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md">
                {paidInvoices.length} งวดชำระครบแล้ว
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Wallet Credit / Advance Payment */}
        <div className="bg-gradient-to-br from-white to-indigo-50/40 p-4 sm:p-5 rounded-3xl border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">กระเป๋าเงิน / จ่ายล่วงหน้า</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-[#5B58F2] flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <CurrencyDisplay
                amount={walletBalanceNum}
                size="2xl"
                variant="primary"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                {walletBalanceNum > 0 ? "มีเงินคงเหลือตัดบิลอัตโนมัติ" : "ไม่มีเงินคงเหลือในกระเป๋า"}
              </div>
            </div>
            <WalletModalButton houseId={house.id} currentWallet={house.walletBalance || "0"} />
          </div>
        </div>

      </div>

      {/* ========================================================
          3. MAIN CONTENT: 2-COLUMN COCKPIT
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: House Specs & Profile Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Identity & Specs Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-5">
            
            {/* Header with Avatar */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-base font-black border border-slate-200/70 shrink-0">
                {ownerInitials}
              </div>
              <div className="truncate">
                <h3 className="font-bold text-base text-slate-900 truncate">{house.ownerName}</h3>
                <p className="text-xs text-slate-400">เจ้าบ้าน / ผู้รับผิดชอบค่าขยะ</p>
              </div>
            </div>

            {/* Key-Value Details */}
            <div className="space-y-3.5 text-xs">
              
              {/* Full Address */}
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#5B58F2] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">ที่อยู่แบบเต็ม</span>
                  <span className="font-medium text-slate-800 leading-relaxed">{fullAddress || "-"}</span>
                </div>
              </div>

              {/* Monthly Rate */}
              <div className="flex items-start gap-2.5">
                <Banknote size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">เรทค่าจัดเก็บประจำเดือน</span>
                  <CurrencyDisplay
                    amount={house.defaultBillingAmount || "20"}
                    size="sm"
                    variant="default"
                    suffix="/ เดือน"
                  />
                </div>
              </div>

              {/* LINE Connection Status */}
              <div className="flex items-start gap-2.5">
                <MessageCircle size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">การผูกบัญชี LINE Bot</span>
                  {house.lineUserId ? (
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      ผูกบัญชีเรียบร้อย (พร้อมรับแจ้งเตือน)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      ยังไม่ได้ผูกบัญชี LINE
                    </span>
                  )}
                </div>
              </div>

              {/* Registered Date */}
              <div className="flex items-start gap-2.5">
                <CalendarDays size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">วันที่ลงทะเบียนในระบบ</span>
                  <span className="text-slate-700 font-medium">
                    {house.createdAt ? new Date(house.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </span>
                </div>
              </div>

            </div>

            {/* Custom Dynamic Fields (if any) */}
            {displayCustomFields.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ข้อมูลเพิ่มเติม
                </span>
                {displayCustomFields.map((field) => (
                  <div key={field.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 last:border-0">
                    <span className="text-slate-500">{field.name}:</span>
                    <span className="font-bold text-slate-800">{customFieldsData[field.id]}</span>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Invoices History Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden space-y-0">
          
          {/* Card Table Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-[#5B58F2] flex items-center justify-center font-bold">
                <Receipt size={16} />
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-900">
                  ประวัติบิลค่าขยะทั้งหมด
                </h2>
                <p className="text-xs text-slate-400">รายการเรียกเก็บและประวัติการชำระเงินของบ้านหลังนี้</p>
              </div>
            </div>

            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/70">
              {houseInvoices.length} รายการ
            </span>
          </div>

          {/* Invoices List / Table */}
          {houseInvoices.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate-400 space-y-2">
              <Receipt size={42} className="mx-auto text-slate-300 stroke-1" />
              <p className="font-bold text-slate-600 text-sm">ยังไม่มีรายการบิลสำหรับบ้านหลังนี้</p>
              <p className="text-xs text-slate-400">บิลจะถูกสร้างอัตโนมัติตามรอบบิล หรือกดปุ่ม &ldquo;ออกบิลรายหลัง&rdquo; ด้านบน</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">ประจำเดือน</th>
                    <th className="px-5 py-3.5">ยอดเงิน</th>
                    <th className="px-5 py-3.5">สถานะ</th>
                    <th className="px-5 py-3.5">วันที่ทำรายการ</th>
                    <th className="px-5 py-3.5 text-right">หลักฐาน / ใบเสร็จ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {houseInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Month Year */}
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatThaiMonth(inv.monthYear)}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <CurrencyDisplay amount={inv.amount} size="sm" variant="default" />
                      </td>

                      {/* Status & Quick Action */}
                      <td className="px-5 py-4">
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <CheckCircle2 size={13} /> ชำระแล้ว
                          </span>
                        ) : inv.status === 'pending_advance' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                            <Clock size={13} /> จ่ายล่วงหน้า (รอตรวจ)
                          </span>
                        ) : inv.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                            <Clock size={13} /> รอตรวจสอบสลิป
                          </span>
                        ) : (
                          <CashPaymentButton invoiceId={inv.id} monthYear={inv.monthYear} />
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-500 font-medium text-[11px]">
                        {inv.tx?.paidAt 
                          ? new Date(inv.tx.paidAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) 
                          : (inv.tx?.createdAt ? new Date(inv.tx.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-")}
                      </td>

                      {/* Proof / Slip Modal */}
                      <td className="px-5 py-4 text-right">
                        {inv.tx?.slipImageUrl && inv.tx.slipImageUrl !== "pending" ? (
                          <SlipModalButton imageUrl={inv.tx.slipImageUrl} buttonStyle="house" />
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
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
  );
}
