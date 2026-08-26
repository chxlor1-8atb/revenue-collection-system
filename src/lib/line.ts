export const LINE_API_URL = "https://api.line.me/v2/bot/message/reply";
export const LINE_PUSH_API_URL = "https://api.line.me/v2/bot/message/push";
export const LINE_CONTENT_API_URL = "https://api-data.line.me/v2/bot/message";

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err: any) {
      lastError = err;
      const isNetworkError = err?.code === 'ECONNRESET' || 
                             err?.code === 'ETIMEDOUT' || 
                             err?.cause?.code === 'ECONNRESET' || 
                             err?.cause?.code === 'ETIMEDOUT' || 
                             err?.name === 'AbortError' ||
                             err?.message?.includes('fetch failed');
      
      if (attempt < maxRetries && isNetworkError) {
        console.warn(`[LINE Network Retry] ${url} failed with ${err?.message || err}. Retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function replyMessage(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

  try {
    const response = await fetchWithRetry(LINE_API_URL, {
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
      return false;
    }
    return true;
  } catch (error: any) {
    console.error("[LINE API Network Error] replyMessage failed:", error?.message || error);
    return false;
  }
}

export async function pushMessage(userId: string, messages: any[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

  try {
    const response = await fetchWithRetry(LINE_PUSH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LINE API Error] pushMessage failed: ${response.status} ${response.statusText}`, errorText);
      return false;
    }
    return true;
  } catch (error: any) {
    console.error("[LINE API Network Error] pushMessage failed:", error?.message || error);
    return false;
  }
}

export async function replyWithMessages(replyToken: string, messages: any[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

  try {
    const response = await fetchWithRetry(LINE_API_URL, {
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
      return false;
    }
    return true;
  } catch (error: any) {
    console.error("[LINE API Network Error] replyWithMessages failed:", error?.message || error);
    return false;
  }
}

// Smart replier: Tries to reply with token. If token is invalid (e.g. consumed by Slip2Go), 
// it falls back to pushing ONLY the text messages, avoiding double flex cards.
export async function safeReplyOrPush(userId: string, replyToken: string, messages: any[]) {
  const replied = await replyWithMessages(replyToken, messages);
  if (!replied) {
    console.log("[Webhook] Reply token invalid/consumed. Falling back to pushMessage for texts only.");
    // Extract only text messages to prevent sending duplicate Flex cards that Slip2Go already sent
    const textMessages = messages.filter(m => m.type === "text");
    if (textMessages.length > 0) {
      await pushMessage(userId, textMessages);
    }
  }
}

export async function getMessageContent(messageId: string): Promise<Buffer | null> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return null;
  }

  try {
    // Encode messageId because it may contain +, =, / characters
    const safeId = encodeURIComponent(messageId);
    console.log('Fetching image content – messageId:', messageId);

    const response = await fetchWithRetry(`${LINE_CONTENT_API_URL}/${safeId}/content`, {
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
  } catch (error: any) {
    console.error("[LINE API Network Error] getMessageContent failed:", error?.message || error);
    return null;
  }
}

// --- Flex Message Templates ---

export function generateBillFlexMessage(
  houseNumber: string, 
  monthYearStr: string, 
  amount: number, 
  payUrl: string,
  qrUrl: string
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
        backgroundColor: "#059669",
        paddingAll: "12px",
        contents: [
          {
            type: "text",
            text: "ชำระค่าขยะ",
            weight: "bold",
            color: "#ffffff",
            size: "md",
            align: "center"
          }
        ]
      },
      hero: {
        type: "image",
        url: qrUrl,
        size: "full",
        aspectRatio: "1:1",
        aspectMode: "fit",
        backgroundColor: "#ffffff"
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "บ้านเลขที่",
                color: "#64748B",
                size: "xs",
                flex: 1
              },
              {
                type: "text",
                text: houseNumber,
                color: "#111827",
                size: "sm",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ประจำเดือน",
                color: "#64748B",
                size: "xs",
                flex: 1
              },
              {
                type: "text",
                text: monthYearStr,
                color: "#111827",
                size: "sm",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ]
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "ยอดชำระ",
                color: "#64748B",
                size: "xs",
                gravity: "center"
              },
              {
                type: "text",
                text: `฿${amount.toFixed(2)}`,
                color: "#DC2626",
                size: "lg",
                weight: "bold",
                align: "end"
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        paddingTop: "0px",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "บันทึก / ชำระเงิน",
              uri: payUrl
            },
            style: "primary",
            color: "#059669",
            height: "sm"
          }
        ]
      }
    }
  };
}


