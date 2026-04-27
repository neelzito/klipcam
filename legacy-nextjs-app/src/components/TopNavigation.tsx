"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Zap, Archive, CreditCard, BarChart3, User } from "lucide-react";

const navItems = [
  { href: "/create" as const, label: "Create", icon: Zap },
  { href: "/characters" as const, label: "Characters", icon: User },
  { href: "/library" as const, label: "Library", icon: Archive },
  { href: "/pricing" as const, label: "Pricing", icon: CreditCard },
  { href: "/dashboard" as const, label: "Dashboard", icon: BarChart3 },
];

export function TopNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="hidden lg:block">
      <nav className="flex items-center space-x-8">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? "text-primary-500 bg-primary-500/10" 
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Mobile Menu Button - only shown on smaller desktop screens if needed */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden p-2 text-gray-300 hover:text-white"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/95 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-300 hover:text-white"
            >
              <X size={24} />
            </button>
            
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-6 py-4 text-2xl rounded-lg transition-colors ${
                    isActive 
                      ? "text-primary-500 bg-primary-500/10" 
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={28} />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}