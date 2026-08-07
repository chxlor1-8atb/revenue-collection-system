export async function sendSlipNotification(chatId: string, imageUrl: string, amount?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Skipping Telegram notification.");
    return false;
  }

  if (!chatId) {
    console.warn("No chatId provided for collector. Skipping Telegram notification.");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  
  const caption = amount 
    ? `💰 มีผู้ชำระเงินเข้ามาใหม่!\nยอดเงินที่แจ้ง: ${amount} บาท\nสถานะ: รอดำเนินการตรวจสอบ` 
    : `🧾 มีผู้แนบสลิปเข้ามาใหม่!\nสถานะ: รอดำเนินการตรวจสอบ`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: imageUrl,
        caption: caption,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Failed to send Telegram notification:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}
