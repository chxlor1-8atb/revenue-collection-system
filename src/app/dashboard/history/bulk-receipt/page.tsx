import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { inArray, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PrintTrigger from "../[txId]/receipt/PrintTrigger";

function formatThaiMonth(monthYear: string) {
  if (!monthYear) return "-";
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const parts = monthYear.split("-");
  if (parts.length < 2) return monthYear;
  const [year, month] = parts;
  const monthIdx = parseInt(month, 10);
  const yearBe = parseInt(year, 10) + 543;
  return `${thaiMonths[monthIdx] || month} ${yearBe}`;
}

function thaiBahtText(num: number): string {
  if (isNaN(num) || num === 0) return "ศูนย์บาทถ้วน";
  const thaiNums = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiUnits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const [intStr, decStr] = num.toFixed(2).split(".");
  
  function convertGroup(nStr: string): string {
    let res = "";
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i], 10);
      const unit = thaiUnits[len - i - 1];
      if (digit !== 0) {
        if (unit === "สิบ" && digit === 1) {
          res += "สิบ";
        } else if (unit === "สิบ" && digit === 2) {
          res += "ยี่สิบ";
        } else if (unit === "" && digit === 1 && len > 1 && parseInt(nStr[len - 2], 10) !== 0) {
          res += "เอ็ด";
        } else {
          res += thaiNums[digit] + unit;
        }
      }
    }
    return res;
  }

  let bahtPart = "";
  let intNum = intStr;
  if (intNum.length > 6) {
    const millionPart = intNum.slice(0, -6);
    intNum = intNum.slice(-6);
    bahtPart = convertGroup(millionPart) + "ล้าน" + convertGroup(intNum);
  } else {
    bahtPart = convertGroup(intNum);
  }
  bahtPart += "บาท";

  let satangPart = "";
  if (decStr && decStr !== "00") {
    satangPart = convertGroup(decStr) + "สตางค์";
  } else {
    satangPart = "ถ้วน";
  }

  return bahtPart + satangPart;
}

