import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";

const news = [
  {
    title: "Supreme Court Clarifies Bail Conditions Under UAPA in Landmark Judgment",
    category: "Legal Update",
    date: "October 5, 2026",
    excerpt:
      "The Supreme Court bench delivered a significant ruling clarifying the conditions under which bail can be granted in UAPA cases, emphasizing proportionality and individual liberty.",
    readTime: "4 min read",
  },
  {
    title: "New Amendment to CrPC: What It Means for Criminal Defendants",
    category: "Legislative Change",
    date: "September 28, 2026",
    excerpt:
      "The Bharatiya Nagarik Suraksha Sanhita brings significant procedural changes. Our senior advocate explains what accused persons need to know about their rights.",
    readTime: "6 min read",
  },
  {
    title: "Patna High Court's New Fast-Track Bench for Property Disputes",
    category: "Court News",
    date: "September 15, 2026",
    excerpt:
      "Patna High Court announces dedicated fast-track benches for property dispute cases, aiming to reduce pendency and provide quicker resolution to litigants.",
    readTime: "3 min read",
  },
];

export default function NewsSection() {
  return (
    <section id="news" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-navy-200">
              <Newspaper className="w-4 h-4" /> News & Legal Updates
            </div>
            <h2 className="section-heading text-left">Stay Informed</h2>
            <div className="gold-divider mx-0" />
          </div>
          <Link href="/news" className="inline-flex items-center gap-2 text-navy-800 hover:text-gold-600 font-medium text-sm">
            All Updates <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item, i) => (
            <article
              key={i}
              className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Category color bar */}
              <div className="h-1.5 bg-gradient-to-r from-navy-800 to-gold-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs bg-navy-50 text-navy-700 border border-navy-200 px-2.5 py-1 rounded-full font-medium">
                    {item.category}
                  </span>
                  <span className="text-gray-400 text-xs ml-auto">{item.readTime}</span>
                </div>
                <h3 className="font-serif font-semibold text-navy-900 text-base mb-3 leading-snug group-hover:text-navy-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{item.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" /> {item.date}
                  </div>
                  <button className="text-navy-800 hover:text-gold-600 text-xs font-medium flex items-center gap-1 transition-colors">
                    Read More <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
