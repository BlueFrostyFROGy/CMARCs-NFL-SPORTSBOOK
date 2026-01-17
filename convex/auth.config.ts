export default {
  providers: [
    {
      domain: "https://cmarcsnflsportsbook.vercel.app",
      applicationID: "convex",
    },
  ],
  session: {
    absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
};
