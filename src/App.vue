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
            v-model="filter"
            class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 py-2 px-10 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="0"> tutti</option>
            <option v-for="instance in instances" :key="instance.name" :value="instance.name">{{ instance.name }}</option>
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
          v-if="isAdmin"
          @click.prevent="resetLog"
          class="text-gray-800 px-4 py-2 hover:bg-gray-400 rounded hover:text-gray-700 w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div class="text-gray-500">
        v.{{appVersion}}
      </div>
    </section>


    <div v-for="(event, index) in filteredEvents" :key="index" :class="logColor(event)" class="border-b px-2 py-1 flex items-center">
      <div class="text-gray-700 mr-4 text-xs w-26" :class="logColor(event)">
        {{ event.date | formatDate }}
      </div>

      <div class="font-semibold text-xs mr-2 w-16">
        {{ event.instance }}
      </div>

      <div class="flex-1 leading-none text-sm flex items-center">
        <div class="uppercase mr-2 font-semibold" v-if="event.type === 'error'">
          {{ event.type }}
        </div>
        {{ event.message }}
      </div>
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
// import HelloWorld from './components/HelloWorld.vue'
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
  filters: {
    formatDate(timestamp) {
      const monthNames = [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre"
      ];

      let date = new Date(timestamp);

      return ('00' + date.getDate()).slice(-2) + ' ' +
        monthNames[date.getMonth()].slice(0, -4) + '. ' +
        ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2)
    }
  },
  mixins: [
    // licenseCheck
  ],
  components: {
    // HelloWorld,
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
      filter: 0,
      filter_types: [],
      isAdmin: false,
      instances: [
        {name: 'Fango'}
      ],
      events: [],
    }
  },

  computed: {
    filteredEvents() {
      return this.events.filter(event => this.filter != 0 ? event.instance === this.filter : true)
        .filter(event => this.filter_types.length ? this.filter_types.includes(event.type) : true)
    },
  },

  mounted() {
    this.startClient()
    this.startServer()

    this.events = mainStorage.get('eventLogs');

    mainStorage.onDidChange('eventLogs', (newValue) => this.events = newValue)
  },

  methods: {

    startClient() {
      let vm = this;
      this.client = new net.Socket();
      // this.client.setEncoding('utf8');
      this.client.connect(2001, '192.168.1.210', function() {
        vm.log('Connesso')
        //  this.client.write('Hello, server! Love, Client.');
      });

      this.client.on('data', function(data) {
        let barcode = data.toString('utf8');

        vm.log(`Lettura Barcode: ${barcode}`);

        vm.charge(barcode);
        // client.destroy(); // kill client after server's response
      });

       this.client.on('close', function() {
         vm.log(`Disconnesso`);
      });
    },

    startServer() {
      var server = net.createServer(function(socket) {
        socket.write('Echo server\r\n');
        socket.pipe(socket);
      });

      server.listen(50710, '127.0.0.1');
    },

    charge(barcode) {
      axios.post((isDevelopment ? 'http://local.hldv.test' : 'https://local.hldv.it') + '/api/electron/card-reader/fango', {
            card: barcode.substring(1),
            token: 'CWMucJ7Ha2bKJVfmhFLD2KZbPddafdsgGFmJ5kvmvNXdbsS2c7AxGAyuhQGY2MfMZY8XsA',
          })
          .then(({data}) => {
            this.log('Addebitato: ' + data.heeader, data)
            this.sendToPrinter(data)
          })
          .catch(error => {
            this.log(error.response.data.errors.data.join(' '), error, 'error')
          })
    },

    sendToPrinter(data) {
        // inalazioni .98
        let networkDevice = new escpos.Network('192.168.1.156');

        if (networkDevice) {
          networkDevice.open((error) => {
            if (error) return this.log('Stampante non connessa');

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

            this.log('Stampato: ' + data.header, data)

          });
        }
    },

    log(message, data, type = 'success') {
      var eventLogs = mainStorage.get('eventLogs', [])
      eventLogs.push({data, message, type, date: new Date()})
      mainStorage.set('eventLogs', eventLogs);
    },

    logColor(event) {
      let color = '';

      switch (event.type) {
        case 'error':
          color = 'text-red-800 bg-red-100';

          break;
        case 'info':
          color = 'text-blue-800 bg-blue-100';

          break;

        default:
          break;
      }

      return color;
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