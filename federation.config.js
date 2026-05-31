const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({

  name: 'settings',

  exposes: {
    './Settings': './src/app/pages/settings/settings.component.ts',
    './SettingsWorkspace': './src/app/pages/settings/settings-workspace/settings-workspace.component.ts',
    './NotificationSettings': './src/app/pages/settings/notification-settings/notification-settings.component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  skip: [
    'monaco-editor',
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ]

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0
  
});
