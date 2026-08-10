import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";

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
    <div className="layout-center flex-col">
      <div className="receipt-card max-w-md w-full">
        <div className="absolute top-0 right-0 w-8 h-8 bg-[#F6F4EC] border-l border-b border-[#D8D3C3] -mt-1 -mr-1 transform rotate-45"></div>

        <div className="text-center mb-4">
          <h1 className="font-serif text-2xl font-bold mb-1">สมุดบัญชีรายรับค่าขยะ</h1>
          <p className="font-sans text-sm text-status-dark">เทศบาลเมืองนางรอง</p>
        </div>
        
        <div className="perforation-line"></div>

        <div className="mb-6 font-mono text-sm space-y-1">
          <p><strong>บ้านเลขที่:</strong> {house.houseNumber}</p>
          <p><strong>ชื่อเจ้าบ้าน:</strong> {house.ownerName}</p>
          <p><strong>ชุมชน/หมู่:</strong> {house.zone || "-"}</p>
        </div>

        <h2 className="font-serif font-bold text-lg mb-4">รายการบิลค่าขยะ</h2>
        
        <InvoiceSelectionForm invoices={houseInvoices} houseId={houseId} />
        
      </div>
      
      <a href="/" className="mt-8 text-sm text-gray-500 underline font-sans">
        กลับไปหน้าค้นหา
      </a>
    </div>
  );
}
