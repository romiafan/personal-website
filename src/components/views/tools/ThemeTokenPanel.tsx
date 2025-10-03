"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Palette, Type, Layout, Check, Eye } from "lucide-react";

interface TokenGroup {
  name: string;
  description: string;
  tokens: Array<{
    name: string;
    value: string;
    cssVar: string;
    preview?: "color" | "text" | "spacing" | "shadow";
  }>;
}

export function ThemeTokenPanel() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "colors" | "typography" | "spacing" | "shadows"
  >("colors");

  const copyToClipboard = async (text: string, tokenName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(tokenName);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const colorTokens: TokenGroup[] = [
    {
      name: "Base Colors",
      description: "Fundamental color tokens for backgrounds and borders",
      tokens: [
        {
          name: "Background",
          value: "hsl(var(--background))",
          cssVar: "--background",
          preview: "color",
        },
        {
          name: "Foreground",
          value: "hsl(var(--foreground))",
          cssVar: "--foreground",
          preview: "color",
        },
        {
          name: "Card",
          value: "hsl(var(--card))",
          cssVar: "--card",
          preview: "color",
        },
        {
          name: "Card Foreground",
          value: "hsl(var(--card-foreground))",
          cssVar: "--card-foreground",
          preview: "color",
        },
        {
          name: "Popover",
          value: "hsl(var(--popover))",
          cssVar: "--popover",
          preview: "color",
        },
        {
          name: "Popover Foreground",
          value: "hsl(var(--popover-foreground))",
          cssVar: "--popover-foreground",
          preview: "color",
        },
      ],
    },
    {
      name: "Interactive Colors",
      description: "Colors for buttons, links, and interactive elements",
      tokens: [
        {
          name: "Primary",
          value: "hsl(var(--primary))",
          cssVar: "--primary",
          preview: "color",
        },
        {
          name: "Primary Foreground",
          value: "hsl(var(--primary-foreground))",
          cssVar: "--primary-foreground",
          preview: "color",
        },
        {
          name: "Secondary",
          value: "hsl(var(--secondary))",
          cssVar: "--secondary",
          preview: "color",
        },
        {
          name: "Secondary Foreground",
          value: "hsl(var(--secondary-foreground))",
          cssVar: "--secondary-foreground",
          preview: "color",
        },
        {
          name: "Accent",
          value: "hsl(var(--accent))",
          cssVar: "--accent",
          preview: "color",
        },
        {
          name: "Accent Foreground",
          value: "hsl(var(--accent-foreground))",
          cssVar: "--accent-foreground",
          preview: "color",
        },
      ],
    },
    {
      name: "State Colors",
      description: "Colors for different UI states and feedback",
      tokens: [
        {
          name: "Muted",
          value: "hsl(var(--muted))",
          cssVar: "--muted",
          preview: "color",
        },
        {
          name: "Muted Foreground",
          value: "hsl(var(--muted-foreground))",
          cssVar: "--muted-foreground",
          preview: "color",
        },
        {
          name: "Destructive",
          value: "hsl(var(--destructive))",
          cssVar: "--destructive",
          preview: "color",
        },
        {
          name: "Destructive Foreground",
          value: "hsl(var(--destructive-foreground))",
          cssVar: "--destructive-foreground",
          preview: "color",
        },
        {
          name: "Border",
          value: "hsl(var(--border))",
          cssVar: "--border",
          preview: "color",
        },
        {
          name: "Input",
          value: "hsl(var(--input))",
          cssVar: "--input",
          preview: "color",
        },
        {
          name: "Ring",
          value: "hsl(var(--ring))",
          cssVar: "--ring",
          preview: "color",
        },
      ],
    },
  ];

  const typographyTokens: TokenGroup[] = [
    {
      name: "Font Families",
      description: "Typography font stack definitions",
      tokens: [
        {
          name: "Sans",
          value: "var(--font-geist-sans)",
          cssVar: "--font-geist-sans",
          preview: "text",
        },
        {
          name: "Mono",
          value: "var(--font-geist-mono)",
          cssVar: "--font-geist-mono",
          preview: "text",
        },
      ],
    },
  ];

  const spacingTokens: TokenGroup[] = [
    {
      name: "Layout Spacing",
      description: "Common spacing values used throughout the design system",
      tokens: [
        { name: "1", value: "0.25rem", cssVar: "", preview: "spacing" },
        { name: "2", value: "0.5rem", cssVar: "", preview: "spacing" },
        { name: "3", value: "0.75rem", cssVar: "", preview: "spacing" },
        { name: "4", value: "1rem", cssVar: "", preview: "spacing" },
        { name: "6", value: "1.5rem", cssVar: "", preview: "spacing" },
        { name: "8", value: "2rem", cssVar: "", preview: "spacing" },
        { name: "12", value: "3rem", cssVar: "", preview: "spacing" },
        { name: "16", value: "4rem", cssVar: "", preview: "spacing" },
      ],
    },
  ];

  const shadowTokens: TokenGroup[] = [
    {
      name: "Shadows",
      description: "Box shadow definitions for depth and elevation",
      tokens: [
        {
          name: "SM",
          value: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          cssVar: "",
          preview: "shadow",
        },
        {
          name: "Default",
          value:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          cssVar: "",
          preview: "shadow",
        },
        {
          name: "MD",
          value:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          cssVar: "",
          preview: "shadow",
        },
        {
          name: "LG",
          value:
            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          cssVar: "",
          preview: "shadow",
        },
        {
          name: "XL",
          value:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          cssVar: "",
          preview: "shadow",
        },
      ],
    },
  ];

  const getTokensByTab = () => {
    switch (activeTab) {
      case "colors":
        return colorTokens;
      case "typography":
        return typographyTokens;
      case "spacing":
        return spacingTokens;
      case "shadows":
        return shadowTokens;
      default:
        return colorTokens;
    }
  };

  const renderTokenPreview = (token: TokenGroup["tokens"][0]) => {
    switch (token.preview) {
      case "color":
        return (
          <div
            className="w-8 h-8 rounded border border-border/60 shadow-sm"
            style={{ backgroundColor: token.value }}
          />
        );
      case "text":
        return (
          <div
            className="px-3 py-1 text-sm rounded bg-muted"
            style={{ fontFamily: token.value }}
          >
            Ag
          </div>
        );
      case "spacing":
        return (
          <div className="flex items-center">
            <div
              className="bg-primary rounded"
              style={{ width: token.value, height: "8px" }}
            />
            <span className="text-xs text-muted-foreground ml-2">
              {token.value}
            </span>
          </div>
        );
      case "shadow":
        return (
          <div
            className="w-8 h-8 rounded bg-background border border-border/60"
            style={{ boxShadow: token.value }}
          />
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: "colors" as const, label: "Colors", icon: Palette },
    { id: "typography" as const, label: "Typography", icon: Type },
    { id: "spacing" as const, label: "Spacing", icon: Layout },
    { id: "shadows" as const, label: "Shadows", icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Theme Token Panel</h3>
        <p className="text-sm text-muted-foreground">
          Explore and copy design system tokens. Click any token to copy its CSS
          value.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Token Groups */}
      <div className="space-y-6">
        {getTokensByTab().map((group, groupIndex) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="space-y-3"
          >
            <div>
              <h4 className="font-medium text-foreground">{group.name}</h4>
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>

            <div className="grid gap-2">
              {group.tokens.map((token, tokenIndex) => (
                <motion.button
                  key={token.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.1 + tokenIndex * 0.05 }}
                  onClick={() =>
                    copyToClipboard(token.cssVar || token.value, token.name)
                  }
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card/40 backdrop-blur hover:bg-card/60 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    {renderTokenPreview(token)}
                    <div className="text-left">
                      <div className="font-medium text-sm">{token.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {token.cssVar || token.value}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {copiedToken === token.name ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center space-x-1 text-green-500"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-xs">Copied!</span>
                      </motion.div>
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Usage Examples */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-lg border border-border/60 bg-muted/30"
      >
        <h4 className="font-medium mb-2">Usage Examples</h4>
        <div className="space-y-2 text-sm text-muted-foreground font-mono">
          <div>
            CSS:{" "}
            <code className="bg-background px-1 py-0.5 rounded">
              color: hsl(var(--primary));
            </code>
          </div>
          <div>
            Tailwind:{" "}
            <code className="bg-background px-1 py-0.5 rounded">
              bg-primary text-primary-foreground
            </code>
          </div>
          <div>
            CSS Variable:{" "}
            <code className="bg-background px-1 py-0.5 rounded">
              var(--font-geist-sans)
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
