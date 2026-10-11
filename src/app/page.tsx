import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import HeroSection from "@/components/public/HeroSection";
import StatsSection from "@/components/public/StatsSection";
import AdvocateProfile from "@/components/public/AdvocateProfile";
import PracticeAreasGrid from "@/components/public/PracticeAreasGrid";
import AchievementsSection from "@/components/public/AchievementsSection";
import TestimonialsSection from "@/components/public/TestimonialsSection";
import NewsSection from "@/components/public/NewsSection";
import ContactSection from "@/components/public/ContactSection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-16">
        <HeroSection />
        <StatsSection />
        <AdvocateProfile />
        <PracticeAreasGrid />
        <AchievementsSection />
        <TestimonialsSection />
        <NewsSection />
        <ContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}
