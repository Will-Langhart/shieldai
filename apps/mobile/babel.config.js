module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@services': '../../packages/services',
          '@types': '../../packages/types',
          '@ui': '../../packages/ui',
        }
      }]
    ]
  };
};


