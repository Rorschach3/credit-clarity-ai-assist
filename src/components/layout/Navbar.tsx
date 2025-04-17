
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
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
                  <Link to="/contact" className="text-lg font-medium" onClick={closeMenu}>Contact</Link>
                  <div className="pt-4 flex flex-col space-y-4 w-full px-8">
                    <Link to="/login" onClick={closeMenu}>
                      <Button variant="outline" className="w-full">Log In</Button>
                    </Link>
                    <Link to="/signup" onClick={closeMenu}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
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
              <Link to="/contact" className="text-gray-700 hover:text-brand-600 transition-colors">Contact</Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
