
// Clerk + Convex auth integration configuration.
// Ensure you have set the Clerk JWT template named 'convex'.
// Required environment variables at runtime:
//   CLERK_JWT_ISSUER (e.g. https://example.clerk.accounts.dev or prod domain)
// Alternatively Convex can infer issuer from the token, but explicit issuer list helps validation.

const issuer = process.env.CLERK_JWT_ISSUER;

if (!issuer) {
  // During build, we can't console.warn reliably here for serverless, but leaving a note.
  // A runtime warning will be emitted by the client provider if missing.
}

const authConfig = {
  providers: [
    {
      domain: issuer || "",
      applicationID: "convex", // must match Clerk JWT template name
    },
  ].filter(p => p.domain),
};

export default authConfig;
