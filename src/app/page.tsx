import Courses from "@/components/Courses";
import FaqAbout from "@/components/FaqAbout";
import Feedback from "@/components/Feedback";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import WorkProcess from "@/components/WorkProcess";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <Courses />
        <FaqAbout />
        <WorkProcess />
        <Feedback />
      </main>
      <Footer />
    </>
  );
}
