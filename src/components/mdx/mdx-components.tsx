import Image, { ImageProps } from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes, AnchorHTMLAttributes } from "react";

// Custom image component for MDX
function MdxImage(props: ImageProps) {
  return (
    <Image
      {...props}
      alt={props.alt || ""}
      className={cn("rounded-lg border border-border", props.className)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Custom link component for MDX
function MdxLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith("/") || href?.startsWith("#");

  if (isInternal) {
    return (
      <Link
        href={href || ""}
        {...props}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
      {...props}
    >
      {children}
    </a>
  );
}

// Code block component
function CodeBlock({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg border bg-muted p-4 text-sm",
        className
      )}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}

// Inline code component
function InlineCode({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code className="rounded bg-muted px-2 py-1 text-sm font-mono" {...props}>
      {children}
    </code>
  );
}

// Blockquote component
function Blockquote({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className="border-l-4 border-primary/30 pl-6 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  );
}

// Table components
function Table({ children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border" {...props}>
        {children}
      </table>
    </div>
  );
}

function TableHeader({
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="border border-border bg-muted/50 px-4 py-2 text-left font-semibold"
      {...props}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className="border border-border px-4 py-2" {...props}>
      {children}
    </td>
  );
}

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export const mdxComponents = {
  // Override default HTML elements
  h1: ({ children, ...props }: HeadingProps) => (
    <h1
      className="mb-6 text-4xl font-bold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HeadingProps) => (
    <h2
      className="mb-4 mt-8 text-3xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HeadingProps) => (
    <h3
      className="mb-3 mt-6 text-2xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: HeadingProps) => (
    <h4
      className="mb-2 mt-4 text-xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: HeadingProps) => (
    <h5
      className="mb-2 mt-4 text-lg font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: HeadingProps) => (
    <h6
      className="mb-2 mt-4 text-base font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="mb-4 leading-7 text-foreground [&:not(:first-child)]:mt-6"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  blockquote: Blockquote,
  hr: ({ ...props }: HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-border" {...props} />
  ),
  a: MdxLink,
  img: (props: Record<string, unknown>) => (
    <MdxImage {...(props as ImageProps)} />
  ),
  Image: MdxImage,
  pre: CodeBlock,
  code: InlineCode,
  table: Table,
  th: TableHeader,
  td: TableCell,
  strong: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
};
