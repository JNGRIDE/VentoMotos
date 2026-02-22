import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const { salesperson, model, commission, amount } = await req.json();

    const text = `🚀 ¡Venta Cerrada!
👤 Vendedor: ${salesperson}
🏍️ Moto: ${model}
💰 Comisión: $${commission}`;

    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
    if (chatId) {
        await sendMessage(chatId, text);
    } else {
        console.error("TELEGRAM_GROUP_CHAT_ID not set");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in notify-sale:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
