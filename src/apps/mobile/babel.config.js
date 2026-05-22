module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      ['module-resolver', {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@services/mobile-api': '../../src/shared/services_mobile-api',
          '@types': '../../src/shared/types_index',
          '@ui': '../../src/shared/ui_index',
        }
      }]
    ]
  };
};


