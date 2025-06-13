import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
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

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/admin", label: "Admin" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/disputes", label: "Disputes" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  return (
    <header className="bg-background border-b">
      <div className="container flex items-center justify-between h-10">
        <Link to="/" className="font-bold text-xl">
          CreditDispute
        </Link>

      <nav className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
              key={to}
              to={to}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="outline" size="sm">Profile</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>

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
            <div className="grid gap-4 py-2">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-sm font-medium transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link to="/profile" className="block text-sm font-medium hover:text-primary">
                    Profile
                  </Link>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block text-sm font-medium hover:text-primary">
                    Sign In
                  </Link>
                  <Link to="/signup" className="block text-sm font-medium hover:text-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
