import clientPromise from "../../../lib/mongodb";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(req) {
  try {
    let { userId, notionPageId } = await req.json();

    // Fallbacks
    if (!userId) userId = "u1";
    if (!notionPageId) {
      return new Response(JSON.stringify({ ok: false, message: "Falta notionPageId" }), { status: 400 });
    }

    const finalPageId = notionPageId.replace(/-/g, "").trim();

    const client = await clientPromise;
    const db = client.db("timer");

    // 1. Buscar timer activo
    const activeEntry = await db.collection("timeEntries").findOne({
      taskId: finalPageId,
      userId,
      endTime: null,
    });

    if (!activeEntry) {
      return new Response(JSON.stringify({ ok: false, message: "No hay timer activo" }), { status: 400 });
    }

    // 2. Calcular duración
    const endTime = new Date();
    const durationMs = endTime - activeEntry.startTime;
    const durationHours = durationMs / (1000 * 60 * 60);

    // 3. Cerrar la entrada
    await db.collection("timeEntries").updateOne({ _id: activeEntry._id }, { $set: { endTime, durationHours } });

    // 4. Actualizar acumulado en `tasks`
    await db.collection("tasks").updateOne({ _id: finalPageId }, { $inc: { totalHours: durationHours } }, { upsert: true });

    const taskDoc = await db.collection("tasks").findOne({ _id: finalPageId });
    const totalHours = taskDoc?.totalHours || durationHours;

    // 5. Actualizar en Notion
    try {
      await notion.pages.update({
        page_id: finalPageId,
        properties: {
          Estado: { status: { name: "En progreso" } },
          "Horas acumuladas": { number: totalHours },
        },
      });
    } catch (err) {
      console.error("Error actualizando Notion:", err.body || err.message);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        durationHours,
        total: totalHours,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en /api/stop:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}