export function generateReceiptFlexMessage(
  houseNumber: string, 
  monthYearStr: string, 
  amount: number, 
  receiptUrl: string,
  paidAt?: Date | null,
  slipUrl?: string | null
): any {
  const paidDateStr = paidAt ? new Date(paidAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : "-";
  
  const footerContents: any[] = [];
  
  if (slipUrl && slipUrl.startsWith("http")) {
    footerContents.push({
      type: "button",
      action: {
        type: "uri",
        label: "ดูรูปสลิป",
        uri: slipUrl
      },
      style: "primary",
      color: "#0ea5e9",
      margin: "sm"
    });
  }

  footerContents.push({
    type: "button",
    action: {
      type: "uri",
      label: "ตรวจสอบประวัติบิลทั้งหมด",
      uri: receiptUrl
    },
    style: "secondary",
    margin: "sm"
  });
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
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "เวลาที่ชำระ",
                color: "#888888",
                size: "sm",
                flex: 1
              },
              {
                type: "text",
                text: paidDateStr,
                color: "#111111",
                size: "xs",
                weight: "bold",
                align: "end",
                flex: 2
              }
            ],
            margin: "md"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: footerContents,
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
                text: "ถนน",
                color: "#888888",
                size: "xs",
                margin: "md"
              },
              {
                type: "text",
                text: house.road || "-",
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

export function generateSlipVerificationSuccessFlexMessage(
  amount: number,
  senderName: string,
  senderAccount: string,
  receiverName: string,
  receiverAccount: string,
  transDate: string
): any {
  return {
    type: "flex",
    altText: `ตรวจสอบสลิปสำเร็จ ยอดเงิน ${amount} บาท`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สลิปถูกต้อง",
            weight: "bold",
            color: "#ffffff",
            size: "xl"
          }
        ],
        backgroundColor: "#00b900",
        paddingAll: "15px",
        paddingTop: "19px",
        paddingBottom: "16px"
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
                text: amount.toFixed(2),
                size: "3xl",
                weight: "bold",
                color: "#0ea5e9",
                flex: 0
              },
              {
                type: "text",
                text: "บาท",
                size: "sm",
                color: "#888888",
                gravity: "bottom",
                margin: "md",
                flex: 1
              }
            ],
            alignItems: "flex-end"
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "xxl",
            contents: [
              {
                type: "text",
                text: "จาก",
                color: "#aaaaaa",
                size: "sm",
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                flex: 4,
                contents: [
                  {
                    type: "text",
                    text: senderName || "-",
                    color: "#0ea5e9",
                    size: "sm",
                    wrap: true
                  },
                  {
                    type: "text",
                    text: senderAccount || "-",
                    color: "#666666",
                    size: "xs"
                  }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "ไปยัง",
                color: "#aaaaaa",
                size: "sm",
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                flex: 4,
                contents: [
                  {
                    type: "text",
                    text: receiverName || "-",
                    color: "#00b900",
                    size: "sm",
                    wrap: true
                  },
                  {
                    type: "text",
                    text: receiverAccount || "-",
                    color: "#00b900",
                    size: "xs"
                  }
                ]
              }
            ]
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xxl",
            contents: [
              {
                type: "text",
                text: "วันเวลาตามสลิป",
                color: "#aaaaaa",
                size: "xs"
              },
              {
                type: "text",
                text: transDate || "-",
                color: "#0ea5e9",
                size: "sm",
                weight: "bold",
                margin: "sm"
              }
            ]
          },
          {
            type: "separator",
            margin: "xxl"
          }
        ],
        paddingAll: "20px"
      }
    }
  };
}

