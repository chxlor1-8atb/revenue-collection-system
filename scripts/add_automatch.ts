import fs from 'fs';
import path from 'path';

const file = path.resolve('src/app/api/webhook/line/route.ts');
let content = fs.readFileSync(file, 'utf-8');

const helperCode = `
async function attemptAutoApprove(house: any, slipAmountStr: string, slipImageUrl: string, transRef: string | null = null): Promise<{ success: boolean; newTxId?: number; totalDebt?: number }> {
  try {
    const slipValue = parseFloat(slipAmountStr);
    const defaultBill = parseFloat(house.defaultBillingAmount || "20");
    
    const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    
    let isMatch = false;
    let advanceMonthsCount = 0;
    
    if (Math.abs(slipValue - totalDebt) < 0.01) {
      isMatch = true; // Exact match
    } else if (slipValue > totalDebt && defaultBill > 0) {
      const overpayAmount = slipValue - totalDebt;
      const remainder = overpayAmount % defaultBill;
      if (remainder < 0.01 || Math.abs(remainder - defaultBill) < 0.01) {
        isMatch = true; // Advance match
        advanceMonthsCount = Math.round(overpayAmount / defaultBill);
      }
    } else if (totalDebt === 0 && defaultBill > 0 && slipValue > 0) {
      const remainder = slipValue % defaultBill;
      if (remainder < 0.01 || Math.abs(remainder - defaultBill) < 0.01) {
        isMatch = true;
        advanceMonthsCount = Math.round(slipValue / defaultBill);
      }
    }

    if (!isMatch) {
      return { success: false, totalDebt };
    }

    // CREATE TRANSACTION
    const newTx = await db.insert(transactions).values({
      amount: slipAmountStr,
      amountClaimedByPayer: slipAmountStr,
      slipImageUrl: slipImageUrl,
      slipStatus: "verified",
      slipRefId: transRef,
      paidAt: new Date(),
      verifiedBy: "line_bot_auto",
    }).returning();

    const txId = newTx[0].id;

    // MARK EXISTING INVOICES AS PAID
    if (unpaidInvoices.length > 0) {
      await db.update(invoices).set({ status: 'paid', transactionId: txId }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
    }

    // GENERATE ADVANCE INVOICES
    if (advanceMonthsCount > 0) {
      let lastMonthDate = new Date();
      const latestInvoiceList = await db.select().from(invoices).where(eq(invoices.houseId, house.id)).orderBy(desc(invoices.monthYear)).limit(1);
      if (latestInvoiceList.length > 0) {
        const [year, month] = latestInvoiceList[0].monthYear.split("-");
        lastMonthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      for (let i = 1; i <= advanceMonthsCount; i++) {
        const advanceDate = new Date(lastMonthDate);
        advanceDate.setMonth(advanceDate.getMonth() + i);
        const advanceMonthYear = \`\${advanceDate.getFullYear()}-\${String(advanceDate.getMonth() + 1).padStart(2, "0")}\`;
        
        await db.insert(invoices).values({
          houseId: house.id,
          amount: defaultBill.toString(),
          status: 'paid', // immediately paid
          monthYear: advanceMonthYear,
          transactionId: txId
        });
      }
    }

    return { success: true, newTxId: txId, totalDebt };
  } catch (error) {
    console.error("Auto approve error:", error);
    return { success: false, totalDebt: 0 };
  }
}
`;

content = content.replace('export async function POST', helperCode + '\nexport async function POST');

const searchBlock1 = `            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
            const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            
            if (totalDebt > 0 && Math.abs(parseFloat(slipAmount) - totalDebt) < 0.01) {
              // Perfect match! Auto-approve for the linked house
              const newTx = await db.insert(transactions).values({
                amount: slipAmount,
                amountClaimedByPayer: slipAmount,
                slipImageUrl: blobUrl,
                slipStatus: "verified",
                slipRefId: transRef || null,
                paidAt: new Date(),
                verifiedBy: "line_bot_auto",
              }).returning();
              
              await db.update(invoices).set({ status: 'paid', transactionId: newTx[0].id }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));`;

const replaceBlock1 = `            const autoResult = await attemptAutoApprove(house, slipAmount, blobUrl, transRef || null);
            const totalDebt = autoResult.totalDebt || 0;
            if (autoResult.success) {
              const newTxId = autoResult.newTxId;`;

content = content.replace(searchBlock1, replaceBlock1);

// Specifically replace newTx[0].id for block 1 AFTER it was replaced
const searchBlock1Part2 = `              await db.insert(lineMessages).values({
                lineMessageId: event.message.id,
                lineUserId: userId,
                type: "image",
                imageUrl: blobUrl,
                status: "verified_auto",
                amount: slipAmount,
                senderName: verification.data?.sender.name,
                isVerified: true,
                transactionId: newTx[0].id
              });`;

