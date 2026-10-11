import React from "react";
import Link from "next/link";
import { ArrowRight, Scale, Shield, Heart, Home, CreditCard, Lock, Building2, ShoppingBag, Users, Landmark, Cpu, Globe, Gavel } from "lucide-react";

const areas = [
  {
    id: "criminal",
    icon: Shield,
    color: "from-red-600 to-red-800",
    lightColor: "bg-red-50 border-red-200 text-red-700",
    title: "Criminal Law",
    subtitle: "Defence, Trials & Appeals",
    overview: "Our criminal law practice covers the entire spectrum — from FIR registration and bail applications to full criminal trials, appeals, and revisions at all levels of the judiciary.",
    services: ["FIR Registration & Quashing", "Bail & Anticipatory Bail", "Criminal Trials", "Sessions Court Matters", "High Court Criminal Appeals", "Supreme Court Criminal Matters", "Acquittal Appeals", "Revision Petitions", "Compounding of Offences", "Juvenile Matters"],
    courts: ["Sessions Court", "High Court", "Supreme Court"],
  },
  {
    id: "civil",
    icon: Scale,
    color: "from-blue-600 to-blue-800",
    lightColor: "bg-blue-50 border-blue-200 text-blue-700",
    title: "Civil Law",
    subtitle: "Suits, Decrees & Execution",
    overview: "Comprehensive civil litigation services covering all types of suits, appeals, and execution proceedings at every level from District Court to Supreme Court.",
    services: ["Money Recovery Suits", "Injunction Applications", "Declaration Suits", "Partition Suits", "Specific Performance", "Civil Appeals & Revisions", "Execution Proceedings", "Writ Petitions", "Review Petitions", "Miscellaneous Applications"],
    courts: ["District Court", "High Court", "Supreme Court"],
  },
  {
    id: "family",
    icon: Heart,
    color: "from-pink-600 to-pink-800",
    lightColor: "bg-pink-50 border-pink-200 text-pink-700",
    title: "Family & Matrimonial Law",
    subtitle: "Sensitive. Confidential. Decisive.",
    overview: "We handle family matters with utmost sensitivity and confidentiality, providing strong representation while keeping family welfare at the center of every decision.",
    services: ["Divorce (Mutual & Contested)", "Child Custody & Guardianship", "Maintenance & Alimony", "Domestic Violence Cases", "Dowry Harassment Matters", "Succession & Inheritance", "Hindu/Muslim/Christian Personal Law", "Adoption Matters", "Matrimonial Property Disputes", "Family Court Appeals"],
    courts: ["Family Court", "District Court", "High Court"],
  },
  {
    id: "property",
    icon: Home,
    color: "from-amber-600 to-amber-800",
    lightColor: "bg-amber-50 border-amber-200 text-amber-700",
    title: "Property Disputes",
    subtitle: "Protect Your Land & Assets",
    overview: "Expert representation in all property-related disputes — residential, commercial, agricultural — across all courts and revenue authorities.",
    services: ["Title Dispute Resolution", "Possession Cases", "Property Partition Suits", "Landlord-Tenant Disputes", "Land Acquisition Matters", "Revenue Court Matters", "Property Registration Disputes", "Construction Disputes", "Property Attachment Matters", "Housing Board Matters"],
    courts: ["Revenue Court", "District Court", "High Court"],
  },
  {
    id: "cheque",
    icon: CreditCard,
    color: "from-orange-600 to-orange-800",
    lightColor: "bg-orange-50 border-orange-200 text-orange-700",
    title: "Cheque Bounce / NI Act",
    subtitle: "Section 138 Specialists",
    overview: "Specialists in cheque dishonour cases under Section 138 of the Negotiable Instruments Act. We represent both complainants and accused with equal expertise.",
    services: ["Section 138 NI Act Complaints", "Trial Before Magistrate", "Sessions Court Appeals", "High Court Revisions", "Supreme Court Matters", "Compounding Applications", "Interim Injunctions", "Anticipatory Bail in NI Cases", "Summary Trial Matters", "Cheque Fraud Cases"],
    courts: ["Magistrate Court", "Sessions Court", "High Court"],
  },
  {
    id: "bail",
    icon: Lock,
    color: "from-purple-600 to-purple-800",
    lightColor: "bg-purple-50 border-purple-200 text-purple-700",
    title: "Bail & Anticipatory Bail",
    subtitle: "Fast. Effective. Reliable.",
    overview: "We provide swift and effective bail services round the clock. Our experienced team has secured bail in hundreds of criminal matters at all court levels.",
    services: ["Regular Bail Applications", "Anticipatory Bail – Sessions Court", "Anticipatory Bail – High Court", "Bail Under Special Acts (NDPS, POCSO, UAPA)", "Bail Cancellation Opposition", "Remand Hearings", "Custody Extensions", "Police Remand Opposition", "Bail Modification", "Emergency Bail Services"],
    courts: ["Sessions Court", "High Court", "Supreme Court"],
  },
  {
    id: "corporate",
    icon: Building2,
    color: "from-indigo-600 to-indigo-800",
    lightColor: "bg-indigo-50 border-indigo-200 text-indigo-700",
    title: "Corporate & Commercial",
    subtitle: "Business Legal Solutions",
    overview: "Full-service corporate and commercial litigation practice covering disputes, contracts, regulatory matters, and insolvency proceedings.",
    services: ["Commercial Contract Disputes", "Company Law Matters", "Insolvency & Bankruptcy", "NCLT & NCLAT Matters", "Arbitration & Mediation", "Competition Law", "Joint Venture Disputes", "Intellectual Property Disputes", "Regulatory Compliance", "Shareholder Disputes"],
    courts: ["Commercial Court", "High Court", "NCLT", "Supreme Court"],
  },
  {
    id: "consumer",
    icon: ShoppingBag,
    color: "from-teal-600 to-teal-800",
    lightColor: "bg-teal-50 border-teal-200 text-teal-700",
    title: "Consumer Cases",
    subtitle: "Your Rights, Our Fight",
    overview: "We represent consumers against defective products, deficient services, and unfair trade practices before consumer forums at all levels.",
    services: ["District Consumer Forum", "State Commission Appeals", "National Commission Matters", "Product Liability Cases", "Deficiency of Service", "Builder-Buyer Disputes", "Insurance Claim Disputes", "Medical Negligence (Consumer)", "Telecom Service Complaints", "E-Commerce Disputes"],
    courts: ["District Forum", "State Commission", "National Commission"],
  },
  {
    id: "labour",
    icon: Users,
    color: "from-green-600 to-green-800",
    lightColor: "bg-green-50 border-green-200 text-green-700",
    title: "Labour & Employment",
    subtitle: "Protecting Workers & Employers",
    overview: "Comprehensive labour law services representing both employers and employees in industrial disputes, service matters, and employment-related litigation.",
    services: ["Industrial Dispute Matters", "Wrongful Termination Cases", "PF & ESI Matters", "Workman Compensation", "Labour Court Matters", "Industrial Tribunal Cases", "Service Law – Government Employees", "Minimum Wages Disputes", "Contract Labour Issues", "Trade Union Matters"],
    courts: ["Labour Court", "Industrial Tribunal", "High Court"],
  },
  {
    id: "banking",
    icon: Landmark,
    color: "from-cyan-600 to-cyan-800",
    lightColor: "bg-cyan-50 border-cyan-200 text-cyan-700",
    title: "Banking & Financial",
    subtitle: "DRT, SARFAESI & Recovery",
    overview: "Specialised practice in banking and financial litigation including debt recovery, SARFAESI proceedings, and banking regulatory matters.",
    services: ["Debt Recovery Tribunal (DRT)", "SARFAESI Act Proceedings", "NPA Recovery Matters", "Bank Fraud Cases", "Guarantor Liability Cases", "Cheque Fraud Matters", "Securitization Cases", "Banking Regulatory Issues", "Credit Card Disputes", "Loan Default Matters"],
    courts: ["DRT", "DRAT", "High Court", "Supreme Court"],
  },
  {
    id: "cyber",
    icon: Cpu,
    color: "from-violet-600 to-violet-800",
    lightColor: "bg-violet-50 border-violet-200 text-violet-700",
    title: "Cyber Crime",
    subtitle: "Digital Age Legal Protection",
    overview: "Expert legal services for cyber crime matters under the IT Act and IPC, representing both victims seeking redress and accused seeking defence.",
    services: ["Online Fraud Cases", "Cyber Harassment & Stalking", "Data Theft Matters", "Hacking & Unauthorized Access", "Social Media Offences", "Online Defamation", "Digital Evidence Matters", "Identity Theft Cases", "Financial Cyber Fraud", "IT Act Bail Matters"],
    courts: ["Cyber Cell", "Magistrate Court", "Sessions Court", "High Court"],
  },
  {
    id: "constitutional",
    icon: Globe,
    color: "from-yellow-600 to-yellow-800",
    lightColor: "bg-yellow-50 border-yellow-200 text-yellow-700",
    title: "Constitutional & Writ Matters",
    subtitle: "Fundamental Rights. Public Interest.",
    overview: "High Court and Supreme Court practice focused on constitutional remedies, fundamental rights enforcement, and public interest litigation.",
    services: ["Writ Petitions (HC & SC)", "Public Interest Litigation (PIL)", "Fundamental Rights Petitions", "Habeas Corpus Petitions", "Mandamus Petitions", "Certiorari Applications", "Constitutional Validity Challenges", "Administrative Law Matters", "Government Policy Challenges", "Election Law Matters"],
    courts: ["High Court", "Supreme Court"],
  },
];

