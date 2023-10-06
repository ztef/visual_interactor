const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: '/images',
    extraResource: "config/"
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        certificateFile: './certificate.pfx',
        certificatePassword: process.env.CERTIFICATE_PASSWORD
       
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const src = path.join(__dirname, './config/');
      const dst = buildPath;
      fs.cpSync(src, dst, {recursive: true});
    }
  }
};
