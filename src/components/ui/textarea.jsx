import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[#2a2a2a] placeholder:text-gray-500 focus-visible:border-purple-500 focus-visible:ring-purple-500/50 aria-invalid:ring-red-500/20 aria-invalid:border-red-500 bg-[#0f0f0f] flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base text-white shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props} />
  );
}

export { Textarea }
