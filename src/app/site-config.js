const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000");

export const siteUrl = new URL(configuredUrl);

export const siteConfig = {
  name: "Westhood®",
  clubName: "Westhood® Club",
  title: "Westhood® Club | Drop 001 Private Access",
  description:
    "Westhood® is an independent West Coast lifestyle label built around limited drops, vintage sport energy and pieces made to be worn forever. Join the waitlist for early access to Drop 001.",
  shortDescription:
    "Join the Westhood® waitlist for early access to Drop 001.",
  url: siteUrl,
};
