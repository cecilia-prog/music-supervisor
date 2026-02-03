import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import { Field, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea";

import { formatCamelCase } from "#lib/utils.js";
import { useState } from "react";

export default function AgentOptionsPopover({ options, title, onSave }) {
  const [opts, setOpts] = useState(options);

  const [open, setOpen] = useState(false);

  /** @param {string} key
   * @param {import('react').ChangeEvent<HTMLInputElement>} event
   */
  const onInput = (key, event) => {
    const value = event.target.value;

    setOpts((prev) => ({
      ...prev,
      [key]: value || "",
    }));
  };

  const handleSave = () => {
    onSave(opts);
    setOpen(false);
  };

  const renderContent = () => {
    return Object.entries(opts).map(([key, value]) => {
      if (key === "language")
        return (
          <div key={key}>
            <div className="font-normal text-xs text-gray-600 mb-2"> {formatCamelCase(key)}</div>
            <div className="text-gray-900 py-0.5 px-1 bg-gray-200  font-normal text-sm rounded-md w-8 text-center">
              {" "}
              <span>{value} </span>
            </div>
          </div>
        );
      return (
        <Field key={key} className="gap-2">
          <FieldLabel className="font-normal text-xs text-gray-600" htmlFor={key}>
            {formatCamelCase(key)}
          </FieldLabel>
          {key === "temperature" && (
            <Input
              type="number"
              max={1}
              min={0}
              step={0.1}
              onInput={(e) => onInput(key, e)}
              value={value}
              className=""
              id={key}
              autoComplete="off"
              placeholder=""
            />
          )}
          {key === "prompt" && (
            <Textarea
              onInput={(e) => onInput(key, e)}
              value={value}
              className=""
              id={key}
              autoComplete="off"
              placeholder=""
              rows={4}
            />
          )}
          {key !== "temperature" && key !== "prompt" && (
            <Input
              type="text"
              onInput={(e) => onInput(key, e)}
              value={value}
              className=""
              id={key}
              autoComplete="off"
              placeholder=""
            />
          )}
        </Field>
      );
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-neutral-600 font-normal" size="default">
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 m-w-[550px]" align="start">
        <FieldSet className="gap-3">
          <FieldLegend className="font-bold">{title} Options</FieldLegend>
          <FieldSeparator className="" />
          {renderContent()}
        </FieldSet>
        <div className="flex justify-end mt-4">
          <Button size="sm" variant="default" className="" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
