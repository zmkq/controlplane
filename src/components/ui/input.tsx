import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="relative group">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "flex h-12 w-full min-w-0 rounded-t-lg border-b-2 border-white/10 bg-white/5 px-4 text-base text-foreground placeholder:text-muted-foreground/50 shadow-none transition-all duration-200",
          "focus-visible:border-primary focus-visible:bg-white/10 focus-visible:outline-none",
          "hover:bg-white/10",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-invalid:border-destructive",
          "min-h-[48px] sm:h-12 sm:text-sm",
          className
        )}
        {...props}
      />
      {/* Laser Focus Effect */}
      <div className="absolute bottom-0 start-0 h-[2px] w-0 bg-primary transition-all duration-300 ease-out group-focus-within:w-full shadow-[0_0_10px_var(--primary)]" />
    </div>
  )
}

export { Input }
