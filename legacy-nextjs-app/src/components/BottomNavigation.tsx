"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Zap, Archive, CreditCard, BarChart3, User } from "lucide-react";

const navItems = [
  { href: "/create" as const, label: "Create", icon: Zap },
  { href: "/characters" as const, label: "Characters", icon: User },
  { href: "/library" as const, label: "Library", icon: Archive },
  { href: "/pricing" as const, label: "Pricing", icon: CreditCard },
  { href: "/dashboard" as const, label: "Dashboard", icon: BarChart3 },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 lg:hidden">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 px-4 min-h-[60px] ${
                isActive 
                  ? "text-primary-500" 
                  : "text-gray-400 hover:text-white transition-colors"
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}