import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Scale, GraduationCap, ArrowRight } from "lucide-react";

const qualifications = [
  "LL.B. — Patna University (Gold Medalist, 1998)",
  "LL.M. — Delhi University (Constitutional Law)",
  "Enrolled with Bar Council of Bihar",
  "Senior Advocate — Patna High Court",
  "Supreme Court of India — Advocate on Record",
];

const specializations = [
  "Criminal Law & Bail Matters",
  "Constitutional Law",
  "High Court & Supreme Court",
  "Property & Civil Disputes",
  "Corporate Litigation",
];

export default function AdvocateProfile() {
  return (
    <section id="advocate" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image + card */}
          <div className="relative">
            <div className="bg-navy-900 rounded-3xl overflow-hidden aspect-[4/5] relative max-w-md mx-auto">
              {/* Placeholder image */}
              <div className="absolute inset-0 bg-gradient-to-b from-navy-700 to-navy-950 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gold-500/30">
                    <Scale className="w-16 h-16 text-gold-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Adv. Rajendra Kumar Singh</p>
                  <p className="text-gold-400 text-xs mt-1">Senior Advocate</p>
                </div>
              </div>
              {/* Experience badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-gold-500 rounded-2xl p-4 text-navy-900">
                <div className="text-3xl font-bold font-serif">25+ Years</div>
                <div className="text-sm font-medium">Dedicated Legal Service</div>
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-navy-900">Top Advocate</div>
                  <div className="text-xs text-gray-500">Bihar 2024</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-50 text-gold-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-gold-200">
              <Scale className="w-4 h-4" />
              Senior Advocate Profile
            </div>
            <h2 className="section-heading text-left">
              Adv. Rajendra Kumar Singh
            </h2>
            <div className="gold-divider mx-0" />
            <p className="text-gray-600 mt-4 mb-6 leading-relaxed">
              With over 25 years of dedicated practice at the Patna High Court and Supreme Court of India,
              Adv. Rajendra Kumar Singh is one of the most respected legal minds in Bihar. His expertise
              spans criminal law, constitutional matters, property disputes, and corporate litigation.
              Known for his meticulous preparation and powerful advocacy, he has successfully argued
              thousands of cases and achieved landmark judgments.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {/* Qualifications */}
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-navy-900 mb-3">
                  <GraduationCap className="w-4 h-4 text-gold-500" /> Qualifications
                </h3>
                <ul className="space-y-2">
                  {qualifications.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Specializations */}
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-navy-900 mb-3">
                  <BookOpen className="w-4 h-4 text-gold-500" /> Specializations
                </h3>
                <ul className="space-y-2">
                  {specializations.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-navy-800 mt-2 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href="/consultation">
              <Button variant="default" size="lg" className="group">
                Schedule a Consultation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
