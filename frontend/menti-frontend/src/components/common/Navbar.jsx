import React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "../ui/navigation-menu";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../ui/sheet";
import { Menu } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const Navbar = () => {
  return (
    <header className="w-full bg-blue-200 text-black shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 font-raleway">
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-black font-barlow-condensed">
            MandiMeter.
          </div>
        </div>

        <NavigationMenu>
          <NavigationMenuList className="hidden space-x-4 md:flex">
            {navLinks.map(({ href, label }) => (
              <NavigationMenuItem key={label}>
                <NavigationMenuLink
                  href={href}
                  className="px-4 py-2 text-sm font-medium hover:text-black"
                >
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white rounded-full md:text-sm text-xs"
          >
            <a href="/">Create</a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden p-2 hover:bg-transparent"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-3/5 bg-blue-200 text-black p-6"
            >
              <div className="flex flex-col items-start gap-4 pt-6">
                <SheetTitle className="text-4xl font-bold font-barlow-condensed overflow-hidden">
                  Menu.
                </SheetTitle>

                <SheetDescription className="text-base text-muted-foreground mb-4">
                  Your Nav
                </SheetDescription>

                <NavigationMenu>
                  <NavigationMenuList className="flex flex-col items-start gap-3">
                    {navLinks.map(({ href, label }) => (
                      <NavigationMenuItem key={label}>
                        <SheetClose asChild>
                          <NavigationMenuLink
                            href={href}
                            className="text-sm font-medium hover:underline"
                          >
                            {label}
                          </NavigationMenuLink>
                        </SheetClose>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
