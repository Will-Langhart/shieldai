const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure packages are resolved correctly
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@services/') || moduleName.startsWith('@types/') || moduleName.startsWith('@ui/')) {
    const packageName = moduleName.split('/')[0];
    const restPath = moduleName.substring(packageName.length + 1);
    const packagePath = path.resolve(workspaceRoot, 'packages', packageName.substring(1), 'src', restPath);
    return {
      filePath: packagePath,
      type: 'sourceFile',
    };
  }
  // Let Metro handle other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });


