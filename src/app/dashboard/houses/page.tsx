import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import GenerateInvoiceButton from "./GenerateInvoiceButton";
import { Home, User, MapPin, ExternalLink, PlusCircle } from "lucide-react";

export default async function HousesPage() {
  const allHouses = await db.select().from(houses).orderBy(desc(houses.createdAt));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <h1 className="font-serif font-bold text-3xl text-slate-800 flex items-center gap-2">
          <Home className="w-8 h-8 text-teal-600" />
          จัดการข้อมูลบ้าน
        </h1>
        
        <div className="flex gap-3">
          <button className="btn btn-primary font-sans text-sm py-2 px-4 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" />
            เพิ่มบ้านใหม่
          </button>
          <GenerateInvoiceButton />
        </div>
      </div>
      
      <div className="receipt-card p-0 overflow-hidden border border-slate-200 bg-white shadow-sm rounded-xl">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                <th className="p-4 font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">บ้านเลขที่</th>
                <th className="p-4 font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">ชื่อเจ้าบ้าน</th>
                <th className="p-4 font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">ชุมชน / หมู่</th>
                <th className="p-4 font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {allHouses.map((house) => (
                <tr key={house.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800 flex items-center gap-2">
                    <Home className="w-4 h-4 text-teal-600" />
                    {house.houseNumber}
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {house.ownerName}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {house.zone || "-"}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link 
                      href={`/house/${house.id}`} 
                      target="_blank" 
                      className="text-teal-600 hover:text-teal-700 font-semibold transition-colors flex items-center gap-1 text-xs"
                    >
                      ดูสมุดบัญชี (หน้าบ้าน)
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              
              {allHouses.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                    ไม่มีข้อมูลบ้านในระบบขณะนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