export function generateSlipErrorFlexMessage(
  title: string,
  subtitle: string,
  color: string,
  amount?: number,
  senderName?: string,
  senderAccount?: string,
  receiverName?: string,
  receiverAccount?: string,
  transDate?: string
): any {
  
  const formattedDate = transDate ? transDate : "-";
  
  const bodyContents: any[] = [];
  
  if (amount !== undefined) {
    bodyContents.push(
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: amount.toFixed(2),
            size: "3xl",
                weight: "bold",
                color: "#0ea5e9",
                flex: 0
          },
          {
            type: "text",
            text: "บาท",
            size: "sm",
            color: "#888888",
            gravity: "bottom",
            margin: "md",
            flex: 1
          }
        ],
        alignItems: "flex-end"
      },
      {
        type: "separator",
        margin: "xxl"
      },
      {
        type: "box",
        layout: "horizontal",
        margin: "xxl",
        contents: [
          {
            type: "text",
            text: "จาก",
            color: "#aaaaaa",
            size: "sm",
            flex: 1
          },
          {
            type: "box",
            layout: "vertical",
            flex: 4,
            contents: [
              {
                type: "text",
                text: senderName || "-",
                color: "#0ea5e9",
                size: "sm",
                wrap: true
              },
              {
                type: "text",
                text: senderAccount || "-",
                color: "#666666",
                size: "xs"
              }
            ]
          }
        ]
      },
      {
        type: "box",
        layout: "horizontal",
        margin: "lg",
        contents: [
          {
            type: "text",
            text: "ไปยัง",
            color: "#aaaaaa",
            size: "sm",
            flex: 1
          },
          {
            type: "box",
            layout: "vertical",
            flex: 4,
            contents: [
              {
                type: "text",
                text: receiverName || "-",
                color: color, // Highlight receiver name with the error color (e.g. Red/Blue)
                size: "sm",
                wrap: true
              },
              {
                type: "text",
                text: receiverAccount || "-",
                color: color,
                size: "xs"
              }
            ]
          }
        ]
      },
      {
        type: "separator",
        margin: "xxl"
      },
      {
        type: "box",
        layout: "horizontal",
        margin: "xxl",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 2,
            contents: [
              {
                type: "text",
                text: "วันเวลาตามสลิป",
                color: "#aaaaaa",
                size: "xs"
              },
              {
                type: "text",
                text: formattedDate,
                color: "#0ea5e9",
                size: "sm",
                weight: "bold",
                margin: "sm",
                wrap: true
              }
            ]
          }
        ]
      }
    );
  } else {
    // If no data, just show a message
    bodyContents.push({
      type: "text",
      text: "กรุณาลองใหม่อีกครั้ง",
      align: "center",
      color: "#888888",
      size: "md",
      margin: "xxl"
    });
  }

  return {
    type: "flex",
    altText: `${title}: ${subtitle}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            color: "#ffffff",
            size: "xl"
          },
          {
            type: "text",
            text: subtitle,
            color: "#ffffff",
            size: "sm",
            margin: "sm"
          }
        ],
        backgroundColor: color,
        paddingAll: "15px",
        paddingTop: "19px",
        paddingBottom: "16px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 2,
            contents: [
              {
                type: "text",
                text: "ร้าน กองสาธารณสุข สาขา เทศบาลนางรอง",
                color: "#0ea5e9",
                size: "xxs",
                wrap: true
              },
              {
                type: "text",
                text: "วันที่ส่งตรวจ " + new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
                color: "#888888",
                size: "xxs",
                margin: "xs"
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              {
                type: "text",
                text: "Slip2Go",
                color: "#000000",
                size: "sm",
                weight: "bold",
                align: "end"
              },
              {
                type: "text",
                text: "บริการตรวจสอบสลิป",
                color: "#aaaaaa",
                size: "xxs",
                align: "end"
              }
            ]
          }
        ]
      }
    }
  };
}


// --- New Clean Minimal Flex Messages for Menus ---

export function generateHowToUseFlexMessage(appUrl: string): any {
  return {
    type: "flex",
    altText: "วิธีใช้งานระบบ",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "25px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            alignItems: "center",
            contents: [

              {
                type: "text",
                text: "วิธีใช้งาน", weight: "bold", size: "xl", color: "#111111"
              }
            ]
          },
          { type: "separator", margin: "xl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            alignItems: "flex-start",
            contents: [
              { type: "text", text: "1", color: "#f97316", weight: "bold", size: "lg", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                contents: [
                  { type: "text", text: "ผูกบัญชี", weight: "bold", size: "sm", color: "#111111" },
                  { type: "text", text: "พิมพ์บ้านเลขที่ เช่น 124/4", size: "xs", color: "#888888", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            alignItems: "flex-start",
            contents: [
              { type: "text", text: "2", color: "#f97316", weight: "bold", size: "lg", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                contents: [
                  { type: "text", text: "เช็คบิล", weight: "bold", size: "sm", color: "#111111" },
                  { type: "text", text: "กดปุ่ม 'เช็คบิล' ด้านล่าง", size: "xs", color: "#888888", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            alignItems: "flex-start",
            contents: [
              { type: "text", text: "3", color: "#f97316", weight: "bold", size: "lg", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                contents: [
                  { type: "text", text: "ชำระเงิน", weight: "bold", size: "sm", color: "#111111" },
                  { type: "text", text: "ส่งรูปสลิปเข้ามาในแชทนี้", size: "xs", color: "#888888", wrap: true }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "none",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#f97316",
            height: "sm",
            action: { type: "message", label: "ลองเช็คบิลเลย", text: "เช็คบิล" }
          }
        ]
      }
    }
  };
}

export function generateReportProblemFlexMessage(appUrl: string): any {
  return {
    type: "flex",
    altText: "แจ้งปัญหา",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "25px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            alignItems: "center",
            contents: [

              {
                type: "text",
                text: "แจ้งปัญหา", weight: "bold", size: "xl", color: "#111111"
              }
            ]
          },
          { type: "separator", margin: "xl" },
          {
            type: "text",
            text: "พบปัญหาเรื่องขยะแจ้งเราได้ทันที",
            size: "sm",
            weight: "bold",
            color: "#111111",
            margin: "lg",
            wrap: true
          },
          {
            type: "text",
            text: "กรุณาพิมพ์รายละเอียดปัญหา พร้อมระบุ 'หมู่บ้าน/ชุมชน' และแนบรูปถ่ายสถานที่ ส่งเข้ามาในแชทนี้ได้เลยค่ะ",
            size: "xs",
            color: "#666666",
            wrap: true,
            margin: "md"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "none",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#ef4444",
            height: "sm",
            action: { type: "message", label: "รับทราบ", text: "รับทราบการแจ้งปัญหา" }
          }
        ]
      }
    }
  };
}

export function generateContactFlexMessage(appUrl: string): any {
  return {
    type: "flex",
    altText: "ติดต่อเจ้าหน้าที่",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "25px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            alignItems: "center",
            contents: [

              {
                type: "box", layout: "vertical", contents: [{ type: "text", text: "ติดต่อเจ้าหน้าที่", weight: "bold", size: "xl", color: "#111111" },
                  { type: "text", text: "เทศบาลเมืองนางรอง", size: "xs", color: "#888888" }
                ]
              }
            ]
          },
          { type: "separator", margin: "xl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              { type: "text", text: "เบอร์โทร", color: "#888888", size: "sm", flex: 1 },
              { type: "text", text: "044-631-419", color: "#111111", size: "sm", weight: "bold", align: "end", flex: 2 }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "text", text: "เวลาทำการ", color: "#888888", size: "sm", flex: 1 },
              { type: "text", text: "จ.-ศ. (08:30-16:30)", color: "#111111", size: "xs", weight: "bold", align: "end", flex: 2 }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "none",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0ea5e9",
            height: "sm",
            action: { type: "uri", label: "โทรเลย", uri: "tel:044631419" }
          }
        ]
      }
    }
  };
}

export function generateMyInfoFlexMessage(appUrl: string, house: any): any {
  return {
    type: "flex",
    altText: "ข้อมูลบ้านของฉัน",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "25px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            alignItems: "center",
            contents: [

              {
                type: "text",
                text: "ข้อมูลของฉัน", weight: "bold", size: "xl", color: "#111111"
              }
            ]
          },
          { type: "separator", margin: "xl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              { type: "text", text: "บ้านเลขที่", color: "#888888", size: "sm", flex: 1, gravity: "center" },
              { type: "text", text: house.houseNumber, color: "#8b5cf6", size: "xl", weight: "bold", align: "end", flex: 2 }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              { type: "text", text: "เจ้าบ้าน", color: "#888888", size: "sm", flex: 1 },
              { type: "text", text: house.ownerName || "-", color: "#111111", size: "sm", weight: "bold", align: "end", flex: 2 }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "text", text: "โซน", color: "#888888", size: "sm", flex: 1 },
              { type: "text", text: house.zone || "-", color: "#111111", size: "sm", weight: "bold", align: "end", flex: 2 }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "none",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#8b5cf6",
            height: "sm",
            action: { type: "message", label: "เช็คยอดค่าขยะ", text: "เช็คบิล" }
          }
        ]
      }
    }
  };
}




export function generateWelcomeFlexMessage() {
  return {
    type: "flex",
    altText: "ยินดีต้อนรับสู่ระบบจัดเก็บรายได้",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "32px",
        contents: [
          {
            type: "text",
            text: "ยินดีต้อนรับสู่ระบบ",
            weight: "bold",
            size: "xl",
            color: "#111827",
            align: "center"
          },
          {
            type: "text",
            text: "ระบบจัดเก็บรายได้อัตโนมัติ",
            size: "sm",
            color: "#64748B",
            align: "center",
            margin: "md"
          },
          {
            type: "separator",
            margin: "xl",
            color: "#F1F5F9"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            backgroundColor: "#F8FAFC",
            paddingAll: "16px",
            cornerRadius: "8px",
            contents: [
              {
                type: "text",
                text: "📌 วิธีการเริ่มต้นใช้งาน",
                weight: "bold",
                size: "sm",
                color: "#334155"
              },
              {
                type: "text",
                text: "กรุณาพิมพ์ \"บ้านเลขที่\" ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทนี้ เพื่อทำการผูกบัญชีในครั้งแรก",
                size: "xs",
                color: "#64748B",
                wrap: true,
                margin: "md"
              }
            ]
          },
          {
            type: "text",
            text: "คู่มือเมนูด้านล่าง (Rich Menu)",
            weight: "bold",
            color: "#111827",
            margin: "xl",
            size: "sm"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            spacing: "md",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "28px",
                height: "28px",
                cornerRadius: "14px",
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "1", color: "#047857", weight: "bold", size: "xs", align: "center" }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "เช็คบิล", weight: "bold", size: "sm", color: "#334155" },
                  { type: "text", text: "ตรวจสอบยอดค้าง & สแกนจ่าย", size: "xs", color: "#64748B", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            spacing: "md",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "28px",
                height: "28px",
                cornerRadius: "14px",
                backgroundColor: "#DBEAFE",
                alignItems: "center",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "2", color: "#1D4ED8", weight: "bold", size: "xs", align: "center" }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "ใบเสร็จ", weight: "bold", size: "sm", color: "#334155" },
                  { type: "text", text: "ประวัติการชำระเงินย้อนหลัง", size: "xs", color: "#64748B", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            spacing: "md",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "28px",
                height: "28px",
                cornerRadius: "14px",
                backgroundColor: "#EDE9FE",
                alignItems: "center",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "3", color: "#6D28D9", weight: "bold", size: "xs", align: "center" }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "ข้อมูลของฉัน", weight: "bold", size: "sm", color: "#334155" },
                  { type: "text", text: "เช็คข้อมูลบ้านที่ลงทะเบียนไว้", size: "xs", color: "#64748B", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            spacing: "md",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "28px",
                height: "28px",
                cornerRadius: "14px",
                backgroundColor: "#DCFCE7",
                alignItems: "center",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "4", color: "#047857", weight: "bold", size: "xs", align: "center" }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "เปิดแป้นพิมพ์", weight: "bold", size: "sm", color: "#334155" },
                  { type: "text", text: "พิมพ์ข้อความถึงเจ้าหน้าที่", size: "xs", color: "#64748B", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            spacing: "md",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "28px",
                height: "28px",
                cornerRadius: "14px",
                backgroundColor: "#FEF3C7",
                alignItems: "center",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "5", color: "#B45309", weight: "bold", size: "xs", align: "center" }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "วิธีใช้งาน", weight: "bold", size: "sm", color: "#334155" },
                  { type: "text", text: "ดูคู่มือการใช้งานระบบ", size: "xs", color: "#64748B", wrap: true }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            spacing: "md",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "28px",
                height: "28px",
                cornerRadius: "14px",
                backgroundColor: "#ECFEFF",
                alignItems: "center",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "6", color: "#0E7490", weight: "bold", size: "xs", align: "center" }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                justifyContent: "center",
                contents: [
                  { type: "text", text: "ติดต่อเจ้าหน้าที่", weight: "bold", size: "sm", color: "#334155" },
                  { type: "text", text: "แจ้งปัญหาหรือสอบถามข้อมูล", size: "xs", color: "#64748B", wrap: true }
                ]
              }
            ]
          }
        ]
      }
    }
  };
}

export function generateSlipApprovedFlexMessage(houseNumber: string, amount: number, receiptUrl: string) {
  return {
    type: "flex",
    altText: "✅ ชำระเงินสำเร็จ!",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ชำระเงินสำเร็จ",
            weight: "bold",
            color: "#10B981",
            size: "xl"
          },
          {
            type: "text",
            text: "บ้านเลขที่ " + houseNumber,
            size: "sm",
            color: "#64748B",
            margin: "sm"
          }
        ],
        paddingAll: "20px",
        paddingBottom: "10px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ยอดเงิน " + amount.toLocaleString() + " บาท ได้รับการตรวจสอบและยืนยันเรียบร้อยแล้ว ขอบคุณค่ะ",
            wrap: true,
            size: "sm",
            color: "#334155"
          }
        ],
        paddingAll: "20px",
        paddingTop: "10px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "📄 ดาวน์โหลดใบเสร็จ (PDF)",
              uri: receiptUrl
            },
            style: "primary",
            color: "#5B58F2"
          }
        ],
        paddingAll: "20px"
      }
    }
  };
}

export function generateSlipRejectedFlexMessage(houseNumber: string, amount: number, rejectReason: string, uploadUrl: string) {
  return {
    type: "flex",
    altText: "❌ สลิปถูกปฏิเสธ",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สลิปไม่ผ่านการตรวจสอบ",
            weight: "bold",
            color: "#EF4444",
            size: "lg"
          },
          {
            type: "text",
            text: "บ้านเลขที่ " + houseNumber,
            size: "sm",
            color: "#64748B",
            margin: "sm"
          }
        ],
        paddingAll: "20px",
        paddingBottom: "10px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สลิปยอด " + amount.toLocaleString() + " บาท ถูกปฏิเสธเนื่องจาก:",
            wrap: true,
            size: "sm",
            color: "#334155",
            margin: "md"
          },
          {
            type: "text",
            text: rejectReason,
            wrap: true,
            size: "md",
            weight: "bold",
            color: "#B91C1C",
            margin: "sm"
          }
        ],
        paddingAll: "20px",
        paddingTop: "0px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "📤 อัปโหลดสลิปใหม่",
              uri: uploadUrl
            },
            style: "primary",
            color: "#EF4444"
          }
        ],
        paddingAll: "20px"
      }
    }
  };
}
