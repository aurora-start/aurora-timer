import clientPromise from "../../../lib/mongodb";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

function normalizePageId(id) {
  return id.replace(/-/g, "").trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Body recibido:", body);

    const { taskId, userId, notionPageId } = body;
    const finalPageId = normalizePageId(notionPageId);
    console.log("FINAL PageId que se manda a Notion:", finalPageId, "Longitud:", finalPageId.length);

    const client = await clientPromise;
    const db = client.db("timer");
    const timeEntries = db.collection("timeEntries");

    // verificar si ya hay un timer activo para esa tarea y usuario
    const active = await timeEntries.findOne({ taskId, userId, endTime: null });
    if (active) {
      return new Response(JSON.stringify({ ok: false, message: "Ya hay un timer activo" }), { status: 200 });
    }

    const startTime = new Date();
    const { insertedId } = await timeEntries.insertOne({
      taskId,
      userId,
      startTime,
      endTime: null,
    });

    // actualizar Notion → Estado = "En progreso"
    if (finalPageId) {
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
    }

    return new Response(JSON.stringify({ ok: true, entryId: insertedId }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, message: "Error interno" }), { status: 500 });
  }
}
