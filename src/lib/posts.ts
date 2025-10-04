import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  published: boolean;
  readingTime?: string;
  content?: string;
}

interface FrontMatter {
  title: string;
  description?: string;
  date: string;
  tags?: string[];
  published?: boolean;
}

const postsDirectory = path.join(process.cwd(), 'src/app/(content)/blog');

function getMDXFiles(): string[] {
  try {
    const files = fs.readdirSync(postsDirectory);
    return files.filter(file => path.extname(file) === '.mdx');
  } catch {
    console.warn('Blog posts directory not found, returning empty array');
    return [];
  }
}

function readMDXFile(filePath: string): { frontMatter: FrontMatter; content: string } {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(rawContent);
  
  return {
    frontMatter: data as FrontMatter,
    content,
  };
}

function getMDXData(file: string): BlogPost | null {
  const slug = path.basename(file, path.extname(file));
  const filePath = path.join(postsDirectory, file);
  
  try {
    const { frontMatter, content } = readMDXFile(filePath);
    
    // Validate required fields
    if (!frontMatter.title || !frontMatter.date) {
      console.warn(`Blog post ${file} is missing required frontmatter fields`);
      return null;
    }
    
    return {
      slug,
      title: frontMatter.title,
      description: frontMatter.description || '',
      date: frontMatter.date,
      tags: frontMatter.tags || [],
      published: frontMatter.published !== false, // Default to true if not specified
      readingTime: readingTime(content).text,
      content,
    };
  } catch (error) {
    console.error(`Error reading blog post ${file}:`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const files = getMDXFiles();
  const posts = files
    .map(getMDXData)
    .filter((post): post is BlogPost => post !== null)
    .filter(post => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return posts;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const files = getMDXFiles();
  const file = files.find(f => path.basename(f, path.extname(f)) === slug);
  
  if (!file) {
    return null;
  }
  
  const post = getMDXData(file);
  return post && post.published ? post : null;
}

// Development helper - get all posts including drafts
export async function getAllPostsIncludingDrafts(): Promise<BlogPost[]> {
  if (process.env.NODE_ENV !== 'development') {
    return getAllPosts();
  }
  
  const files = getMDXFiles();
  const posts = files
    .map(getMDXData)
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return posts;
}