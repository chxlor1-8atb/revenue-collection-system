import fs from 'fs';
import path from 'path';

const actionsFile = path.resolve('src/app/dashboard/houses/actions.ts');
let content = fs.readFileSync(actionsFile, 'utf-8');

const newCreateFn = `export async function createInitialInvoice(houseId: number, monthYear: string, amount: string, type: string = 'monthly', title: string | null = null) {
  try {
    if (type === 'monthly') {
      const existing = await db.select().from(invoices).where(
        and(eq(invoices.houseId, houseId), eq(invoices.monthYear, monthYear), eq(invoices.type, 'monthly'))
      ).limit(1);
      
      if (existing.length > 0) {
        return { success: false, error: "บิลประจำเดือนนี้ถูกสร้างไปแล้ว" };
      }
    }
    
    await db.insert(invoices).values({
      houseId,
      monthYear,
      amount,
      type,
      title,
      status: 'unpaid'
    });

    revalidatePath(\`/dashboard/houses/\${houseId}\`);
    revalidatePath(\`/dashboard/houses\`);
    return { success: true };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างบิล" };
  }
}`;

content = content.replace(
  /export async function createInitialInvoice[\s\S]*?catch \(error: any\) \{[\s\S]*?return \{ success: false, error: error\.message \|\| "เกิดข้อผิดพลาดในการสร้างบิล" \};\s*\}\s*\}/,
  newCreateFn
);

fs.writeFileSync(actionsFile, content);
console.log('actions.ts updated');
