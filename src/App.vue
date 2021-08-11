<template>
  <div class="h-full w-full flex flex-col">
    <!-- <Licensing
      v-if="! hasValidLicense"
    /> -->

    <section class="flex justify-between items-center bg-gray-300 p-2 shadow-md mb-1 text-sm">
      <div class="flex items-center">
        <div class="inline-block relative w-32 mr-6">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg class="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          </div>

          <select
            v-model="instanceFilter"
            class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 py-2 px-10 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="0"> tutti</option>
            <option v-for="instance in instances" :key="instance.id" :value="instance.id">{{ instance.name }}</option>
          </select>

          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <div class="flex items-center">

          <label class="flex items-center mr-4">
            <input v-model="filter_types" type="checkbox" class="checkbox mr-2" value="error"> Errori
          </label>

          <label class="flex items-center mr-4">
            <input v-model="filter_types" type="checkbox" class="checkbox mr-2" value="new"> File
          </label>

          <label class="flex items-center">
            <input v-model="filter_types" type="checkbox" class="checkbox mr-2" value="success"> Completati
          </label>

        </div>
      </div>

      <div>
        <button
          @click.prevent="resetEventLogs"
          class="text-gray-800 px-4 py-2 hover:bg-gray-400 rounded hover:text-gray-700 w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div class="text-gray-500">
        v.{{ appVersion }}
      </div>
    </section>

    <div>
      <event-item v-for="(event, index) in filteredEvents" :key="index" :event="event" />
    </div>

    <div v-if="!filteredEvents.length" class="italic p-4 flex items-center justify-center text-gray-500 h-full">

      <div class="-mt-12">
        <svg class="w-16 h-16 mx-auto opacity-25 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>

        <div>
          Ancora nessuna voce...
        </div>
      </div>

    </div>

    <div v-html="serials"></div>
    <div v-html="output"></div>

  </div>
</template>

<script>
import EventItem from './components/EventItem.vue'
// import Licensing from './components/Licensing';
// import licenseCheck from './mixins/licensing';
// import HID from 'node-hid';
import net from 'net'
import axios from 'axios'
import escpos from 'escpos'
escpos.Network = require('escpos-network');

// import SerialPort from 'serialport'
const isDevelopment = process.env.NODE_ENV !== 'production'

export default {
  name: 'App',
  mixins: [
    // licenseCheck
  ],
  components: {
    EventItem,
    // Licensing,
  },

  data() {
    return {
      devices: [],
      device: null,
      output: null,
      serials: null,
      client: null,
      appVersion: window.require('electron').remote.app.getVersion(),
      instanceFilter: 0,
      filter_types: [],
      isAdmin: false,
      instances: [
        {name: 'Fango', id: 'fango', printerIp: '192.168.1.156', readerIp: '192.168.1.210', },
        {name: 'Inalazioni', id: 'inalazioni', printerIp: '192.168.1.98', readerIp: '192.168.1.205', },
      ],
      events: [],
    }
  },

  computed: {
    filteredEvents() {
      return this.events.filter(event => this.instanceFilter != 0 ? event.instance.id === this.instanceFilter : true)
        .filter(event => this.filter_types.length ? this.filter_types.includes(event.type) : true)
    },
  },

  mounted() {
    this.startClients()
    this.startServer()

    this.events = mainStorage.get('eventLogs');

    mainStorage.onDidChange('eventLogs', (newValue) => this.events = newValue)
  },

  methods: {

    resetEventLogs() {
      mainStorage.set('eventLogs', [])
    },

    startClients() {
      this.instances.forEach(instance => this.startClient(instance));
    },

    startClient(instance) {
      let vm = this;
      let client = new net.Socket();
      // client.setEncoding('utf8');
      client.connect(
        2001,
        instance.readerIp,
        () => vm.log(instance, 'Connesso')
        //  client.write('Hello, server! Love, Client.');
      );

      client.on('data', (data) => {
        let barcode = data.toString('utf8');

        vm.log(instance, `Lettura Barcode: ${barcode}`);

        vm.charge(barcode, instance);
        // client.destroy(); // kill client after server's response
      });

      client.on('close', () => {
        vm.log(instance, `Disconnesso`);
      });
    },

    startServer() {
      var server = net.createServer(function(socket) {
        socket.write('Echo server\r\n');
        socket.pipe(socket);
      });

      server.listen(50710, '127.0.0.1');
    },

    charge(barcode, instance) {
      axios.post((isDevelopment ? 'http://local.hldv.test' : 'https://local.hldv.it') + '/api/electron/card-reader/' + instance.id, {
            card: barcode.substring(1),
            token: 'CWMucJ7Ha2bKJVfmhFLD2KZbPddafdsgGFmJ5kvmvNXdbsS2c7AxGAyuhQGY2MfMZY8XsA',
          })
          .then(({data}) => {
            this.log(instance, 'Addebitato: ' + data.header, data, 'success')
            this.sendToPrinter(data, instance)
          })
          .catch(error => this.log(instance, error.response.data.errors.data.join(' '), error, 'error'))
    },

    sendToPrinter(data, instance) {
        let networkDevice = new escpos.Network(instance.printerIp);

        if (networkDevice) {
          networkDevice.open((error) => {
            if (error) return this.log(instance, 'Stampante non connessa', 'error');

            let printer = new escpos.Printer(networkDevice, {});

            printer
                .size(1, 1)
                .text(data.date)
                .text(data.header)
                .text(data.items)
                .text('---------------------------')
                .text(data.message)
                .feed()
                .feed()
                .cut()
                .close();

            this.log(instance, 'Stampato: ' + data.header, data, 'success')

          });
        }
    },

    log(instance, message, data, type = 'info') {
      var eventLogs = mainStorage.get('eventLogs', [])
      eventLogs.push({instance, data, message, type, date: new Date()})
      mainStorage.set('eventLogs', eventLogs);
    },
  }
}
</script>

<!-- Load Tailwind -->
<style src="./assets/css/tailwind.css"></style>

<style>
html, body {
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>