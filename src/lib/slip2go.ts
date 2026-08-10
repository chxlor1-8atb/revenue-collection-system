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
    };
    transRef: string;
    transDate: string;
  };
  error?: string;
}

export async function verifySlipWithBase64(base64Image: string): Promise<Slip2GoResponse> {
  const apiKey = process.env.SLIP2GO_API_KEY;
  if (!apiKey) {
    console.warn("SLIP2GO_API_KEY is not set. Skipping verification.");
    return { success: false, error: "API Key not configured" };
  }

  try {
    const response = await fetch("https://connect.slip2go.com/api/verify-slip/base64/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-secret": apiKey, // Adding both common headers to be safe based on docs
      },
      body: JSON.stringify({
        payload: {
          image: base64Image
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slip2Go verification failed:", errorText);
      return { success: false, error: "Verification API failed" };
    }

    const result = await response.json();
    
    // Assuming Slip2Go returns { status: 'success', data: { amount, ... } }
    if (result.status === 'success' || result.data) {
      return {
        success: true,
        data: {
          amount: parseFloat(result.data.amount),
          sender: {
            name: result.data.sender?.name || result.data.senderName,
          },
          receiver: {
            name: result.data.receiver?.name || result.data.receiverName,
          },
          transRef: result.data.transRef,
          transDate: result.data.transDate || result.data.transTime,
        }
      };
    } else {
      return { success: false, error: result.message || "Invalid slip" };
    }
  } catch (error) {
    console.error("Slip2Go API error:", error);
    return { success: false, error: "Internal Server Error during verification" };
  }
}
