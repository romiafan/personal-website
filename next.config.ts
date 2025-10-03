import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  // Future custom config goes here
  pageExtensions: ['tsx', 'ts', 'mdx'],
};

export default withMDX(nextConfig);
