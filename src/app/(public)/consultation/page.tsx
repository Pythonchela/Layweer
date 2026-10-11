"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle,
  ArrowRight,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { PRACTICE_AREAS } from "@/lib/utils";

const timeSlots = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
];

const consultationTypes = [
  {
    id: "OFFLINE",
    icon: Users,
    title: "In-Person Consultation",
    desc: "Meet at our chambers in Patna",
    fee: "₹500",
    color: "border-navy-800 bg-navy-50",
  },
  {
    id: "ONLINE",
    icon: Video,
    title: "Online Consultation",
    desc: "Video call via Google Meet / Zoom",
    fee: "₹400",
    color: "border-green-600 bg-green-50",
  },
  {
    id: "PHONE",
    icon: Phone,
    title: "Phone Consultation",
    desc: "Telephonic discussion",
    fee: "₹300",
    color: "border-amber-600 bg-amber-50",
  },
];

export default function ConsultationPage() {
  const [advocates, setAdvocates] = useState<
    { id: string; name: string; designation: string; speciality: string }[]
  >([]);
  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((p) => setAdvocates(p.advocates || []))
      .catch(() => toast.error("Unable to load advocates"));
  }, []);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    consultationType: "OFFLINE",
    advocateId: "",
    practiceArea: "",
    date: "",
    slot: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
    } catch {
      toast.error("Unable to save appointment");
      setLoading(false);
      return;
    }
    setConfirmed(true);
    setLoading(false);
  };

  if (confirmed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-navy-900 mb-4">
            Appointment Request Saved
          </h2>
          <p className="text-gray-600 mb-6">
            Your request has been saved for the firm to review. Please contact
            the office for final confirmation. Contact number:{" "}
            <strong>{form.mobile}</strong>.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-8 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">{form.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-medium">{form.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time:</span>
              <span className="font-medium">{form.slot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium">{form.consultationType}</span>
            </div>
          </div>
          <Button
            onClick={() => {
              setConfirmed(false);
              setStep(1);
              setForm({
                name: "",
                mobile: "",
                email: "",
                city: "",
                consultationType: "OFFLINE",
                advocateId: "",
                practiceArea: "",
                date: "",
                slot: "",
                description: "",
              });
            }}
          >
            Book Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-navy-950 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Book a Consultation
          </h1>
          <div className="w-16 h-1 bg-gold-500 mx-auto my-4 rounded-full" />
          <p className="text-gray-300 text-lg">
            Schedule an appointment with our expert advocates — in person,
            online, or by phone.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* Steps */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors ${
                  step >= s
                    ? "bg-navy-800 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${step > s ? "bg-navy-800" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-10 -mt-8 px-1">
          <span>Your Details</span>
          <span className="ml-4">Consultation Type</span>
          <span>Advocate & Slot</span>
          <span>Confirm</span>
        </div>

        {/* Step 1 — Personal details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-bold text-navy-900">
              Your Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
              <Input
                label="Mobile Number *"
                placeholder="+91 XXXXX XXXXX"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <Input
                label="City"
                placeholder="Your city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Practice Area *
              </label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
                value={form.practiceArea}
                onChange={(e) => update("practiceArea", e.target.value)}
                required
              >
                <option value="">Select practice area...</option>
                {PRACTICE_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              label="Brief Description of Your Legal Matter *"
              placeholder="Describe your legal issue briefly..."
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (!form.name || !form.mobile || !form.practiceArea) {
                    toast.error("Please fill required fields");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Consultation type */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-bold text-navy-900">
              Consultation Type
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {consultationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => update("consultationType", type.id)}
                  className={`border-2 rounded-2xl p-5 text-left transition-all ${
                    form.consultationType === type.id
                      ? "border-navy-800 bg-navy-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <type.icon
                    className={`w-8 h-8 mb-3 ${form.consultationType === type.id ? "text-navy-800" : "text-gray-400"}`}
                  />
                  <div className="font-semibold text-navy-900 text-sm mb-1">
                    {type.title}
                  </div>
                  <div className="text-gray-500 text-xs mb-3">{type.desc}</div>
                  <div className="text-lg font-bold font-serif text-gold-600">
                    {type.fee}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Advocate + Date/Slot */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-bold text-navy-900">
              Select Advocate & Time Slot
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Advocate
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {advocates.map((adv) => (
                  <button
                    key={adv.id}
                    onClick={() => update("advocateId", adv.id)}
                    className={`border-2 rounded-xl p-4 text-left transition-all ${
                      form.advocateId === adv.id
                        ? "border-navy-800 bg-navy-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-navy-900 text-sm">
                      {adv.name}
                    </div>
                    <div className="text-xs text-gold-600 font-medium">
                      {adv.designation}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {adv.speciality}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" /> Select Date *
                </label>
                <Input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => update("date", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline w-4 h-4 mr-1" /> Select Time Slot *
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => update("slot", slot)}
                      className={`text-xs py-2 px-1 rounded-lg border transition-colors ${
                        form.slot === slot
                          ? "bg-navy-800 text-white border-navy-800"
                          : "border-gray-200 text-gray-700 hover:border-navy-400"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!form.advocateId || !form.date || !form.slot) {
                    toast.error("Please select all fields");
                    return;
                  }
                  setStep(4);
                }}
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Confirm */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-bold text-navy-900">
              Confirm Your Appointment
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
              {[
                ["Name", form.name],
                ["Mobile", form.mobile],
                ["Email", form.email || "—"],
                ["Practice Area", form.practiceArea],
                ["Consultation Type", form.consultationType],
                [
                  "Advocate",
                  advocates.find((a) => a.id === form.advocateId)?.name || "—",
                ],
                ["Date", form.date],
                ["Time Slot", form.slot],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-navy-900">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              By confirming, you agree to our privacy policy. Consultation fee
              is payable at the time of appointment.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="gold"
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "Confirm Appointment"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
