import React from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ramesh Prasad",
    role: "Business Owner, Patna",
    content:
      "Adv. Singh handled my property dispute with exceptional skill. What other lawyers said was hopeless, he won in just 8 months. Forever grateful.",
    rating: 5,
    case: "Property Dispute",
  },
  {
    name: "Priya Sharma",
    role: "Government Employee, Gaya",
    content:
      "The team managed my divorce and custody case with immense sensitivity. They fought hard for my rights while keeping my children's welfare first.",
    rating: 5,
    case: "Family Matter",
  },
  {
    name: "Amit Kumar",
    role: "Entrepreneur, Bhagalpur",
    content:
      "Got bail within 48 hours when we thought there was no hope. The firm worked round the clock. Professional, dedicated, and trustworthy.",
    rating: 5,
    case: "Criminal – Bail",
  },
  {
    name: "Sunita Devi",
    role: "Teacher, Muzaffarpur",
    content:
      "My cheque bounce case was dragging for 2 years. They took over and secured conviction plus full payment recovery within months. Excellent.",
    rating: 5,
    case: "Cheque Bounce",
  },
  {
    name: "Dr. Arun Mishra",
    role: "Doctor, Ranchi",
    content:
      "LexFirm Pro represented us in a medical negligence consumer case. Their preparation was thorough and we received full compensation.",
    rating: 5,
    case: "Consumer Forum",
  },
  {
    name: "Vijay Singh",
    role: "Retired Officer, Patna",
    content:
      "After 3 failed lawyers, I came to LexFirm Pro for my service matter at High Court. They argued brilliantly and won my reinstatement.",
    rating: 5,
    case: "High Court – Service Matter",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-navy-200">
            Client Testimonials
          </div>
          <h2 className="section-heading">What Our Clients Say</h2>
          <div className="gold-divider" />
          <p className="section-sub mt-4">
            Real experiences from real clients. Their trust and satisfaction is our greatest achievement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <Quote className="absolute top-5 right-5 w-8 h-8 text-gold-200" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-gold-400 text-gold-400" />
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.content}&rdquo;</p>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-navy-900 font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
                <span className="ml-auto text-xs bg-gold-50 text-gold-700 border border-gold-200 px-2 py-1 rounded-full">
                  {t.case}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
