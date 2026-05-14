import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-[35px] px-5 py-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-orange-hover active:bg-orange-active",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-foreground text-foreground hover:border-secondary hover:text-secondary active:bg-beige active:border-beige active:text-white font-semibold",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-accent underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground hover:bg-orange-hover active:bg-orange-active shadow-premium text-base font-semibold rounded-full",
        back: "border-2 border-foreground text-foreground hover:border-secondary hover:text-secondary active:bg-beige active:border-beige active:text-white font-semibold rounded-full",
        "outline-green": "border-2 border-secondary text-secondary hover:border-green-dark hover:text-green-dark active:bg-beige active:border-beige active:text-white rounded-full font-semibold",
        "outline-calm": "border-2 border-primary/15 text-foreground hover:bg-primary/5 hover:border-primary/30 rounded-full",
        stop: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full text-base font-medium",
      },
      size: {
        default: "",
        sm: "",
        lg: "text-base",
        icon: "w-[35px] px-0",
        xl: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
