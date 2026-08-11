module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4: `nativewind/babel` is a PRESET (not a plugin), and
    // babel-preset-expo needs jsxImportSource set to nativewind.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      ['module-resolver', {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@services/mobile-api': '../../shared/services_mobile-api',
          '@types': '../../shared/types_index',
          '@ui': '../../shared/ui_index',
        }
      }]
    ]
  };
};


