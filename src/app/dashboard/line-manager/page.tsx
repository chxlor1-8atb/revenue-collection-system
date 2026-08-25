import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import LineManagerClient from "./LineManagerClient";

export const dynamic = "force-dynamic";

export default async function LineManagerPage() {
  const [settings] = await db.select().from(systemSettings).limit(1);
  const lineConfig = (settings?.lineConfig as any) || {
    emergencyPhone: "044-631405",
    healthDeptPhone: "044-631405",
    announcementText: "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา",
    isAnnouncementActive: true,
  };

  return (
    <LineManagerClient
      initialConfig={lineConfig}
    />
  );
}
