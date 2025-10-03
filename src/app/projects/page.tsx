import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Github, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = {
  title: "Projects",
  description: "A showcase of hosted projects and web applications.",
};

interface HostedProject {
  id: string;
  title: string;
  description: string;
  url: string;
  githubUrl?: string;
  image?: string;
  technologies: string[];
  status: "live" | "development" | "coming-soon";
  featured?: boolean;
}

// Sample project data - replace with actual projects
const HOSTED_PROJECTS: HostedProject[] = [
  {
    id: "personal-website",
    title: "Personal Portfolio & Toolkit",
    description:
      "This very website! A modern personal portfolio with integrated developer tools, built with Next.js 15, Convex, and TypeScript.",
    url: "https://romiafan.dev",
    githubUrl: "https://github.com/romiafan/personal-website",
    technologies: [
      "Next.js",
      "TypeScript",
      "Convex",
      "Tailwind CSS",
      "Framer Motion",
    ],
    status: "live",
    featured: true,
  },
  {
    id: "sample-project-1",
    title: "Sample Web App",
    description:
      "A sample project placeholder. Replace this with your actual hosted projects.",
    url: "https://example.com",
    githubUrl: "https://github.com/username/repo",
    technologies: ["React", "Node.js", "PostgreSQL"],
    status: "development",
  },
  {
    id: "sample-project-2",
    title: "Another Project",
    description:
      "Another sample project. Add your real projects here with actual URLs and descriptions.",
    url: "https://example2.com",
    technologies: ["Vue.js", "Express", "MongoDB"],
    status: "coming-soon",
  },
];

function ProjectCard({ project }: { project: HostedProject }) {
  const getStatusColor = (status: HostedProject["status"]) => {
    switch (status) {
      case "live":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "development":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "coming-soon":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getStatusText = (status: HostedProject["status"]) => {
    switch (status) {
      case "live":
        return "Live";
      case "development":
        return "In Development";
      case "coming-soon":
        return "Coming Soon";
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
              {project.title}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {project.description}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`ml-4 ${getStatusColor(project.status)}`}
          >
            {getStatusText(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {project.status === "live" && (
            <Button asChild size="sm" className="flex-1">
              <Link
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Visit Site
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          )}

          {project.githubUrl && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                Code
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const liveProjects = HOSTED_PROJECTS.filter((p) => p.status === "live");
  const developmentProjects = HOSTED_PROJECTS.filter(
    (p) => p.status === "development"
  );
  const comingSoonProjects = HOSTED_PROJECTS.filter(
    (p) => p.status === "coming-soon"
  );

  return (
    <main className="min-h-screen">
      <Section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Projects</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A collection of web applications and projects I&apos;ve built
                and deployed. Each represents a different exploration in
                technology and design.
              </p>
            </div>

            {/* Live Projects */}
            {liveProjects.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Live Projects
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}

            {/* In Development */}
            {developmentProjects.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  In Development
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {developmentProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}

            {/* Coming Soon */}
            {comingSoonProjects.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Coming Soon
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comingSoonProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}

            {/* Call to Action */}
            <div className="text-center mt-16 p-8 rounded-lg bg-muted/50">
              <h3 className="text-xl font-semibold mb-4">
                Interested in Collaboration?
              </h3>
              <p className="text-muted-foreground mb-6">
                I&apos;m always open to discussing new projects and
                opportunities.
              </p>
              <Button asChild>
                <Link href="/#contact">Get In Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