const replaceBlock1Part2 = `              await db.insert(lineMessages).values({
                lineMessageId: event.message.id,
                lineUserId: userId,
                type: "image",
                imageUrl: blobUrl,
                status: "verified_auto",
                amount: slipAmount,
                senderName: verification.data?.sender.name,
                isVerified: true,
                transactionId: newTxId
              });`;
content = content.replace(searchBlock1Part2, replaceBlock1Part2);


const searchBlock2 = `              // Find unpaid invoices for this house
              const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
              const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
              
              if (totalDebt > 0 && slipData.isVerified && slipData.amount && Math.abs(parseFloat(slipData.amount) - totalDebt) < 0.01) {
                // Perfect match! Auto-approve using existing transaction
                if (slipData.transactionId) {
                  await db.update(lineMessages).set({ status: 'verified_auto' }).where(eq(lineMessages.id, slipData.id));
                  await db.update(invoices).set({ status: 'paid', transactionId: slipData.transactionId }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
                  
                  await replyMessage(replyToken, \`✅ ยืนยันข้อมูลสำเร็จ!\\nระบบได้ตัดยอดหนี้ \${totalDebt} บาท สำหรับบ้านเลขที่ \${text} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚\`);
                  return NextResponse.json({ status: "ok" });
                }
              }`;

const replaceBlock2 = `              if (slipData.isVerified && slipData.amount) {
                const autoResult = await attemptAutoApprove(house, slipData.amount, slipData.imageUrl || "", null);
                const totalDebt = autoResult.totalDebt || 0;
                
                if (autoResult.success) {
                  await db.update(lineMessages).set({ status: 'verified_auto', transactionId: autoResult.newTxId }).where(eq(lineMessages.id, slipData.id));
                  await replyMessage(replyToken, \`✅ ยืนยันข้อมูลสำเร็จ!\\nระบบได้ตัดยอด \${parseFloat(slipData.amount)} บาท สำหรับบ้านเลขที่ \${text} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚\`);
                  return NextResponse.json({ status: "ok" });
                }
              }`;

content = content.replace(searchBlock2, replaceBlock2);

const searchBlock3 = `                  const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
                  const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
                  
                  if (totalDebt > 0 && slipData.isVerified && slipData.amount && Math.abs(parseFloat(slipData.amount) - totalDebt) < 0.01) {
                    const newTx = await db.insert(transactions).values({
                      amount: slipData.amount,
                      amountClaimedByPayer: slipData.amount,
                      slipImageUrl: slipData.imageUrl || "",
                      slipStatus: "verified",
                      slipRefId: null,
                      paidAt: new Date(),
                      verifiedBy: "line_bot_auto",
                    }).returning();
                    
                    await db.update(invoices).set({ status: 'paid', transactionId: newTx[0].id }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
                    await db.update(lineMessages).set({ status: 'verified_auto', transactionId: newTx[0].id }).where(eq(lineMessages.id, slipData.id));
                    
                    await replyMessage(replyToken, \`✅ ยืนยันข้อมูลสำเร็จ!\\nระบบได้ตัดยอดหนี้ \${totalDebt} บาท สำหรับบ้านเลขที่ \${house.houseNumber} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚\`);
                  }`;

const replaceBlock3 = `                  if (slipData.isVerified && slipData.amount) {
                    const autoResult = await attemptAutoApprove(house, slipData.amount, slipData.imageUrl || "", null);
                    if (autoResult.success) {
                      await db.update(lineMessages).set({ status: 'verified_auto', transactionId: autoResult.newTxId }).where(eq(lineMessages.id, slipData.id));
                      await replyMessage(replyToken, \`✅ ยืนยันข้อมูลสำเร็จ!\\nระบบได้ตัดยอด \${parseFloat(slipData.amount)} บาท สำหรับบ้านเลขที่ \${house.houseNumber} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚\`);
                    }
                  }`;

content = content.replace(searchBlock3, replaceBlock3);

// Fix message string in block 1:
content = content.replace(
  /\`✅ ระบบได้ทำการตัดยอดหนี้ \$\{totalDebt\} บาท สำหรับบ้านเลขที่ \$\{house\.houseNumber\} ให้เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚\`/g,
  "`✅ ระบบได้ทำการตัดยอด ${parseFloat(slipAmount)} บาท สำหรับบ้านเลขที่ ${house.houseNumber} ให้เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`"
);

fs.writeFileSync(file, content);
console.log('Done!');
