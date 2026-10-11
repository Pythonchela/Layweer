"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scale, Shield, Award, ArrowRight, Play, CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center bg-navy-950 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/95 to-navy-900/80" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-2 mb-8">
              <Award className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">25+ Years of Legal Excellence</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Justice Is Our
              <span className="block text-gold-400">Commitment</span>
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-lg">
              Expert legal representation across Criminal, Civil, Family, Corporate, and Constitutional
              matters. Trusted by over 2,850 clients across Bihar, Jharkhand & beyond.
            </p>

            {/* Checkmarks */}
            <ul className="space-y-3 mb-10">
              {[
                "Supreme Court & High Court Advocates",
                "24/7 Emergency Legal Assistance",
                "Transparent Fee Structure",
                "Digital Case Tracking for Clients",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-gold-400 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link href="/consultation">
                <Button variant="gold" size="xl" className="group">
                  Book Free Consultation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-gray-600 text-gray-300 hover:bg-white/5 hover:border-gold-400 hover:text-gold-400 group"
                >
                  <Play className="w-4 h-4" />
                  Our Story
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — stats cards */}
          <div className="hidden lg:grid grid-cols-2 gap-5">
            {[
              { icon: Scale, value: "2,850+", label: "Clients Served", color: "text-gold-400", bg: "bg-gold-500/10" },
              { icon: Shield, value: "1,420+", label: "Active Cases", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Award, value: "98%", label: "Success Rate", color: "text-green-400", bg: "bg-green-500/10" },
              { icon: Scale, value: "25+", label: "Years Experience", color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-navy-800/60 border border-navy-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-gold-500/30 transition-colors"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-4xl font-bold font-serif ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}

            {/* Trust bar */}
            <div className="col-span-2 bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5">
              <p className="text-gold-300 text-sm font-medium mb-3">Registered with Bar Council of India</p>
              <div className="flex flex-wrap gap-2">
                {["Supreme Court", "Patna High Court", "District Courts", "Tribunals"].map((c) => (
                  <span key={c} className="text-xs bg-navy-700/50 text-gray-300 px-3 py-1 rounded-full border border-navy-600">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-gold-500/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
      </div>
    </section>
  );
}
