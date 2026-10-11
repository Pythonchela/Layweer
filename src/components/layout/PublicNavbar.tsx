"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Scale, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const practiceAreas = [
  { label: "Criminal Law", href: "/practice-areas#criminal" },
  { label: "Civil Law", href: "/practice-areas#civil" },
  { label: "Family & Matrimonial", href: "/practice-areas#family" },
  { label: "Property Disputes", href: "/practice-areas#property" },
  { label: "Cheque Bounce / NI Act", href: "/practice-areas#cheque" },
  { label: "Bail & Anticipatory Bail", href: "/practice-areas#bail" },
  { label: "Corporate Disputes", href: "/practice-areas#corporate" },
  { label: "Consumer Cases", href: "/practice-areas#consumer" },
  { label: "Labour & Employment", href: "/practice-areas#labour" },
  { label: "Cyber Crime", href: "/practice-areas#cyber" },
  { label: "High Court", href: "/practice-areas#highcourt" },
  { label: "Supreme Court", href: "/practice-areas#supremecourt" },
];

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-navy-950/98 backdrop-blur-md shadow-xl border-b border-gold-500/20"
          : "bg-navy-950/90 backdrop-blur-sm"
      )}
    >
      {/* Top bar */}
      <div className="bg-gold-500 text-navy-950 py-1.5 px-4 text-center text-xs font-medium hidden md:block">
        <Phone className="inline w-3 h-3 mr-1" />
        24/7 Legal Helpline: +91 98765 43210 &nbsp;|&nbsp; consultations@lexfirmpro.com
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center group-hover:bg-gold-400 transition-colors">
              <Scale className="w-6 h-6 text-navy-900" />
            </div>
            <div>
              <div className="text-white font-serif font-bold text-xl leading-none">LexFirm Pro</div>
              <div className="text-gold-400 text-xs">Advocates & Legal Consultants</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/about">About</NavLink>

            {/* Practice Areas Dropdown */}
            <div className="relative group" onMouseEnter={() => setPracticeOpen(true)} onMouseLeave={() => setPracticeOpen(false)}>
              <button className="flex items-center gap-1 px-4 py-2 text-gray-200 hover:text-gold-400 text-sm font-medium transition-colors">
                Practice Areas <ChevronDown className="w-4 h-4" />
              </button>
              {practiceOpen && (
                <div className="absolute top-full left-0 w-64 bg-navy-950 border border-gold-500/20 rounded-lg shadow-2xl py-2 grid grid-cols-1">
                  {practiceAreas.map((area) => (
                    <Link
                      key={area.href}
                      href={area.href}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-navy-800/50 transition-colors"
                    >
                      {area.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NavLink href="/consultation">Consultation</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </div>

          {/* CTA buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/consultation">
              <Button variant="gold" size="sm">Book Consultation</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-navy-950 border-t border-gold-500/20 py-4 px-4 space-y-1">
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/practice-areas", label: "Practice Areas" },
            { href: "/consultation", label: "Consultation" },
            { href: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 text-gray-300 hover:text-gold-400 font-medium text-sm rounded-lg hover:bg-white/5"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full border-gray-600 text-gray-300" size="sm">Login</Button>
            </Link>
            <Link href="/consultation" onClick={() => setIsOpen(false)}>
              <Button variant="gold" className="w-full" size="sm">Book Consultation</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-4 py-2 text-gray-200 hover:text-gold-400 text-sm font-medium transition-colors">
      {children}
    </Link>
  );
}
