"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseIcon, MenuIcon, CloseIcon, TrendingUpIcon, MessageIcon, FlagIcon } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Overview", icon: TrendingUpIcon, exact: true },
  { href: "/admin/agents", label: "Agents", icon: BriefcaseIcon, exact: false },
  { href: "/admin/leads", label: "Leads & analytics", icon: MessageIcon, exact: false },
  { href: "/admin/reports", label: "Reports", icon: FlagIcon, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`admin-nav-link${active ? " active" : ""}`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">A</span>
          Admin
        </div>
        <nav className="admin-nav">
          <NavLinks />
        </nav>
        <button className="admin-nav-link admin-logout" onClick={logout}>
          Log out
        </button>
      </aside>

      <div className="admin-content-col">
        <div className="admin-topbar">
          <div className="admin-brand">
            <span className="admin-brand-mark">A</span>
            Admin
          </div>
          <button className="admin-icon-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>

        <main className="admin-main">{children}</main>
      </div>

      {mobileOpen && (
        <div className="admin-mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
          <div className="admin-mobile-nav" onClick={(e) => e.stopPropagation()}>
            <div className="admin-mobile-nav-head">
              <div className="admin-brand">
                <span className="admin-brand-mark">A</span>
                Admin
              </div>
              <button className="admin-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="admin-nav">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <button className="admin-nav-link admin-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
