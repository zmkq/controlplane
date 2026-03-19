import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(219,236,10,0.3)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(219,236,10,0.5)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-white shadow-[0_0_20px_rgba(255,75,101,0.3)] hover:bg-destructive/90 hover:shadow-[0_0_30px_rgba(255,75,101,0.5)]",
        outline:
          "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-foreground backdrop-blur-md",
        subtle:
          "bg-white/5 hover:bg-white/10 text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "glass-panel hover:bg-white/5 text-foreground border-white/10",
      },
      size: {
        default: "h-12 px-5 py-2 sm:h-11",
        sm: "h-10 px-3 text-xs sm:h-9",
        lg: "h-14 px-8 text-base sm:h-12",
        icon: "h-12 w-12 sm:h-11 sm:w-11",
        "icon-sm": "h-10 w-10 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  // When using asChild, don't render loading spinner as Slot expects single child
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
