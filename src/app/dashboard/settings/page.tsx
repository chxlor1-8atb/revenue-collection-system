import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Fetch the first settings row
  const [settings] = await db.select().from(systemSettings).limit(1);

  return (
    <div>
      <h1 className="font-bold text-3xl mb-6 text-[#1F2E22]">ตั้งค่าระบบ</h1>
      
      {settings ? (
        <SettingsForm 
          collectorId={settings.id} 
          initialName={settings.accountName} 
          initialPromptPay={settings.promptPayId}
        />
      ) : (
        <SettingsForm 
          collectorId={1} 
          initialName="ชื่อบัญชีรับเงิน" 
          initialPromptPay="เบอร์พร้อมเพย์"
        />
      )}
    </div>
  );
}
