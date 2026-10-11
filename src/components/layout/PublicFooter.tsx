import React from "react";
import Link from "next/link";
import { Scale, Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-navy-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-navy-900" />
              </div>
              <div>
                <div className="text-white font-serif font-bold text-xl">LexFirm Pro</div>
                <div className="text-gold-400 text-xs">Advocates & Legal Consultants</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              Over two decades of excellence in legal practice. We fight for justice with integrity,
              expertise, and unwavering commitment to our clients.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-navy-800 hover:bg-gold-500 hover:text-navy-900 text-gray-400 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Practice Areas */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-serif">
              Practice Areas
            </h4>
            <ul className="space-y-2">
              {[
                "Criminal Law", "Civil Law", "Family & Matrimonial",
                "Property Disputes", "Cheque Bounce", "Bail Applications",
                "Corporate Disputes", "Consumer Cases", "Labour Law",
                "Cyber Crime",
              ].map((area) => (
                <li key={area}>
                  <Link
                    href="/practice-areas"
                    className="text-sm text-gray-400 hover:text-gold-400 transition-colors"
                  >
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-serif">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: "About the Firm", href: "/about" },
                { label: "Senior Advocate", href: "/about#advocate" },
                { label: "Achievements", href: "/about#achievements" },
                { label: "Testimonials", href: "/#testimonials" },
                { label: "Legal Updates", href: "/#news" },
                { label: "Book Consultation", href: "/consultation" },
                { label: "Client Login", href: "/login" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-serif">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">
                  Chamber No. 101, Bar Council Building,
                  <br />District Court Complex, Patna – 800001
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <div className="text-sm text-gray-400">
                  <div>+91 98765 43210</div>
                  <div>+91 87654 32109</div>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <div className="text-sm text-gray-400">
                  <div>info@lexfirmpro.com</div>
                  <div>consultations@lexfirmpro.com</div>
                </div>
              </li>
            </ul>
            <div className="mt-6 bg-navy-800 rounded-lg p-4">
              <p className="text-xs text-gray-400">
                <span className="text-gold-400 font-medium">Office Hours:</span><br />
                Mon – Sat: 10:00 AM – 6:00 PM<br />
                Sunday: By Appointment Only
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-navy-800 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} LexFirm Pro. All rights reserved. Built with dedication to justice.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold-400 transition-colors">Terms of Service</Link>
            <Link href="/disclaimer" className="hover:text-gold-400 transition-colors">Legal Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
