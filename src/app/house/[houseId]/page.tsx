import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import { Home as HomeIcon, User, MapPin, ArrowLeft } from "lucide-react";

export default async function HouseDashboard({ params }: { params: Promise<{ houseId: string }> }) {
  const houseId = parseInt((await params).houseId, 10);
  
  if (isNaN(houseId)) {
    notFound();
  }

  const result = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);

  if (result.length === 0) {
    notFound();
  }

  const house = result[0];

  const houseInvoices = await db.select()
    .from(invoices)
    .where(eq(invoices.houseId, houseId))
    .orderBy(asc(invoices.monthYear));

  return (
    <div className="layout-center flex-col relative overflow-hidden bg-slate-50">
      <div className="receipt-card max-w-sm w-full relative border border-slate-200 shadow-md bg-white p-6 rounded-xl">
        <div className="text-center mb-5">
          <h1 className="font-serif text-xl font-bold text-slate-800">สมุดบัญชีรายรับค่าขยะ</h1>
          <p className="font-sans text-[10px] text-teal-600 font-semibold tracking-wide uppercase mt-0.5">
            เทศบาลเมืองนางรอง
          </p>
        </div>
        
        <div className="perforation-line"></div>

        <div className="mb-5 font-sans text-xs space-y-2.5 bg-slate-50 p-4.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <HomeIcon className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="flex justify-between w-full">
              <span className="text-slate-500">บ้านเลขที่:</span>
              <span className="font-mono text-slate-800 font-bold">{house.houseNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="flex justify-between w-full">
              <span className="text-slate-500">ชื่อเจ้าบ้าน:</span>
              <span className="text-slate-800 font-semibold">{house.ownerName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="flex justify-between w-full">
              <span className="text-slate-500">ชุมชน/หมู่:</span>
              <span className="text-slate-800 font-semibold">{house.zone || "-"}</span>
            </div>
          </div>
        </div>

        <h2 className="font-sans font-bold text-sm mb-3.5 text-slate-800">รายการบิลค่าธรรมเนียมขยะ</h2>
        
        <InvoiceSelectionForm invoices={houseInvoices} houseId={houseId} />
        
      </div>
      
      <a href="/" className="mt-6 text-xs text-slate-500 hover:text-teal-600 transition-colors underline font-sans flex items-center gap-1 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        กลับไปหน้าค้นหาข้อมูล
      </a>
    </div>
  );
}
