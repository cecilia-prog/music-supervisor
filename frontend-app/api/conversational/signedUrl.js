import {cors} from "#lib/cors.js";
import {tryCatch} from  "#lib/tryCatch.js";
import {bodyParser} from "#lib/bodyParser.js";
import keys from "#lib/keys.js";
import {ElevenLabs} from "#lib/elevenLabs.js";

const key = keys.get('elevenLabs');
const elevanLabs = new ElevenLabs(key);

/**
 * @param {import('#lib/types.js').VercelHandler} handlerFn
 * @returns {import('#lib/types.js').VercelHandler}
 */
export default tryCatch(async (req, res) => {
   if(cors(req, res)) return;

   if (req.method !== "POST") {
      res.status(405).json({message: "Method not allowed", data: null });
      return;
   }

   const body = await bodyParser(req);
   
   console.log('[signedUrl API] Received request with body:', body);

   if(!body || !body.agentId) {
      console.error('[signedUrl API] Missing agentId in request body');
      res.status(400).json({message: "Bad request, missing agentId", data: null });
      return;
   }

   console.log('[signedUrl API] Calling ElevenLabs SDK with agentId:', body.agentId);
   const resp = await elevanLabs.signedUrl(body.agentId);
   
   console.log('[signedUrl API] Response from ElevenLabs SDK:', resp);
   console.log('[signedUrl API] Response type:', typeof resp);
   console.log('[signedUrl API] Response keys:', Object.keys(resp));
   
   // The SDK returns ConversationSignedUrlResponseModel which is { signedUrl: string }
   const responseData = { message: "Success", data: resp };
   console.log('[signedUrl API] Sending to client:', responseData);
   
   res.status(200).json(responseData);
})
