import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ErrorReload from "./ErrorReload";
import useFetchOnMount from "../hooks/useFetchOnMount";
import {useState} from "react";

/** @typedef {RequestInit} Options */

/** @param {{url: string, onChange: function(string): void, name: string, defaultSelection?: string, disabled?: boolean, requestOptions?: Object}} props */
function FetchSelect({ url, onChange, name, disabled, defaultSelection = null, requestOptions = {} }) {

   const key = url.includes("agents") ? "agentId" : "voiceId";
  // Custom hook to fetch data on component mount. uses useApi internally.
  const { data, error, loading, refetch } = useFetchOnMount(url, requestOptions);
   const [selectedValue, setSelectedValue] = useState(defaultSelection);

  /** @type {function(string): void} */
  const handleValueChange = (value) => {
     setSelectedValue(value);
    if (onChange) onChange(value);
  };


  const renderOptions = () => {
    return data?.map((/** @type{Object}*/ data) => {
      return (
        <SelectItem key={data[key]} value={data[key]} className="">
          {data.name}
        </SelectItem>
      );
    });
  };

  if (error) return <ErrorReload error={error} onReload={async () => await refetch()} />;

  return (
    <>
      <Select onValueChange={handleValueChange} disabled={disabled || loading || error} value={selectedValue}>
        <SelectTrigger className="h-4 min-w-full">
          <SelectValue placeholder={loading ? "Loading..." : `Select ${name}`} />
        </SelectTrigger>
        <SelectContent className="">{!loading && renderOptions()}</SelectContent>
      </Select>
    </>
  );
}

export default FetchSelect;
