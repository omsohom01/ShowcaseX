// Loads private .env variables into Expo config (extra)
// NOTE: Anything placed in `extra` becomes readable by the client bundle.
require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      HF_API_KEY: process.env.HF_API_KEY,
    },
  };
};
