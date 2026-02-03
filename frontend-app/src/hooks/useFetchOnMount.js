/**
 * Hook that automatically fetches data on mount
 * @param {string} url - The API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {{data: any, loading: boolean, error: string|null, refetch: () => Promise<void>}}
 *
 * @example
 * // Basic usage - auto-fetch on mount
 * function AgentsList() {
 *   const { data: agents, loading, error } = useOnMountApi("/api/conversational/agents");
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <ul>{agents.map(agent => <li key={agent.id}>{agent.name}</li>)}</ul>;
 * }
 *
 * @example
 * // With POST method and body
 * function SearchResults() {
 *   const { data, loading, error } = useOnMountApi("/api/search", {
 *     method: "POST",
 *     body: { query: "react hooks" }
 *   });
 *
 *   return <div>{data?.results}</div>;
 * }
 *
 * @example
 * // Using refetch to reload data
 * function ProductList() {
 *   const { data: products, loading, error, refetch } = useOnMountApi("/api/products");
 *
 *   const handleRefresh = () => {
 *     refetch(); // Manually reload the data
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleRefresh} disabled={loading}>
 *         Refresh
 *       </button>
 *       {products?.map(p => <div key={p.id}>{p.name}</div>)}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Refetch after a mutation
 * function UserProfile() {
 *   const { data: user, refetch } = useOnMountApi("/api/user/profile");
 *   const { request } = useApi();
 *
 *   const handleUpdate = async (newData) => {
 *     const result = await request("/api/user/profile", {
 *       method: "PUT",
 *       body: newData
 *     });
 *
 *     if (result.success) {
 *       await refetch(); // Reload the profile data
 *     }
 *   };
 *
 *   return <div>{user?.name}</div>;
 * }
 *
 */

import { useState, useEffect, useCallback, useRef } from "react";
import useApi from "./useApi";

/** @param {string} url
 * @param {RequestInit} options
 * */
export default function useFetchOnMount(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { request, loading } = useApi();

  // Store options in a ref to avoid dependency issues
  const optionsRef = useRef(options);

  // Update ref if options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const fetchData = useCallback(async () => {
    const result = await request(url, optionsRef.current);
    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [url, request]); // Only depend on url and request

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
