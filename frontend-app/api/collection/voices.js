import { cors } from "#lib/cors.js";
import { tryCatch } from "#lib/tryCatch.js";
import { bodyParser } from "#lib/bodyParser.js";
import { ElevenLabs } from "#lib/elevenLabs.js";
import logger from "#lib/logger.js";
import keys from "#lib/keys.js";

/**
 * @param {import('#lib/types.js').VercelHandler} handlerFn
 * @returns {import('#lib/types.js').VercelHandler}
 */
export default tryCatch(async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed", data: null });

   const body = await bodyParser(req);

   if(!body || !body.collectionId) {
      logger.error(req, "Bad request: missing collectionId");
      res.status(400).json({message: "Bad request: missing collectionId", data: null });
      return;
   }

  const apiKey = keys.get("elevenLabs");
  if (!apiKey) {
    logger.error(req, "ELEVEN_LABS_KEY environment variable not set");
    return res.status(500).json({ message: "Server configuration error", data: null });
  }

  logger.info(req, `Fetching voices for collection ID: ${body.collectionId}`);
  const elevenLabs = new ElevenLabs(apiKey);
  const data = await elevenLabs.collectionVoices(body.collectionId);

  logger.info(req, `ElevenLabs response: ${JSON.stringify({ totalCount: data?.totalCount, voicesCount: data?.voices?.length })}`);

  if (!data || !data.voices) {
    logger.error(req, "No voices found in ElevenLabs response");
    return res.status(404).json({ message: "No voices found", data: null });
  }
  
  if(data.totalCount === 0) {
    logger.warn(req, `No voices found for collection ID: ${body.collectionId}`);
  }

  logger.info(req, `Returning ${data.voices.length} voices`);
  res.status(200).json({ message: "Success", data: data.voices });
});
