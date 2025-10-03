import { describe, it, expect } from 'vitest';
import { getAllPosts, getPostBySlug } from '@/lib/posts';

describe('Posts Library', () => {
  it('should return published posts only', async () => {
    const posts = await getAllPosts();
    
    expect(posts).toBeInstanceOf(Array);
    expect(posts.every(post => post.published)).toBe(true);
    expect(posts.every(post => typeof post.slug === 'string')).toBe(true);
    expect(posts.every(post => typeof post.title === 'string')).toBe(true);
  });

  it('should return a post by slug', async () => {
    const post = await getPostBySlug('getting-started');
    
    expect(post).toBeDefined();
    expect(post?.title).toBe('Getting Started with Modern Web Development');
    expect(post?.published).toBe(true);
  });

  it('should return null for non-existent posts', async () => {
    const post = await getPostBySlug('non-existent-post');
    
    expect(post).toBeNull();
  });

  it('should not return unpublished posts by slug', async () => {
    // This test assumes we might have unpublished posts in the future
    const post = await getPostBySlug('unpublished-draft');
    
    expect(post).toBeNull();
  });
});