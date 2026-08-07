import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { desc, eq, count } from "drizzle-orm";
import Link from "next/link";
import GenerateInvoiceButton from "./GenerateInvoiceButton";

export default async function HousesPage() {
  const allHouses = await db.select().from(houses).orderBy(desc(houses.createdAt));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-3xl">จัดการข้อมูลบ้าน</h1>
        
        <div className="flex gap-4">
          <button className="btn btn-primary font-serif">+ เพิ่มบ้านใหม่</button>
          <GenerateInvoiceButton />
        </div>
      </div>
      
      <div className="receipt-card p-0 overflow-hidden">
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", backgroundColor: "#f9f9f9" }}>
              <th className="p-4 font-serif">บ้านเลขที่</th>
              <th className="p-4 font-serif">ชื่อเจ้าบ้าน</th>
              <th className="p-4 font-serif">ชุมชน/หมู่</th>
              <th className="p-4 font-serif">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {allHouses.map((house) => (
              <tr key={house.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="p-4 font-mono font-bold">{house.houseNumber}</td>
                <td className="p-4 font-sans">{house.ownerName}</td>
                <td className="p-4 font-sans">{house.zone || "-"}</td>
                <td className="p-4">
                  <Link href={`/house/${house.id}`} target="_blank" className="text-status-pending underline text-sm hover:text-green-800 font-sans">
                    ดูสมุดบัญชี (หน้าบ้าน)
                  </Link>
                </td>
              </tr>
            ))}
            
            {allHouses.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  ไม่มีข้อมูลบ้าน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
