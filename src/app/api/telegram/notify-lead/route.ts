import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const { name, interest, phone, source } = await req.json();

    const text = `📩 Nuevo interesado: ${name}
🏍️ Moto: ${interest || 'N/A'}
📱 Tel: ${phone || 'N/A'}
📍 Origen: ${source || 'N/A'}
[Click para llamar](tel:${phone})`;

    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
    if (chatId) {
        await sendMessage(chatId, text);
    } else {
        console.error("TELEGRAM_GROUP_CHAT_ID not set");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in notify-lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
