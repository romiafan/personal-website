import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    html_url: v.string(),
    homepage: v.optional(v.string()),
    language: v.optional(v.string()),
    topics: v.array(v.string()),
    stargazers_count: v.number(),
    forks_count: v.number(),
    updated_at: v.string(),
    created_at: v.string(),
    private: v.boolean(),
    fork: v.boolean(),
  }),
  messages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    created_at: v.string(),
  }).searchIndex("by_email", { searchField: "email" }),
  auditLogs: defineTable({
    actor: v.string(), // user id or system
    action: v.string(), // e.g., 'github.sync'
    target: v.optional(v.string()), // optional target (e.g., username)
    count: v.optional(v.number()), // number of items affected
    status: v.string(), // success | error
    message: v.optional(v.string()),
    created_at: v.string(),
  }).index('by_action_time', ['action', 'created_at']),
});