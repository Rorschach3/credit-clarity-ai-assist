import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/layout/ModeToggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  return (
    <header className="bg-background border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-bold text-xl">
          AI Credit Repair
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link to="/features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </Link>
            <Link to="/testimonials" className="text-sm font-medium transition-colors hover:text-primary">
              Testimonials
            </Link>
            <Link to="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link to="/faq" className="text-sm font-medium transition-colors hover:text-primary">
              FAQ
            </Link>
            <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary">
              Contact
            </Link>
          </nav>

          <ModeToggle />

          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Explore our site and discover how we can help you.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <Link to="/" className="block text-sm font-medium transition-colors hover:text-primary">
                  Home
                </Link>
                <Link to="/features" className="block text-sm font-medium transition-colors hover:text-primary">
                  Features
                </Link>
                <Link to="/testimonials" className="block text-sm font-medium transition-colors hover:text-primary">
                  Testimonials
                </Link>
                <Link to="/pricing" className="block text-sm font-medium transition-colors hover:text-primary">
                  Pricing
                </Link>
                <Link to="/faq" className="block text-sm font-medium transition-colors hover:text-primary">
                  FAQ
                </Link>
                <Link to="/about" className="block text-sm font-medium transition-colors hover:text-primary">
                  About
                </Link>
                <Link to="/contact" className="block text-sm font-medium transition-colors hover:text-primary">
                  Contact
                </Link>
                {!user ? (
                  <>
                    <Link to="/login" className="block text-sm font-medium transition-colors hover:text-primary">
                      Log In
                    </Link>
                    <Link to="/signup" className="block text-sm font-medium transition-colors hover:text-primary">
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={signOut}>
                    Sign Out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
