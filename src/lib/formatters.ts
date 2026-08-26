/**
 * Unified Financial & Currency Formatters for Revenue Collection System
 */

export interface FormatBahtOptions {
  showSymbol?: boolean;
  decimals?: number;
  compact?: boolean;
}

/**
 * Formats a monetary amount into standard Thai Baht format (e.g., ฿1,234.50 or 1,234.50)
 */
export function formatBaht(
  amount: number | string | null | undefined, 
  options: FormatBahtOptions = {}
): string {
  const { showSymbol = true, decimals = 2, compact = false } = options;

  if (amount === null || amount === undefined || amount === "") {
    return showSymbol ? "฿0.00" : "0.00";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return showSymbol ? "฿0.00" : "0.00";
  }

  if (compact && Math.abs(num) >= 1000000) {
    const formatted = (num / 1000000).toLocaleString("th-TH", { maximumFractionDigits: 1 }) + "M";
    return showSymbol ? `฿${formatted}` : formatted;
  }

  if (compact && Math.abs(num) >= 100000) {
    const formatted = (num / 1000).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + "k";
    return showSymbol ? `฿${formatted}` : formatted;
  }

  const formattedNum = num.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `฿${formattedNum}` : formattedNum;
}

/**
 * Formats large amounts compactly for mobile cards or tight tables (e.g. ฿120k, ฿1.2M)
 */
export function formatBahtCompact(amount: number | string | null | undefined): string {
  return formatBaht(amount, { showSymbol: true, compact: true });
}

/**
 * Converts a number to official Thai Baht text in words (ภาษาไทยตัวสะกด)
 * e.g., 120.50 -> "หนึ่งร้อยยี่สิบบาทห้าสิบสตางค์"
 * e.g., 20.00 -> "ยี่สิบบาทถ้วน"
 */
export function formatBahtInWords(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "ศูนย์บาทถ้วน";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return "ศูนย์บาทถ้วน";

  const numText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const unitText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const [bahtPart, satangPart = "00"] = num.toFixed(2).split(".");
  
  function convertGroup(nStr: string): string {
    let res = "";
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i], 10);
      const pos = len - i - 1;

      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          res += "สิบ";
        } else if (pos === 1 && digit === 2) {
          res += "ยี่สิบ";
        } else if (pos === 0 && digit === 1 && len > 1 && parseInt(nStr[len - 2], 10) !== 0) {
          res += "เอ็ด";
        } else {
          res += numText[digit] + unitText[pos];
        }
      }
    }
    return res;
  }

  let result = "";
  
  // Convert Baht
  if (parseInt(bahtPart, 10) > 0) {
    if (bahtPart.length > 6) {
      const millionPart = bahtPart.slice(0, -6);
      const restPart = bahtPart.slice(-6);
      result += convertGroup(millionPart) + "ล้าน" + convertGroup(restPart) + "บาท";
    } else {
      result += convertGroup(bahtPart) + "บาท";
    }
  }

  // Convert Satang
  const satangNum = parseInt(satangPart.slice(0, 2), 10);
  if (satangNum === 0) {
    result += "ถ้วน";
  } else {
    result += convertGroup(satangPart.slice(0, 2)) + "สตางค์";
  }

  return result;
}
