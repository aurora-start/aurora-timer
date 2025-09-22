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

    // Normalizar pageId (sin guiones)
    const finalPageId = notionPageId.replace(/-/g, "").trim();

    const client = await clientPromise;
    const db = client.db("timer");
    const timeEntries = db.collection("timeEntries");

    // Verificar si ya hay un timer activo
    const active = await timeEntries.findOne({
      taskId: finalPageId,
      userId,
      endTime: null,
    });

    if (active) {
      return new Response(JSON.stringify({ ok: false, message: "Ya hay un timer activo" }), { status: 200 });
    }

    // Insertar nueva entrada
    const startTime = new Date();
    const { insertedId } = await timeEntries.insertOne({
      taskId: finalPageId,
      userId,
      startTime,
      endTime: null,
    });

    // Actualizar Notion → Estado = "En progreso"
    try {
      await notion.pages.update({
        page_id: finalPageId,
        properties: {
          Estado: { status: { name: "En progreso" } },
        },
      });
    } catch (err) {
      console.error("Aviso: fallo actualizando Notion en /start:", err.body || err);
    }

    return new Response(JSON.stringify({ ok: true, entryId: insertedId }), { status: 200 });
  } catch (err) {
    console.error("Error en /api/start:", err);
    return new Response(JSON.stringify({ ok: false, message: "Error interno" }), { status: 500 });
  }
}
