import { cors } from "#lib/cors.js";
import { tryCatch } from "#lib/tryCatch.js";
import { ElevenLabs } from "#lib/elevenLabs.js";
import keys from "#lib/keys.js";

/**
 * @param {import('#lib/types.js').VercelHandler} handlerFn
 * @returns {import('#lib/types.js').VercelHandler}
 */
export default tryCatch(async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== "GET") res.status(405).json({ message: "Method not allowed", data: null });

  const elevenLabs = new ElevenLabs(keys.get("elevenLabs"));
  const data = await elevenLabs.agents();

  if (!data || !data.agents) return res.status(404).json({ message: "No agents found", data: null });

  res.status(200).json({ message: "Success", data: data.agents });
});