export default async function BulkReceiptPage(props: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await props.searchParams;
  const idsStr = params.ids || "";
  const txIds = idsStr
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));

  if (txIds.length === 0) return notFound();

  // Fetch all transactions
  const txList = await db
    .select()
    .from(transactions)
    .where(inArray(transactions.id, txIds));

  if (txList.length === 0) return notFound();

  // Fetch all invoices matching these transactions
  const allInvoices = await db
    .select({
      id: invoices.id,
      transactionId: invoices.transactionId,
      monthYear: invoices.monthYear,
      amount: invoices.amount,
      houseNumber: houses.houseNumber,
      ownerName: houses.ownerName,
      zone: houses.zone,
    })
    .from(invoices)
    .innerJoin(houses, eq(invoices.houseId, houses.id))
    .where(inArray(invoices.transactionId, txIds));

  // Fetch all line messages for these transactions
  const allLineMsgs = await db
    .select()
    .from(lineMessages)
    .where(inArray(lineMessages.transactionId, txIds));

  // Map data per transaction
  const receipts = txList.map((tx) => {
    const relatedInvoices = allInvoices.filter((inv) => inv.transactionId === tx.id);
    const house = relatedInvoices.length > 0 ? relatedInvoices[0] : {
      houseNumber: "-",
      ownerName: "-",
      zone: "-",
    };

    const lineMsg = allLineMsgs.find((m) => m.transactionId === tx.id);
    const senderName = lineMsg ? lineMsg.senderName : (house.ownerName || "-");
    const paidVia =
      tx.verifiedBy === "line_bot" || lineMsg ? "LINE Bot (ออนไลน์)" : tx.verifiedBy === "admin_cash" ? "เงินสด (หน้าเคาน์เตอร์)" : "PromptPay QR (เว็บไซต์)";
    const totalAmount = parseFloat(tx.amount || "0");
    const paidDate = tx.paidAt || tx.createdAt || new Date();

    return {
      tx,
      house,
      invoices: relatedInvoices,
      senderName,
      paidVia,
      totalAmount,
      paidDate,
    };
  });

  return (
    <div className="min-h-screen bg-slate-200 py-4 sm:py-8 font-sans print:bg-white print:py-0 print:m-0">
      <PrintTrigger />

      {/* Receipts Container */}
      <div className="space-y-8 print:space-y-0 max-w-[210mm] mx-auto">
        {receipts.map(({ tx, house, invoices: txInvoices, senderName, paidVia, totalAmount, paidDate }, idx) => (
          <div
            key={tx.id}
            id="printable-receipt"
            className="bg-white p-6 sm:p-12 shadow-md print:shadow-none print:p-0 print:m-0 min-h-[250mm] sm:min-h-[265mm] border border-slate-300 print:border-none relative break-after-page print:page-break-after-always overflow-hidden flex flex-col justify-between"
            style={{ pageBreakAfter: "always", breakAfter: "page" }}
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0 overflow-hidden select-none">
              <span className="text-[80px] sm:text-[120px] md:text-[140px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                กองสาธารณสุข
              </span>
            </div>

            {/* Document Content */}
            <div className="relative z-10 flex flex-col h-full justify-between flex-1 gap-8">
              
              {/* Top Section */}
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b-2 border-slate-800 pb-6 mb-6 gap-4 sm:gap-0">
                  <div className="flex gap-5 items-center">
                    <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0" />
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">ใบเสร็จรับเงิน</h1>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-800 mt-1">เทศบาลเมืองนางรอง</h2>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">กองสาธารณสุขและสิ่งแวดล้อม อ.นางรอง จ.บุรีรัมย์ 31110</p>
                    </div>
                  </div>
                  <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-baseline sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <div className="text-2xl sm:text-4xl font-black tracking-widest text-slate-300 sm:mb-2 order-2 sm:order-1">
                      ชำระค่าขยะ
                    </div>
                    <div className="order-1 sm:order-2 space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-800">เลขที่รายการ: #{tx.id}</p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        วันที่ออกใบเสร็จ: {paidDate.toLocaleString("th-TH", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border border-slate-300 rounded-xl p-4 sm:p-5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm mb-6">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน</div>
                    <div className="text-base font-bold text-slate-900">{house.ownerName || "-"}</div>
                    <div className="text-slate-600">บ้านเลขที่: <span className="font-semibold text-slate-800">{house.houseNumber || "-"}</span></div>
                    <div className="text-slate-600">ชุมชน / โซน: <span className="font-medium text-slate-700">{house.zone || "ในเขตเทศบาลเมืองนางรอง"}</span></div>
                  </div>
                  <div className="space-y-1.5 sm:text-right sm:border-l sm:border-slate-200 sm:pl-6">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการรับชำระ</div>
                    <div className="text-slate-800 font-medium">ผู้ทำรายการ: <span className="font-semibold text-slate-900">{senderName}</span></div>
                    <div className="text-slate-600">ช่องทางการชำระ: <span className="font-semibold text-slate-800">{paidVia}</span></div>
                    {tx.slipRefId && (
                      <div className="text-slate-500 text-[11px] font-mono">รหัสอ้างอิง (Ref): {tx.slipRefId}</div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-hidden border border-slate-300 rounded-xl mb-6">
                  <table className="w-full border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                        <th className="py-3 px-3 text-left font-bold w-12 sm:w-16">ลำดับ</th>
                        <th className="py-3 px-4 text-left font-bold">รายการชำระเงิน</th>
                        <th className="py-3 px-4 text-right font-bold w-36 sm:w-44">จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {txInvoices.length > 0 ? (
                        txInvoices.map((inv, index) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-3 text-slate-600 text-center font-medium">{index + 1}</td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900 text-sm sm:text-base">ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย</div>
                              <div className="text-xs text-slate-500 mt-1">
                                ประจำงวดเดือน: <span className="font-semibold text-slate-700">{formatThaiMonth(inv.monthYear)}</span> (รหัสบิล: #{inv.id})
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-sm sm:text-base text-slate-900">
                              {parseFloat(inv.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-4 px-3 text-slate-600 text-center font-medium">1</td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 text-sm sm:text-base">ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย</div>
                            <div className="text-xs text-slate-500 mt-1">ชำระตามรายการธุรกรรม #{tx.id}</div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-sm sm:text-base text-slate-900">
                            {totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-800">
                        <td colSpan={2} className="py-4 px-4 text-slate-800 font-bold text-xs sm:text-sm">
                          <span className="text-slate-500 font-normal mr-2">จำนวนเงินรวม (ตัวอักษร):</span>
                          <span className="text-slate-900 font-bold">({thaiBahtText(totalAmount)})</span>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-black text-base sm:text-xl text-slate-900">
                          ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="mt-auto pt-4 space-y-6">
                {/* Official Terms & Note */}
                <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/40 text-[11px] sm:text-xs text-slate-500 leading-relaxed space-y-1">
                  <div className="font-bold text-slate-700">หมายเหตุและระเบียบปฏิบัติ:</div>
                  <p>1. ใบเสร็จรับเงินนี้ออกโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535</p>
                  <p>2. ได้รับเงินถูกต้องเรียบร้อยแล้ว โปรดเก็บรักษาเอกสารฉบับนี้ไว้เป็นหลักฐานการชำระเงิน</p>
                  <p>3. สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-631-414 ในวันและเวลาราชการ</p>
                </div>

                {/* Symmetrical Signatures Block */}
                <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-2">
                  <div className="text-center flex flex-col items-center">
                    <div className="h-12 flex items-end justify-center mb-2 w-48 sm:w-64 border-b border-slate-400 border-dashed pb-1.5">
                      <span className="text-slate-900 font-semibold text-xs sm:text-sm truncate max-w-full px-2">
                        {house.ownerName || "-"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">ผู้ชำระเงิน</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">(เจ้าของบ้าน / ตัวแทนผู้ชำระ)</p>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    <div className="h-12 flex items-end justify-center mb-2 w-48 sm:w-64 border-b border-slate-400 border-dashed pb-1.5">
                      <span className="text-slate-900 font-bold text-xs sm:text-sm truncate max-w-full px-2">
                        {tx.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">กองสาธารณสุขและสิ่งแวดล้อม</p>
                  </div>
                </div>

                {/* Print Notice Footer */}
                <div suppressHydrationWarning className="text-center text-[10px] sm:text-xs text-slate-400 pt-3 border-t border-slate-200/80">
                  เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ (ใบที่ {idx + 1} จาก {receipts.length}) • เทศบาลเมืองนางรอง • วันที่พิมพ์: {new Date().toLocaleString("th-TH")}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
