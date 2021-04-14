import Vue from 'vue'
import App from './App.vue'

// If you want to use Sentry for your error reporting, add your Sentry DSN configuration here.
import * as Sentry from '@sentry/electron';
Sentry.init({ dsn: "https://5850a8985d82487c9f2267fc830502a0@o571790.ingest.sentry.io/5720454" });

const Storage = require('electron-store');

// We keep our main storage as a global variable
// so that it's automatically available in all
// our components
window.mainStorage = new Storage({
    watch: true,
    defaults: {
        email: '',
        licenseKey: ''
    }
});

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
