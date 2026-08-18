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

    const response = await fetch("https://connect.slip2go.com/api/verify-slip/qr-image/info", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slip2Go verification failed:", errorText);
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
    return { success: false, error: "Internal Server Error during verification" };
  }
}
