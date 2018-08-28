<template>
  <div id="wrapper">
    <h1>Camera recorder</h1>
    <button v-if="!recording" :disabled="!interactive" v-on:click="startRecording">
      record
    </button>
    <button v-else :disabled="!interactive" v-on:click="stopRecording">
      stop
    </button>
    <button :disabled="!interactive" v-on:click="download">
      download
    </button>
    <select v-model="resolutionID">
      <option v-for="(option, index) in resolutions" v-bind:value="index">
        {{ option.name }}
      </option>
    </select>
    <input type="checkbox" id="check-monitor" v-model="displayMonitor">
    <label for="check-monitor">display monitor</label>
    <input type="checkbox" id="check-playback" v-model="displayPlayback">
    <label for="check-playback">display playback</label>
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
        currentResolution: null,
        resolutionID: null,
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
      resolutions () {
        return settings.camera.resolutions
      },
      interactive () {
        return !settings.autotest.enabled
      },
      autotesting () {
        return settings.autotest.enabled
      }
    },
    watch: {
      resolutionID (id) {
        this.currentResolution = this.resolutions[id]
        let constraints = {
          audio: false,
          video: this.currentResolution.value
        }
        this.initWebcam(constraints)
      }
    },
    mounted () {
      this.commands = {
        ' ': this.toggleRecording,
        'p': this.togglePlayback,
        'd': this.download
      }

      window.recorder = recorder

      if (this.interactive) {
        document.onkeypress = this.keyPressed
      }

      this.resolutionID = 0
    },
    methods: {
      nextTest () {
        if (this.testID >= this.resolutions.length) {
          return
        }
        this.testID = this.testID + 1
        this.currentResolution = this.resolutions[this.testID]
      },
      initWebcam (constraints) {
        VERBOSE && console.log('initWebcam: ' + JSON.stringify(constraints, null, 2))
        // Using the new API, @see
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        // for backward compatibility
        if (navigator.mediaDevices === undefined) {
          console.warn('Browser\'s version is too old')
        }

        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            track.stop()
          })
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
      startRecording () {
        VERBOSE && console.log('startRecording')
        recorder.startRecording(this.stream)
        this.recording = true

        if (this.autotesting) {
          setTimeout(this.stopRecording, this.duration)
        }
      },
      stopRecording () {
        VERBOSE && console.log('stopRecording')
        recorder.stopRecording()
        this.$refs.playback.src = recorder.url()
        this.recording = false

        if (this.autotesting) {
          this.download()
          setTimeout(this.initNextTest, this.duration)
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
        var charCode = evt.keyCode || evt.which
        var charStr = String.fromCharCode(charCode)
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
