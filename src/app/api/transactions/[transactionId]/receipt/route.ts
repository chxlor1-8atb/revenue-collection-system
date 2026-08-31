import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> | { transactionId: string } }
) {
  try {
    const resolvedParams = await params;
    const txId = parseInt(resolvedParams.transactionId, 10);
    
    const txDetails = await db.select({
      id: transactions.id,
      amount: transactions.amountClaimedByPayer,
      paidAt: transactions.paidAt,
      houseNumber: houses.houseNumber,
      ownerName: houses.ownerName,
    })
    .from(transactions)
    .innerJoin(invoices, eq(invoices.transactionId, transactions.id))
    .innerJoin(houses, eq(houses.id, invoices.houseId))
    .where(eq(transactions.id, txId))
    .limit(1);

    if (txDetails.length === 0) return new NextResponse("Receipt not found", { status: 404 });
    const tx = txDetails[0];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสร็จรับเงิน - ${tx.houseNumber}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');
          body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; background: #f8fafc; }
          .receipt-box { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #5B58F2; font-size: 28px; }
          .details { margin-bottom: 40px; }
          .details table { width: 100%; border-collapse: collapse; }
          .details th, .details td { padding: 12px 0; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 15px; }
          .details th { color: #64748b; font-weight: 500; width: 40%; }
          .details td { font-weight: 700; color: #0f172a; }
          .total { font-size: 24px; font-weight: bold; text-align: right; color: #10B981; padding: 20px; background: #ecfdf5; border-radius: 8px; }
          .footer { text-align: center; margin-top: 50px; font-size: 13px; color: #94a3b8; }
          @media print { 
            body { padding: 0; background: white; } 
            .receipt-box { border: none; box-shadow: none; padding: 0; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1>ใบเสร็จรับเงิน (e-Receipt)</h1>
            <p style="margin-top: 5px; color: #64748b;">เทศบาลเมืองนางรอง</p>
          </div>
          <div class="details">
            <table>
              <tr><th>เลขที่อ้างอิง (Ref No.):</th><td>RC-${tx.id.toString().padStart(6, '0')}</td></tr>
              <tr><th>วันที่รับเงิน:</th><td>${tx.paidAt ? new Date(tx.paidAt).toLocaleString('th-TH') : '-'}</td></tr>
              <tr><th>บ้านเลขที่:</th><td>${tx.houseNumber}</td></tr>
              <tr><th>ชื่อผู้ชำระ:</th><td>${tx.ownerName}</td></tr>
            </table>
          </div>
          <div class="total">
            ยอดเงินสุทธิ: ฿${parseFloat(tx.amount || "0").toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div style="text-align: center; margin-top: 20px;" class="no-print">
            <button onclick="window.print()" style="background: #5B58F2; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-family: 'Sarabun'; font-size: 16px; cursor: pointer; font-weight: bold;">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
          </div>
          <div class="footer">
            ออกโดยระบบรับชำระเงินอิเล็กทรอนิกส์<br/>
            (Auto-generated electronic receipt)
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    console.error(error);
    return new NextResponse("Error generating receipt", { status: 500 });
  }
}
