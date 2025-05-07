
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/App";
import { supabase } from "@/integrations/supabase/client";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.functions.invoke('check-admin-status', {
            body: { userId: user.id }
          });
          
          if (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data?.isAdmin || false);
          }
        } catch (error) {
          console.error("Failed to check admin status:", error);
          setIsAdmin(false);
        }
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="w-full py-4 bg-white border-b border-gray-200">
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
          <span className="text-2xl font-bold gradient-text">CreditClarityAI</span>
        </Link>

        {isMobile ? (
          <>
            <Button 
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>

            {isMenuOpen && (
              <div className="fixed inset-0 top-16 z-50 bg-white">
                <div className="flex flex-col items-center pt-8 space-y-6">
                  <Link to="/" className="text-lg font-medium" onClick={closeMenu}>Home</Link>
                  <Link to="/about" className="text-lg font-medium" onClick={closeMenu}>About</Link>
                  <Link to="/pricing" className="text-lg font-medium" onClick={closeMenu}>Pricing</Link>
                  <Link to="/faq" className="text-lg font-medium" onClick={closeMenu}>FAQ</Link>
                  <Link to="/contact" className="text-lg font-medium" onClick={closeMenu}>Contact</Link>
                  
                  {user ? (
                    <>
                      <Link to="/dispute-generator" className="text-lg font-medium" onClick={closeMenu}>Dispute Generator</Link>
                      {isAdmin && (
                        <Link to="/admin" className="text-lg font-medium text-blue-600" onClick={closeMenu}>Admin Panel</Link>
                      )}
                      <Button variant="outline" onClick={handleLogout} className="mt-4">Log Out</Button>
                    </>
                  ) : (
                    <div className="pt-4 flex flex-col space-y-4 w-full px-8">
                      <Link to="/login" onClick={closeMenu}>
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                      <Link to="/signup" onClick={closeMenu}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-brand-600 transition-colors">Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-brand-600 transition-colors">About</Link>
              <Link to="/pricing" className="text-gray-700 hover:text-brand-600 transition-colors">Pricing</Link>
              <Link to="/faq" className="text-gray-700 hover:text-brand-600 transition-colors">FAQ</Link>
              <Link to="/contact" className="text-gray-700 hover:text-brand-600 transition-colors">Contact</Link>
              {user && (
                <Link to="/dispute-generator" className="text-gray-700 hover:text-brand-600 transition-colors">Dispute Generator</Link>
              )}
              {user && isAdmin && (
                <Link to="/admin" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Admin Panel</Link>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <User size={16} />
                      <span>Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/placeholder-dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dispute-generator">Dispute Generator</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 flex items-center gap-2">
                      <LogOut size={14} />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline">Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
