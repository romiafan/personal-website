import { Hero } from "@/components/views/Hero";
import { Projects } from "@/components/views/Projects";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Projects />
    </div>
  );
}
