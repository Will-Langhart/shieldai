module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      ['module-resolver', {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@services': '../../packages/services/src',
          '@types': '../../packages/types/src',
          '@ui': '../../packages/ui/src',
        }
      }]
    ]
  };
};


