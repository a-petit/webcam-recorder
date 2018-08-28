<template>
  <div id="wrapper">
    <h1>Camera recorder</h1>
    <div v-show="interactive">
      <div class="select">
          <label for="videoSource">Video source: </label>
          <select id="videoSource" ref="videoSelect" v-model="cameraID" :on-change="initWebcam"></select>
      </div>
      <button id="autotest" v-on:click="startAutoTest">
        autotest
      </button>
      <button v-if="!recording" v-on:click="startRecording">
        record
      </button>
      <button v-else v-on:click="stopRecording">
        stop
      </button>
      <button v-on:click="download">
        download
      </button>
      <select v-model="resolutionID" :on-change="initWebcam">
        <option v-for="(option, index) in resolutions" v-bind:value="index">
          {{ option.name }}
        </option>
      </select>
      <input type="checkbox" id="check-monitor" v-model="displayMonitor">
      <label for="check-monitor">display monitor</label>
      <input type="checkbox" id="check-playback" v-model="displayPlayback">
      <label for="check-playback">display playback</label>
    </div>
    <main>
      <div v-show="displayMonitor" class="monitor">
        <div>Monitor</div>
        <video ref="monitor" playsinline></video>
      </div>
      <div v-show="displayPlayback" class="playback">
        <div>Playback</div>
        <video ref="playback" playsinline controls></video>
      </div>
    </main>
  </div>
</template>

<script>
  import settings from '@/lib/settings'
  import recorder from '@/lib/recorder'

  let VERBOSE = true

  export default {
    name: 'landing-page',
    data () {
      return {
        stream: null,
        duration: 5000,
        autotesting: false,
        resolutionID: 3,
        cameraID: '',
        recording: false,
        displayMonitor: true,
        displayPlayback: true
      }
    },
    computed: {
      cameraSettings () {
        if (this.stream) {
          return this.stream.getVideoTracks()[0].getSettings()
        } else {
          return null
        }
      },
      currentResolution () {
        return settings.camera.resolutions[this.resolutionID]
      },
      resolutions () {
        return settings.camera.resolutions
      },
      interactive () {
        return !this.autotesting
      }
    },
    watch: {
      resolutionID (id) {
        this.initWebcam()
      },
      interactive (value) {
        document.onkeypress = value ? this.keyPressed : null
      }
    },
    mounted () {
      // Using the new API, @see
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
      // for backward compatibility
      if (navigator.mediaDevices === undefined) {
        console.warn('Browser\'s version is too old')
        return
      }

      this.commands = {
        ' ': this.toggleRecording,
        'p': this.togglePlayback,
        'd': this.download
      }

      window.recorder = recorder
      window.vm = this

      navigator.mediaDevices.enumerateDevices().then(this.initDevices)

      this.initWebcam()
    },
    methods: {
      initDevices (deviceInfos) {
        let videoSelect = this.$refs.videoSelect
        for (let i = 0; i !== deviceInfos.length; ++i) {
          let deviceInfo = deviceInfos[i]
          let option = document.createElement('option')
          option.value = deviceInfo.deviceId
          if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1)
            videoSelect.appendChild(option)
          }
        }
      },
      initWebcam () {
        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            track.stop()
          })
        }

        console.log('cam:', this.$refs.videoSelect.value, this.cameraID)

        let constraints = {
          video: {
            width: this.currentResolution.value.width,
            height: this.currentResolution.value.height,
            deviceId: {
              exact: this.$refs.videoSelect.value
            }
          }
        }

        let vm = this
        navigator.mediaDevices.getUserMedia(constraints)
          .then(function (stream) {
            vm.stream = stream
            console.log('Found camera with settings: ' +
              JSON.stringify(vm.cameraSettings, null, 2)
            )
            vm.playWebcam(stream)
          })
          .catch(function (err) {
            console.error('Cannot access the webcam:', err)
          })
      },
      playWebcam (stream) {
        VERBOSE && console.log('playWebcam')
        this.$refs.monitor.srcObject = stream
        this.$refs.monitor.play()

        if (this.autotesting) {
          this.startRecording()
        }
      },
      startAutoTest () {
        this.autotesting = true
        if (this.resolutionID === 0) {
          this.startRecording()
        } else {
          this.resolutionID = 0
        }
      },
      nextTest () {
        if (this.resolutionID >= this.resolutions.length - 1) {
          this.autotesting = false
          return
        }
        this.resolutionID = this.resolutionID + 1
      },
      startRecording () {
        VERBOSE && console.log('startRecording')
        recorder.startRecording(this.stream)
        this.recording = true

        if (this.autotesting) {
          setTimeout(this.stopRecording, settings.autotest.duration)
        }
      },
      stopRecording () {
        VERBOSE && console.log('stopRecording')
        recorder.stopRecording()
        this.$refs.playback.src = recorder.url()
        this.recording = false

        if (this.autotesting) {
          this.download()
          setTimeout(this.nextTest, settings.autotest.wait)
        }
      },
      download () {
        if (!recorder.isVideoAvailable()) {
          return
        }
        recorder.download(this.currentResolution.name)
      },
      //
      // - Handle keyboard events
      //
      keyPressed (evt) {
        evt = evt || window.event
        let charCode = evt.keyCode || evt.which
        let charStr = String.fromCharCode(charCode)
        // console.log('key pressed:', charStr)
        if (this.commands[charStr]) {
          this.commands[charStr]()
        }
      },
      toggleRecording () {
        if (recorder.isRecording()) {
          this.stopRecording()
        } else {
          this.startRecording()
        }
      },
      togglePlayback () {
        this.$refs.playback.play()
      }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  h1 {
    font-size: 80px;
    font-weight: bold;
    padding-bottom: 2vh;
    text-transform: uppercase;
  }

  button, select {
    margin-right: 1vh;
    font-size: 30px;
    width: 10vw;
    text-transform: uppercase;
    padding: 6px;
    background-color: slategrey;
    color: white;
    border: none;
  }

   #autotest {
     background-color: slateblue;
   }

  #wrapper {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }

  main {
    /* display: flex; */
    /* justify-content: space-between; */
    font-size: 50px;
    text-transform: uppercase;
    color: darkcyan;
  }

  :disabled {
    opacity: 0.5;
  }

  .playback, .monitor {
    margin-top: 5vh;
  }
</style>
