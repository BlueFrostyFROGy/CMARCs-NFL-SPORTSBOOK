export default {
  providers: [
    {
      // Use dynamic domain from env; provided by Vercel build
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
