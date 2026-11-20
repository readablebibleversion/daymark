// Extends app.json. Set BASE_URL (e.g. "/daymark") when the web build is hosted in a subfolder,
// like GitHub Pages project sites. Leave it unset for local dev and root hosting.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    ...(process.env.BASE_URL ? { baseUrl: process.env.BASE_URL } : {}),
  },
});
