export interface Slip2GoResponse {
  success: boolean;
  data?: {
    amount: number;
    sender: {
      name: string;
      accountNumber?: string;
    };
    receiver: {
      name: string;
      accountNumber?: string;
    };
    transRef: string;
    transDate: string;
  };
  error?: string;
  errorCode?: string;
  originalData?: any;
}

export async function verifySlipWithBuffer(imageBuffer: Buffer): Promise<Slip2GoResponse> {
  const apiKey = process.env.SLIP2GO_API_KEY;
  if (!apiKey) {
    console.warn("SLIP2GO_API_KEY is not set. Skipping verification.");
    return { success: false, error: "API Key not configured" };
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer as any], { type: 'image/jpeg' }), 'slip.jpg');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://connect.slip2go.com/api/verify-slip/qr-image/info", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slip2Go verification failed:", errorText);
      // For 5xx errors or serious failures, throw to trip the circuit breaker
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Slip2Go API Failure: ${response.status}`);
      }
      return { success: false, error: "Verification API failed" };
    }

    const result = await response.json();
    
    // Check if the slip is fraud or data is missing
    if (result.code === "200500" || result.message === "Slip is fraud." || result.message?.includes("Duplicate")) {
      return { 
        success: false, 
        error: "ตรวจพบว่าสลิปนี้เป็นสลิปปลอมหรือเคยใช้งานไปแล้ว",
        errorCode: "duplicate",
        originalData: result.data
      };
    }

    if (!result.data || result.data.amount === undefined) {
      return { 
        success: false, 
        error: result.message || "ข้อมูลสลิปไม่ถูกต้อง หรือไม่สามารถอ่าน QR Code ได้",
        errorCode: "invalid"
      };
    }

    // Validate Recipient Account
    try {
      const { db } = await import("@/lib/db");
      const { systemSettings } = await import("@/lib/schema");
      const settings = await db.select().from(systemSettings).limit(1);
      if (settings.length > 0 && settings[0].promptPayId) {
        const expectedAccount = settings[0].promptPayId.replace(/\D/g, ''); // e.g. "0986485736"
        
        // Extract the actual receiver account from the slip data
        let actualAccount = "";
        const r = result.data.receiver;
        if (r) {
          actualAccount = (r.account?.proxy?.account || r.account?.bank?.account || r.accountNumber || r.account?.number || "").replace(/\D/g, '');
        }

        // Only enforce strict match if both are present and we extracted a valid account string
        if (expectedAccount && actualAccount && !actualAccount.includes(expectedAccount) && !expectedAccount.includes(actualAccount)) {
          return {
            success: false,
            error: "บัญชีผู้รับไม่ถูกต้อง",
            errorCode: "invalid",
            originalData: result.data
          };
        }
      }
    } catch (dbErr) {
      console.warn("Failed to validate receiver account against DB config:", dbErr);
    }

    // Success case
    return {
      success: true,
      data: {
        amount: parseFloat(result.data.amount),
        sender: {
          name: result.data.sender?.name || result.data.senderName || result.data.sender?.account?.name || result.data.senderAccount,
          accountNumber: result.data.sender?.account?.number || result.data.senderAccountNumber || "",
        },
        receiver: {
          name: result.data.receiver?.name || result.data.receiverName || result.data.receiver?.account?.name || result.data.receiverAccount,
          accountNumber: result.data.receiver?.account?.number || result.data.receiverAccountNumber || "",
        },
        transRef: result.data.transRef || result.data.transactionRef || "",
        transDate: result.data.transDate || result.data.transTime || result.data.transTimestamp || "",
      }
    };
  } catch (error) {
    console.error("Slip2Go API error:", error);
    // Rethrow network/timeout errors to trip the circuit breaker
    throw error;
  }
}