export default function PracticeAreasPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-navy-950 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 text-gold-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-gold-500/20">
            <Gavel className="w-4 h-4" /> Our Practice Areas
          </div>
          <h1 className="font-serif text-5xl font-bold text-white mb-4">
            Comprehensive Legal Services
          </h1>
          <div className="w-16 h-1 bg-gold-500 mx-auto my-6 rounded-full" />
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            From District Courts to the Supreme Court of India — we bring expertise, dedication
            and proven results across all areas of law.
          </p>
        </div>
      </div>

      {/* Practice areas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-20">
          {areas.map((area, i) => (
            <div
              key={area.id}
              id={area.id}
              className={`grid lg:grid-cols-2 gap-12 items-start ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              {/* Icon + Info */}
              <div>
                <div className={`w-16 h-16 bg-gradient-to-br ${area.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <area.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-navy-900 mb-2">{area.title}</h2>
                <div className={`inline-flex text-sm font-medium px-3 py-1 rounded-full border mb-4 ${area.lightColor}`}>
                  {area.subtitle}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{area.overview}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {area.courts.map((c) => (
                    <span key={c} className="text-xs bg-navy-50 text-navy-700 border border-navy-200 px-3 py-1 rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                </div>
                <Link href="/consultation">
                  <button className="inline-flex items-center gap-2 btn-primary rounded-lg text-sm">
                    Consult for {area.title} <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Services list */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <h3 className="font-semibold text-navy-900 mb-4 text-sm uppercase tracking-wider">Our Services Include</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {area.services.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy-950 py-16 px-4 text-center">
        <h2 className="font-serif text-3xl text-white font-bold mb-4">Need Legal Help?</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Contact us today for a confidential consultation. Our expert advocates are ready to fight for you.
        </p>
        <Link href="/consultation">
          <button className="btn-gold rounded-lg inline-flex items-center gap-2">
            Book Free Consultation <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
