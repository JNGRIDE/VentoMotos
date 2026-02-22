import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendMessage, TelegramUpdate } from "@/lib/telegram";
import { getCurrentSprintValue } from "@/lib/sprints";
import { COMMISSION_RATES } from "@/lib/constants";

// Helper to sanitize strings
function clean(str: string) {
    return str.toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const userId = update.message.from?.id;
    const firstName = update.message.from?.first_name || "Unknown";

    // Command Parsing
    const args = text.split(" ");
    const command = args[0].toLowerCase();
    // Reconstruct query preserving spaces
    const query = args.slice(1).join(" ");

    const db = getAdminDb();

    if (command === "/stock") {
        if (!query) {
            await sendMessage(chatId, "⚠️ Por favor especifica el modelo. Ejemplo: /stock rocketman");
            return NextResponse.json({ ok: true });
        }

        const inventorySnap = await db.collection("inventory").get();
        const matches: { model: string, stock: number }[] = [];

        inventorySnap.forEach(doc => {
            const data = doc.data();
            // Simple partial match
            if (data.model && clean(data.model).includes(clean(query))) {
                matches.push({ model: data.model, stock: data.stock || 0 });
            }
        });

        if (matches.length === 0) {
            await sendMessage(chatId, `❌ No encontré inventario para "${query}".`);
        } else {
            const response = matches.map(m => `📍 ${m.model}: ${m.stock} unidades.`).join("\n");
            await sendMessage(chatId, response);
        }
    }
    else if (command === "/misventas") {
        if (!userId) {
             await sendMessage(chatId, "❌ Error: No puedo identificar tu usuario de Telegram.");
             return NextResponse.json({ ok: true });
        }

        const usersRef = db.collection("users");

        // 1. Check if already linked
        let userSnap = await usersRef.where("telegramId", "==", userId).limit(1).get();
        let userDoc: any = null;
        let userData: any = null;

        if (userSnap.empty) {
            // 2. Try to link by name
            // Fetch all users to do client-side fuzzy match (efficient enough for <100 users)
            const allUsersSnap = await usersRef.get();

            allUsersSnap.forEach(doc => {
                const data = doc.data();
                if (!data.name) return;

                // Check if stored name contains Telegram first name OR vice versa
                // e.g. Stored: "Noel Vento", Telegram: "Noel" -> Match
                if (clean(data.name).includes(clean(firstName)) || clean(firstName).includes(clean(data.name))) {
                    if (!userDoc) { // Pick first match
                        userDoc = doc;
                        userData = data;
                    }
                }
            });

            if (userDoc) {
                // Link them!
                await userDoc.ref.update({ telegramId: userId });
                await sendMessage(chatId, `🔗 ¡Hola ${userData.name}! He vinculado tu cuenta de Telegram exitosamente.`);
            } else {
                 await sendMessage(chatId, `❌ No encontré un usuario con el nombre "${firstName}". Por favor pide a tu gerente que actualice tu perfil.`);
                 return NextResponse.json({ ok: true });
            }
        } else {
            userDoc = userSnap.docs[0];
            userData = userDoc.data();
        }

        // 3. Calculate Stats
        const sprint = getCurrentSprintValue();
        const salesSnap = await db.collection("sales")
            .where("salespersonId", "==", userDoc.id)
            .where("sprint", "==", sprint)
            .get();

        let totalSales = 0;
        let totalAmount = 0;

        salesSnap.forEach(doc => {
            const sale = doc.data();
            totalSales++;
            totalAmount += (sale.amount || 0);
        });

        const isManager = userData.role === 'Manager';
        const rate = isManager ? COMMISSION_RATES.MANAGER : COMMISSION_RATES.SALESPERSON;
        const commission = totalAmount * rate;

        // Goals logic
        const salesGoal = userData.salesGoal || 0;
        const remaining = Math.max(0, salesGoal - totalAmount);

        let msg = `${userData.name}, hoy llevas ${totalSales} motos vendidas en este sprint.\n`;
        msg += `💰 Tu comisión acumulada del mes es de $${commission.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}.\n`;

        if (remaining > 0) {
            msg += `¡Faltan $${remaining.toLocaleString()} para tu meta! 💪`;
        } else {
            msg += `¡Felicidades! Has superado tu meta. 🚀`;
        }

        await sendMessage(chatId, msg);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
