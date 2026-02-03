import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {RefreshCw} from "lucide-react";

function ErrorReload({ error, onReload }) {
  return (
    <div className="flex flex-col">
      <Alert className="" variant="default | destructive">
        <RefreshCw className="cursor-pointer hover:text-gray-500 transition" onClick={onReload}/>
        <AlertTitle className= "">Something went wrong...</AlertTitle>
        <AlertDescription className= ""> {error}. Reload?</AlertDescription>
      </Alert>
    </div>
  );
}

export default ErrorReload;
