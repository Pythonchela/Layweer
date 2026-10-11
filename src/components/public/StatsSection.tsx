"use client";
import React from "react";
import { Users, Briefcase, Trophy, Calendar } from "lucide-react";

const stats = [
  { icon: Users, value: "2,850+", label: "Happy Clients", color: "text-navy-800" },
  { icon: Briefcase, value: "5,200+", label: "Cases Handled", color: "text-navy-800" },
  { icon: Trophy, value: "98%", label: "Success Rate", color: "text-navy-800" },
  { icon: Calendar, value: "25+", label: "Years of Practice", color: "text-navy-800" },
];

export default function StatsSection() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-navy-50 group-hover:bg-gold-50 rounded-2xl flex items-center justify-center transition-colors">
                  <stat.icon className={`w-7 h-7 ${stat.color} group-hover:text-gold-600 transition-colors`} />
                </div>
              </div>
              <div className="text-4xl font-bold font-serif text-navy-900 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
