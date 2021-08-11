<template>
<div class="border-b py-1" :class="logColor(event)">
    <div class="flex items-center px-2">
        <div class="text-gray-700 mr-4 text-xs w-26" :class="logColor(event)">
          {{ event.date | formatDate }}
        </div>

        <div class="font-semibold text-xs mr-2 w-16">
          {{ event.instance.name }}
        </div>

        <div class="flex-1 leading-none text-sm flex items-center">
          <div class="uppercase mr-2 font-semibold" v-if="event.type === 'error'">
            {{ event.type }}
          </div>
          <div>
            {{ event.message }}
          </div>
          <div>
            <button @click.prevent="showDetails = !showDetails" v-if="event.data" type="button" class="hover:text-black text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
    </div>
    <div v-if="showDetails" class="bg-gray-800 text-white p-2 overflow-x-scroll">
        <pre v-html='event.data' class="text-xs">
        </pre>
    </div>
</div>
</template>

<script>
export default {
    props: {
        event: {
            type: Object,
        },
    },

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

    data() {
        return {
            showDetails: false,
        }
    },

    methods: {
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