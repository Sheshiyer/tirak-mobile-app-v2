// app.config.js — extends app.json with runtime env vars for PostHog
// Environment variables are read at build time via process.env.
const baseConfig = require('./app.json');

module.exports = {
  ...baseConfig.expo,
  extra: {
    ...baseConfig.expo.extra,
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
  },
};
