import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Tag, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/layout/Section";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXProvider } from "./mdx-provider";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Blog
              </Link>
            </div>

            <article>
              <header className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {post.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {post.readingTime && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {post.readingTime}
                    </div>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {post.description && (
                  <p className="text-xl text-muted-foreground">
                    {post.description}
                  </p>
                )}
              </header>

              <div className="border-t border-border pt-12">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <MDXProvider content={post.content || ""} />
                </div>
              </div>
            </article>
          </div>
        </div>
      </Section>
    </main>
  );
}
