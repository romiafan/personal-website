export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  published: boolean;
}

// Sample posts registry - replace with filesystem scan or CMS integration
const POSTS: BlogPost[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started with Modern Web Development',
    description: 'Setting up a TypeScript project with Next.js 15, Convex, and the latest tooling.',
    date: '2025-10-01',
    tags: ['typescript', 'nextjs', 'convex'],
    published: true,
  },
  // Add more posts here
];

export async function getAllPosts(): Promise<BlogPost[]> {
  return POSTS.filter(post => post.published);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return POSTS.find(post => post.slug === slug && post.published) || null;
}