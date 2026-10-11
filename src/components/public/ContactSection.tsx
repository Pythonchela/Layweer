"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Your message has been sent. We'll contact you shortly!");
    setForm({ name: "", mobile: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-navy-200">
            Get In Touch
          </div>
          <h2 className="section-heading">Contact Us</h2>
          <div className="gold-divider" />
          <p className="section-sub mt-4">
            Reach out for a consultation or any legal inquiry. We respond within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-5">
            {[
              {
                icon: Phone,
                title: "Phone / WhatsApp",
                lines: ["+91 98765 43210", "+91 87654 32109"],
                color: "text-green-600 bg-green-50",
              },
              {
                icon: Mail,
                title: "Email",
                lines: ["info@lexfirmpro.com", "consultations@lexfirmpro.com"],
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: MapPin,
                title: "Office Address",
                lines: ["Chamber No. 101, Bar Council Building,", "District Court Complex, Patna – 800001"],
                color: "text-red-600 bg-red-50",
              },
              {
                icon: Clock,
                title: "Office Hours",
                lines: ["Mon – Sat: 10:00 AM – 6:00 PM", "Sunday: By Appointment Only"],
                color: "text-amber-600 bg-amber-50",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 shadow-sm">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-navy-900 text-sm mb-1">{item.title}</div>
                  {item.lines.map((l, li) => (
                    <div key={li} className="text-gray-500 text-sm">{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h3 className="font-serif font-bold text-navy-900 text-xl mb-6">Send Us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Mobile Number *"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Subject"
                  placeholder="Brief subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <Textarea
                label="Your Message *"
                placeholder="Describe your legal matter briefly..."
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <Button type="submit" variant="default" size="lg" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Message</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
