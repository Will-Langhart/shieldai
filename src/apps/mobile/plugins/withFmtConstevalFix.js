/**
 * Expo config plugin: fix the {fmt} C++20 `consteval` build error under Xcode 26 /
 * Apple clang. fmt/base.h has no #ifndef guard and unconditionally sets
 * FMT_USE_CONSTEVAL 1 for recent Apple clang, so a -D override doesn't stick and
 * `FMT_STRING(...)` fails to compile (used transitively via Folly/JSI/glog).
 *
 * This injects a snippet into the generated ios/Podfile `post_install` hook that
 * patches Pods/fmt/include/fmt/base.h at `pod install` time so ALL Apple clang
 * versions fall back to constexpr (FMT_USE_CONSTEVAL 0). It runs during
 * `expo prebuild`, so it re-applies automatically after `expo prebuild --clean`.
 *
 * Remove this once React Native pulls in an fmt release that builds cleanly on
 * Xcode 26 without the override.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# fmt-consteval-fix (withFmtConstevalFix plugin)';

const SNIPPET = `
    ${MARKER}
    fmt_base_h = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base_h)
      _fmt_c = File.read(fmt_base_h)
      _fmt_p = _fmt_c.gsub('defined(__apple_build_version__) && __apple_build_version__ < 14000029L', 'defined(__apple_build_version__)')
      if _fmt_p != _fmt_c
        File.write(fmt_base_h, _fmt_p)
        Pod::UI.puts '[fmt-consteval-fix] Forced FMT_USE_CONSTEVAL=0 for Apple clang'
      end
    end
`;

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(MARKER)) {
        return config;
      }

      // Insert right after the post_install block opens.
      const anchor = 'post_install do |installer|';
      const idx = contents.indexOf(anchor);
      if (idx === -1) {
        throw new Error(
          '[withFmtConstevalFix] Could not find `post_install do |installer|` in the Podfile.'
        );
      }
      const insertAt = idx + anchor.length;
      contents = contents.slice(0, insertAt) + '\n' + SNIPPET + contents.slice(insertAt);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
