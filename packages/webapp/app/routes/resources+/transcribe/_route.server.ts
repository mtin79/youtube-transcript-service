import { transcribeVideo } from "@youtube-transcript/core";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();

  const url = formData.get("url") as string;
  if (!url) {
    return Response.json({ error: "YouTube URL is required" }, { status: 400 });
  }

  const lang = (formData.get("lang") as string) || "en";
  const model = (formData.get("model") as string) || "gemini-3-flash-preview";
  const timestamps = formData.get("timestamps") !== "false";
  const speakers = formData.get("speakers") === "true";
  const jsonOutput = formData.get("json") === "true";
  const startOffset = formData.get("startOffset")
    ? Number(formData.get("startOffset"))
    : undefined;
  const endOffset = formData.get("endOffset")
    ? Number(formData.get("endOffset"))
    : undefined;

  try {
    const result = await transcribeVideo(url, {
      lang,
      model,
      timestamps,
      json: jsonOutput,
      speakers,
      startOffset,
      endOffset,
    });

    return Response.json(result);
  } catch (err: any) {
    const status = err.detail?.status || 500;
    return Response.json({ error: err.message }, { status });
  }
}
