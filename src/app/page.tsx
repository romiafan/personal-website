import { Hero } from "@/components/views/Hero";
import { About } from "@/components/views/About";
import { Projects } from "@/components/views/Projects";
import { TechStack } from "@/components/views/TechStack";
import { Contact } from "@/components/views/Contact";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <About />
      <Projects />
      <TechStack />
      <Contact />
    </div>
  );
}
