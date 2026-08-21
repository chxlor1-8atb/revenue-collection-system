export const LINE_API_URL = "https://api.line.me/v2/bot/message/reply";
export const LINE_PUSH_API_URL = "https://api.line.me/v2/bot/message/push";
export const LINE_CONTENT_API_URL = "https://api-data.line.me/v2/bot/message";

export async function replyMessage(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

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
    return false;
  }
  return true;
}

export async function pushMessage(userId: string, messages: any[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

  const response = await fetch(LINE_PUSH_API_URL, {
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
}

export async function replyWithMessages(replyToken: string, messages: any[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

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
    return false;
  }
  return true;
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
      hero: {
        type: "image",
        url: qrUrl,
        size: "full",
        aspectRatio: "1:1",
        aspectMode: "fit",
        backgroundColor: "#ffffff"
      },
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สแกน QR เพื่อชำระเงิน",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center"
          }
        ],
        backgroundColor: "#059669",
        paddingAll: "15px"
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
                type: "icon",
                url: `${appUrl}/api/icons/book?color=f97316`,
                size: "3xl"
              },
              {
                type: "text",
                text: "วิธีใช้งาน",
                weight: "bold",
                size: "xl",
                color: "#111111",
                marginLeft: "lg"
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
                marginLeft: "md",
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
                marginLeft: "md",
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
                marginLeft: "md",
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
        paddingTop: "0px",
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
                type: "icon",
                url: `${appUrl}/api/icons/alert?color=ef4444`,
                size: "3xl"
              },
              {
                type: "text",
                text: "แจ้งปัญหา",
                weight: "bold",
                size: "xl",
                color: "#111111",
                marginLeft: "lg"
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
        paddingTop: "0px",
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
                type: "icon",
                url: `${appUrl}/api/icons/phone?color=0ea5e9`,
                size: "3xl"
              },
              {
                type: "box",
                layout: "vertical",
                marginLeft: "lg",
                contents: [
                  { type: "text", text: "ติดต่อเจ้าหน้าที่", weight: "bold", size: "xl", color: "#111111" },
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
        paddingTop: "0px",
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
                type: "icon",
                url: `${appUrl}/api/icons/home?color=8b5cf6`,
                size: "3xl"
              },
              {
                type: "text",
                text: "ข้อมูลของฉัน",
                weight: "bold",
                size: "xl",
                color: "#111111",
                marginLeft: "lg"
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
        paddingTop: "0px",
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
