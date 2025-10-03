import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/layout/Section';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Thoughts on software engineering, technology, and building things.',
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen">
      <Section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Blog</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Thoughts on software engineering, technology, and building things.
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No posts yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid gap-8">
                {posts.map((post) => (
                  <Card key={post.slug} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">
                            <Link 
                              href={`/blog/${post.slug}`}
                              className="hover:underline"
                            >
                              {post.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-base">
                            {post.description}
                          </CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </CardHeader>
                    {post.tags && post.tags.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}
