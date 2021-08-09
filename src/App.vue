<template>
  <div class="h-full w-full flex flex-col">
    <!-- <Licensing
      v-if="! hasValidLicense"
    /> -->
    <div class="p-2 mb-4">
      v.{{appVersion}}
    </div>
    <div v-html="serials"></div>
    <div v-html="output"></div>

  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
// import Licensing from './components/Licensing';
// import licenseCheck from './mixins/licensing';
import HID from 'node-hid';
import net from 'net'
import axios from 'axios'
import escpos from 'escpos'
escpos.Network = require('escpos-network');

import SerialPort from 'serialport'
const isDevelopment = process.env.NODE_ENV !== 'production'

export default {
  name: 'App',
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
    }
  },

  mounted() {
    // this.devices = HID.devices()
    // this.getPorts()
    this.startClient()
  },

  methods: {

    startClient() {
      this.client = new net.Socket();
      // this.client.setEncoding('utf8');
      this.client.connect(2001, '192.168.1.210', function() {
        console.log('Connected');
        //  this.client.write('Hello, server! Love, Client.');
      });

      let vm = this;
      this.client.on('data', function(data) {
        console.log('Received: ',  data.toString('utf8'));
        // return 'ok';
        vm.charge(data.toString('utf8'));
        // client.destroy(); // kill client after server's response
      });

       this.client.on('close', function() {
        console.log('Connection closed');
      });
    },

    startServer() {
      var server = net.createServer(function(socket) {
        socket.write('Echo server\r\n');
        socket.pipe(socket);
      });

      server.listen(50710, '127.0.0.1');
    },


    pick(device) {
      console.log(device.product)
      this.device = new HID.HID( device.path );

      // this.output = this.device.getFeatureReport()
      this.device.on('data', (data) => {
        console.log(data)
        // this.output = data
      })
    },


    async getPorts() {
      await SerialPort.list().then((ports, err) => {
          if(err) {
            this.serials = err.message
            return
          } else {
            this.serials = ''
          }
          console.log('ports', ports);

          if (ports.length === 0) {
            this.serials = 'No ports discovered'
          }

          // tableHTML = tableify(ports)
          // document.getElementById('ports').innerHTML = tableHTML

          this.serials = ports
        })
    },

    charge(barcode) {
      console.log('isDev: ', isDevelopment);
      axios.post((isDevelopment ? 'http://local.hldv.test' : 'https://local.hldv.it') + '/api/electron/card-reader/fango', {
            card: barcode.substring(1),
            token: 'CWMucJ7Ha2bKJVfmhFLD2KZbPddafdsgGFmJ5kvmvNXdbsS2c7AxGAyuhQGY2MfMZY8XsA',
          })
          .then(({data}) => {

              this.sendToPrinter(data)
              console.log('success');
          })
          .catch(error => {
            console.log(error)
          })
    },

    sendToPrinter(data) {
        // inalazioni .98
        let networkDevice = new escpos.Network('192.168.1.156');

        if (networkDevice) {
          networkDevice.open((error) => {
            if (error) return console.log('Stampante non connessa');

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

            console.log('printed');

          });
        }
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