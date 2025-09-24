export function Projects() {
  return (
    <section id="projects" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              My Projects
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Here are some of the projects I've worked on. More content coming soon!
            </p>
          </div>
          {/* Placeholder for future project cards */}
          <div className="w-full max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Project placeholders */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center space-y-2 border-gray-800 p-4 rounded-lg bg-background border"
                >
                  <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Project {i}</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="font-bold">Project Title {i}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Project description coming soon...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}