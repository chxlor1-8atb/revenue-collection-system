import { db } from "@/lib/db";
import { collectors } from "@/lib/schema";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Fetch the first collector (acts as the main municipality account)
  const [collector] = await db.select().from(collectors).limit(1);

  return (
    <div>
      <h1 className="font-serif font-bold text-3xl mb-6 text-[#1F2E22]">ตั้งค่าระบบ</h1>
      
      {collector ? (
        <SettingsForm 
          collectorId={collector.id} 
          initialName={collector.name} 
          initialPromptPay={collector.promptPayId} 
        />
      ) : (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl font-sans">
          ไม่พบข้อมูลบัญชีในระบบ กรุณาติดต่อผู้ดูแลระบบ
        </div>
      )}
    </div>
  );
}
