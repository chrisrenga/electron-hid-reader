<template>
  <div class="h-full w-full flex flex-col">
    <!-- <Licensing
      v-if="! hasValidLicense"
    /> -->
    <HelloWorld msg="Devices"/>

    <div v-html="serials"></div>
    <div v-html="output"></div>

    <div class="space-y-4">
      <div @click="pick(device)" v-for="(device, index) in devices" :key="index" class="p-4 cursor-pointer hover:bg-gray-200">
          <div><strong>Vendor ID:</strong>{{device.vendorId}}</div>
          <div><strong>productId: </strong>{{device.productId}}</div>
          <div><strong>usagePage: </strong>{{device.usagePage}}</div>
          <div><strong>usage: </strong>{{device.usage}}</div>
          <div><strong>product: </strong>{{device.product}}</div>
          <div><strong>manufacturer: </strong>{{device.manufacturer}}</div>
          <div><strong>serialNumber: </strong>{{device.serialNumber}}</div>
          <div><strong>path: </strong>{{device.path}}</div>
      </div>
    </div>

  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
// import Licensing from './components/Licensing';
// import licenseCheck from './mixins/licensing';
import HID from 'node-hid';

import SerialPort from 'serialport'

export default {
  name: 'App',
  mixins: [
    // licenseCheck
  ],
  components: {
    HelloWorld,
    // Licensing,
  },

  data() {
    return {
      devices: [],
      device: null,
      output: null,
      serials: null,
    }
  },

  mounted() {
    this.devices = HID.devices()
    this.getPorts()
  },

  methods: {
    pick(device) {
      console.log(device.product)
      this.device = new HID.HID( device.path );

      // this.output = this.device.getFeatureReport()
      this.device.on('data', (data) => {
        console.log(data)
        this.output = data
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