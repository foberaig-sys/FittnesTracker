import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent ruft AppRegistry.registerComponent('main', () => App) auf
// und richtet die Umgebung für Expo Go und native Builds ein.
registerRootComponent(App);
