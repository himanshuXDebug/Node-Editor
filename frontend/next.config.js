const webpack = require("webpack");

module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      http: false,
      https: false,
      stream: false,
      zlib: false,
      util: false,
      assert: false,
      url: false,
      crypto: false,
    };

    return config;
  },
};
