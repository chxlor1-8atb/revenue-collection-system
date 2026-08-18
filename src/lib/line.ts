export const LINE_API_URL = "https://api.line.me/v2/bot/message/reply";
export const LINE_CONTENT_API_URL = "https://api-data.line.me/v2/bot/message";

export async function replyMessage(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const response = await fetch(LINE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: text,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LINE API Error] replyMessage failed: ${response.status} ${response.statusText}`, errorText);
  }
}

export async function replyWithMessages(replyToken: string, messages: any[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const response = await fetch(LINE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: messages,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LINE API Error] replyWithMessages failed: ${response.status} ${response.statusText}`, errorText);
  }
}

export async function getMessageContent(messageId: string): Promise<Buffer | null> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return null;
  }

  // Encode messageId because it may contain +, =, / characters
  const safeId = encodeURIComponent(messageId);
  console.log('Fetching image content – messageId:', messageId);

  const response = await fetch(`${LINE_CONTENT_API_URL}/${safeId}/content`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Failed to fetch image from LINE – status ${response.status}: ${response.statusText}\nResponse body: ${errText}\nMessage ID used: ${messageId} (encoded: ${safeId})`);
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export const LINE_PUSH_API_URL = "https://api.line.me/v2/bot/message/push";

export async function pushMessage(to: string, messages: any[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  await fetch(LINE_PUSH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: to,
      messages: messages,
    }),
  });
}

// --- Flex Message Templates ---

export function generateBillFlexMessage(
  houseNumber: string, 
  monthYearStr: string, 
  amount: number, 
  payUrl: string
): any {
  return {
    type: "flex",
    altText: `บิลค่าขยะประจำเดือน ${monthYearStr} ของบ้านเลขที่ ${houseNumber}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "บิลแจ้งหนี้ค่าขยะ",
            weight: "bold",
            size: "xl",
            color: "#ffffff"
          },
          {
            type: "text",
            text: "กองสาธารณสุขและสิ่งแวดล้อม",
            color: "#ffffffcc",
            size: "xs"
          }
        ],
        backgroundColor: "#059669",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "บ้านเลขที่",
                color: "#888888",
                size: "sm",
                flex: 1
              },
              {
                type: "text",
                text: houseNumber,
                color: "#111111",
                size: "sm",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ประจำเดือน",
                color: "#888888",
                size: "sm",
                flex: 1
              },
              {
                type: "text",
                text: monthYearStr,
                color: "#111111",
                size: "sm",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ],
            margin: "md"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ยอดที่ต้องชำระ",
                color: "#888888",
                size: "sm",
                gravity: "center"
              },
              {
                type: "text",
                text: `฿${amount.toFixed(2)}`,
                color: "#dc2626",
                size: "xl",
                weight: "bold",
                align: "end"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "คลิกเพื่อชำระเงิน",
              uri: payUrl
            },
            style: "primary",
            color: "#059669",
            margin: "sm"
          }
        ],
        paddingAll: "20px"
      }
    }
  };
}

export function generateReceiptFlexMessage(
  houseNumber: string, 
  monthYearStr: string, 
  amount: number, 
  receiptUrl: string
): any {
  return {
    type: "flex",
    altText: `ใบเสร็จรับเงินค่าขยะประจำเดือน ${monthYearStr} ของบ้านเลขที่ ${houseNumber}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "รับชำระเงินเรียบร้อย",
            weight: "bold",
            size: "xl",
            color: "#ffffff"
          },
          {
            type: "text",
            text: "ขอบคุณที่ชำระค่าธรรมเนียม",
            color: "#ffffffcc",
            size: "xs"
          }
        ],
        backgroundColor: "#0ea5e9",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "บ้านเลขที่",
                color: "#888888",
                size: "sm",
                flex: 1
              },
              {
                type: "text",
                text: houseNumber,
                color: "#111111",
                size: "sm",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ประจำเดือน",
                color: "#888888",
                size: "sm",
                flex: 1
              },
              {
                type: "text",
                text: monthYearStr,
                color: "#111111",
                size: "sm",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ],
            margin: "md"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ยอดเงิน",
                color: "#888888",
                size: "sm",
                gravity: "center"
              },
              {
                type: "text",
                text: `฿${amount.toFixed(2)}`,
                color: "#0ea5e9",
                size: "xl",
                weight: "bold",
                align: "end"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "ตรวจสอบประวัติบิลทั้งหมด",
              uri: receiptUrl
            },
            style: "secondary",
            margin: "sm"
          }
        ],
        paddingAll: "20px"
      }
    }
  };
}

export function generateDuplicateHouseSelectionFlexMessage(
  houses: any[],
  slipId?: number
): any {
  return {
    type: "flex",
    altText: `พบบ้านเลขที่ซ้ำกัน กรุณาเลือกบ้านของคุณ`,
    contents: {
      type: "carousel",
      contents: houses.map(house => {
        let actionData = `action=bindHouse&houseId=${house.id}`;
        if (slipId) {
          actionData += `&slipId=${slipId}`;
        }
        
        return {
          type: "bubble",
          size: "micro",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: house.houseNumber,
                weight: "bold",
                size: "xl",
                color: "#ffffff"
              }
            ],
            backgroundColor: "#f59e0b",
            paddingAll: "15px"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ชื่อเจ้าบ้าน",
                color: "#888888",
                size: "xs"
              },
              {
                type: "text",
                text: house.ownerName || "ไม่ระบุ",
                weight: "bold",
                size: "sm",
                wrap: true
              },
              {
                type: "text",
                text: "ชุมชน/โซน",
                color: "#888888",
                size: "xs",
                margin: "md"
              },
              {
                type: "text",
                text: house.zone || "ไม่ระบุ",
                weight: "bold",
                size: "sm",
                wrap: true
              }
            ],
            paddingAll: "15px"
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "postback",
                  label: "เลือกบ้านนี้",
                  data: actionData,
                  displayText: `เลือกบ้าน ${house.houseNumber} (${house.ownerName || 'ไม่ระบุ'})`
                },
                style: "primary",
                color: "#f59e0b"
              }
            ],
            paddingAll: "15px"
          }
        };
      })
    }
  };
}
