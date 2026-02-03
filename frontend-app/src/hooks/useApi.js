/**
 * @typedef {Object} RequestResult
 * @property {boolean} success - Whether the request was successful
 * @property {any} data - The response data (null if error)
 * @property {string|null} error - Error message (null if success)
 */

/**
 * Custom hook for making API requests with loading state
 * @returns {{request: (url: string, options?: RequestInit) => Promise<RequestResult>, loading: boolean}}
 *
 * @example
 * // GET request - Fetch voice on button click
 * function VoicePreview({ voiceId }) {
 *   const { request, loading } = useApi();
 *   const [voice, setVoice] = useState(null);
 *
 *   const handleGetVoice = async () => {
 *     const result = await request(`/api/voices/${voiceId}`);
 *
 *     if (result.success) {
 *       setVoice(result.data);
 *     } else {
 *       alert(result.error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGetVoice} disabled={loading}>
 *         {loading ? "Loading..." : "Get Voice"}
 *       </button>
 *       {voice && <div>Voice: {voice.name}</div>}
 *     </div>
 *   );
 * }
 *
 * @example
 * // POST request - Request signed URL for file upload
 * function UploadForm() {
 *   const { request, loading } = useApi();
 *   const [fileName, setFileName] = useState("");
 *   const [signedUrl, setSignedUrl] = useState(null);
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *
 *     const result = await request("/api/upload/signed-url", {
 *       method: "POST",
 *       body: { fileName, fileType: "audio/wav" }
 *     });
 *
 *     if (result.success) {
 *       setSignedUrl(result.data.url);
 *       console.log("Signed URL:", result.data.url);
 *     } else {
 *       alert(result.error);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={fileName}
 *         onChange={(e) => setFileName(e.target.value)}
 *         placeholder="Enter file name"
 *       />
 *       <button type="submit" disabled={loading}>
 *         {loading ? "Requesting..." : "Get Signed URL"}
 *       </button>
 *       {signedUrl && <p>Ready to upload!</p>}
 *     </form>
 *   );
 * }
 */

import { useState, useCallback } from "react";

export default function useApi() {
   const [loading, setLoading] = useState(false);

   const requestFn = useCallback(async (/** @type {string} */url, options = {}) => {
      setLoading(true);
      try {
         const resp = await fetch(url, {
            headers: {
               contentType: "application/json",
               ...options.headers,
            },
            ...{
               ...options,
               body: options.body ? JSON.stringify(options.body) : undefined,
            },
         });

         if (!resp.ok)
            return {
               success: false,
               data: null,
               error: await getErrorMessage(resp),
            };

         const data = await resp.json();

         return {
            success: true,
            data: data.data,
            error: null,
         };
      } catch (error) {
         return {
            success: false,
            data: null,
            error: error.message || "Unknown Error.",
         };
      } finally {
         setLoading(false);
      }
   }, []); // Empty deps - function never changes

   return { request: requestFn, loading };
}

/**
 * Extracts error message from HTTP response
 * @param {Response} resp - The fetch Response object
 * @returns {Promise<string>} Error message string
 */
async function getErrorMessage(resp) {
   const errorMessage = `HTTP Error ${resp.status}: ${resp.statusText || "Unknown Error"}`;

   try {
      const errorData = await resp.json();
      const serverMessage = errorData.error || errorData.message;

      if (serverMessage) return `${errorMessage} - ${serverMessage}`;
      return errorMessage;
   } catch {
      return errorMessage;
   }
}
