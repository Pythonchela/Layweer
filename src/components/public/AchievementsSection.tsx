import React from "react";
import { Trophy, Star, Scale, Award } from "lucide-react";

const achievements = [
  {
    year: "2023",
    title: "Top Criminal Defense Attorney",
    body: "Bihar Bar Council",
    desc: "Recognized for outstanding defense advocacy and landmark acquittals.",
    icon: Trophy,
  },
  {
    year: "2021",
    title: "Best Law Firm – Bihar",
    body: "Legal Excellence Awards",
    desc: "Awarded for client satisfaction, case outcomes, and legal innovation.",
    icon: Award,
  },
  {
    year: "2018",
    title: "Landmark PIl – Environment",
    body: "Patna High Court",
    desc: "Filed landmark PIL leading to major environmental regulation in Bihar.",
    icon: Scale,
  },
  {
    year: "2015",
    title: "Pro Bono Champion",
    body: "Supreme Court Bar Association",
    desc: "Commended for providing free legal aid to over 500 underprivileged clients.",
    icon: Star,
  },
  {
    year: "2010",
    title: "Distinguished Advocate",
    body: "Bar Council of India",
    desc: "Recognized for 15 years of distinguished service to the legal profession.",
    icon: Award,
  },
  {
    year: "2005",
    title: "Young Achiever Award",
    body: "Bihar Advocates Association",
    desc: "For exceptional performance and leadership in legal practice.",
    icon: Star,
  },
];

export default function AchievementsSection() {
  return (
    <section id="achievements" className="py-20 bg-navy-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 text-gold-400 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-gold-500/20">
            <Trophy className="w-4 h-4" /> Recognition & Awards
          </div>
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            Our Achievements
          </h2>
          <div className="w-16 h-1 bg-gold-500 mx-auto my-4 rounded-full" />
          <p className="text-gray-400 max-w-2xl mx-auto">
            Decades of hard work, landmark victories, and unwavering commitment to justice have
            earned us some of the most prestigious recognitions in the legal field.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((a, i) => (
            <div
              key={i}
              className="bg-navy-800/50 border border-navy-700/50 rounded-2xl p-6 hover:border-gold-500/30 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold-500/20 transition-colors">
                  <a.icon className="w-6 h-6 text-gold-400" />
                </div>
                <div className="flex-1">
                  <div className="text-gold-400 text-xs font-semibold mb-1">{a.year}</div>
                  <h3 className="text-white font-semibold text-base mb-1">{a.title}</h3>
                  <div className="text-gray-400 text-xs mb-2 font-medium">{a.body}</div>
                  <p className="text-gray-500 text-sm leading-relaxed">{a.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
