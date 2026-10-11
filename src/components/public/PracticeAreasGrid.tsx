import React from "react";
import Link from "next/link";
import {
  Shield, Scale, Heart, Home, CreditCard, Lock, Building2,
  ShoppingBag, Users, Landmark, Globe, Cpu, ArrowRight
} from "lucide-react";

const areas = [
  { icon: Shield, title: "Criminal Law", desc: "FIR, bail, trial, appeals, acquittal & all criminal proceedings at all courts.", color: "bg-red-50 text-red-600 border-red-100", href: "/practice-areas#criminal" },
  { icon: Scale, title: "Civil Law", desc: "Suits, injunctions, declarations, money recovery & civil appeals.", color: "bg-blue-50 text-blue-600 border-blue-100", href: "/practice-areas#civil" },
  { icon: Heart, title: "Family & Matrimonial", desc: "Divorce, custody, maintenance, domestic violence & succession.", color: "bg-pink-50 text-pink-600 border-pink-100", href: "/practice-areas#family" },
  { icon: Home, title: "Property Disputes", desc: "Title disputes, partition, possession, injunction & property matters.", color: "bg-amber-50 text-amber-600 border-amber-100", href: "/practice-areas#property" },
  { icon: CreditCard, title: "Cheque Bounce / NI Act", desc: "Section 138 NI Act cases, trials & appeals across all courts.", color: "bg-orange-50 text-orange-600 border-orange-100", href: "/practice-areas#cheque" },
  { icon: Lock, title: "Bail & Anticipatory Bail", desc: "Regular bail, anticipatory bail & custody matters at all levels.", color: "bg-purple-50 text-purple-600 border-purple-100", href: "/practice-areas#bail" },
  { icon: Building2, title: "Corporate & Commercial", desc: "Company disputes, contracts, winding up & commercial litigation.", color: "bg-indigo-50 text-indigo-600 border-indigo-100", href: "/practice-areas#corporate" },
  { icon: ShoppingBag, title: "Consumer Cases", desc: "Consumer forum cases, deficiency of service & product liability.", color: "bg-teal-50 text-teal-600 border-teal-100", href: "/practice-areas#consumer" },
  { icon: Users, title: "Labour & Employment", desc: "Industrial disputes, wrongful termination, PF & ESI matters.", color: "bg-green-50 text-green-600 border-green-100", href: "/practice-areas#labour" },
  { icon: Landmark, title: "Banking & Financial", desc: "Debt recovery, DRT cases, SARFAESI & banking disputes.", color: "bg-cyan-50 text-cyan-600 border-cyan-100", href: "/practice-areas#banking" },
  { icon: Cpu, title: "Cyber Crime", desc: "Online fraud, cyber harassment, IT Act offences & digital crime.", color: "bg-violet-50 text-violet-600 border-violet-100", href: "/practice-areas#cyber" },
  { icon: Globe, title: "Constitutional Matters", desc: "Writ petitions, PILs, fundamental rights & constitutional remedies.", color: "bg-yellow-50 text-yellow-600 border-yellow-100", href: "/practice-areas#constitutional" },
];

export default function PracticeAreasGrid() {
  return (
    <section id="practice-areas" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-navy-200">
            Our Practice Areas
          </div>
          <h2 className="section-heading">Comprehensive Legal Services</h2>
          <div className="gold-divider" />
          <p className="section-sub mt-4">
            We handle the full spectrum of legal matters — from trial courts to the Supreme Court —
            with expertise, dedication, and a client-first approach.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {areas.map((area, i) => (
            <Link
              key={i}
              href={area.href}
              className="group border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-navy-200 transition-all duration-300 hover:-translate-y-0.5 bg-white"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${area.color}`}>
                <area.icon className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-semibold text-navy-900 mb-2 text-base group-hover:text-navy-700 transition-colors">
                {area.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{area.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-navy-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/practice-areas">
            <button className="inline-flex items-center gap-2 text-navy-800 font-semibold hover:text-gold-600 transition-colors text-sm border border-navy-200 rounded-full px-6 py-2.5 hover:border-gold-400">
              View All Practice Areas <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
