import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "../../lib/utils"; // Update path as needed

const NavigationMenu = React.forwardRef(
  ({ className, children, viewport = true, ...props }, ref) => {
    return (
      <NavigationMenuPrimitive.Root
        data-slot="navigation-menu"
        data-viewport={viewport}
        className={cn(
          "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
          className
        )}
        {...props}
        ref={ref}
      >
        {children}
        {viewport && <NavigationMenuViewport />}
      </NavigationMenuPrimitive.Root>
    );
  }
);

const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
      ref={ref}
    />
  );
});

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1"
);

const NavigationMenuTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <NavigationMenuPrimitive.Trigger
        data-slot="navigation-menu-trigger"
        className={cn(navigationMenuTriggerStyle(), "group", className)}
        {...props}
        ref={ref}
      >
        {children}
        <ChevronDownIcon
          className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </NavigationMenuPrimitive.Trigger>
    );
  }
);

const NavigationMenuContent = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <NavigationMenuPrimitive.Content
        data-slot="navigation-menu-content"
        className={cn(
          "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200",
          className
        )}
        {...props}
        ref={ref}
      />
    );
  }
);

const NavigationMenuViewport = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "absolute top-full left-0 isolate z-50 flex justify-center"
        )}
      >
        <NavigationMenuPrimitive.Viewport
          data-slot="navigation-menu-viewport"
          className={cn(
            "origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
            className
          )}
          {...props}
          ref={ref}
        />
      </div>
    );
  }
);

const NavigationMenuLink = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        // Underline hover effect (your utility class)
        "underline-hover",

        // Make underline visible when active
        "data-[active=true]:after:w-full data-[active=true]:after:left-0",

        // Layout and interaction
        "relative flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none",

        // Accessibility
        "focus-visible:ring-[3px] focus-visible:outline-1 focus-visible:ring-ring/50",

        // SVG styling
        "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4",

        className
      )}
      {...props}
      ref={ref}
    />
  );
});

const NavigationMenuIndicator = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <NavigationMenuPrimitive.Indicator
        data-slot="navigation-menu-indicator"
        className={cn(
          "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
          className
        )}
        {...props}
        ref={ref}
      >
        <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
      </NavigationMenuPrimitive.Indicator>
    );
  }
);

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
