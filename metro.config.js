const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for 3D model file formats
config.resolver.assetExts.push(
  'glb',
  'gltf',
  'obj',
  'mtl',
  'fbx'
);

module.exports = config;
