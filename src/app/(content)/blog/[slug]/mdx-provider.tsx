"use client";

import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/mdx-components";

interface MDXProviderProps {
  content: string;
}

export function MDXProvider({ content }: MDXProviderProps) {
  return <MDXRemote source={content} components={mdxComponents} />;
}
