import {cors} from "#lib/cors.js";
import {tryCatch} from  "#lib/tryCatch.js";

const TEST_DATA= { name: "Test", message: "This is a test message." };

export default tryCatch(async (req, res) => {
   if(cors(req, res)) return;

   res.status(200).json({message: "Text-to-Speech service is running.", data:  TEST_DATA });
})
