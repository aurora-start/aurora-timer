import clientPromise from "../../../lib/mongodb";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(req) {
  try {
    const { taskId, userId, notionPageId } = await req.json();

    // Normalizamos el pageId (Notion no admite guiones en UUID)
    const pageId = notionPageId.replace(/-/g, "");

    const client = await clientPromise;
    const db = client.db("timer");

    // 1. Buscar timer activo
    const activeEntry = await db.collection("timeEntries").findOne({
      taskId,
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
    await db.collection("tasks").updateOne({ _id: taskId }, { $inc: { totalHours: durationHours } }, { upsert: true });

    // 5. Obtener el acumulado actualizado
    const taskDoc = await db.collection("tasks").findOne({ _id: taskId });
    const totalHours = taskDoc.totalHours || durationHours;

    // 6. Actualizar en Notion con el acumulado real
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Estado: { status: { name: "Listo" } },
        "Horas acumuladas": { number: totalHours },
      },
    });

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
