<template>
  <div id="wrapper">
    <h1>Camera recorder</h1>
    <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    <main>
      <div class="webcam">
        <video ref="monitor" playsinline></video>
        <video ref="replay" playsinline></video>
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
        videoMonitor: null,
        videoReplay: null
      }
    },
    computed: {
      cameraSettings () {
        if (this.stream) {
          return this.stream.getVideoTracks()[0].getSettings()
        } else {
          return null
        }
      }
    },
    mounted () {
      this.commands = {
        ' ': this.toggleRecording,
        'p': this.togglePlayback
      }
      this.videoMonitor = this.$refs.monitor
      this.videoReplay = this.$refs.replay
      document.onkeypress = this.keyPressed
      this.initWebcam()
    },
    methods: {
      initWebcam () {
        VERBOSE && console.log('initWebcam')
        // Using the new API, @see
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        // for backward compatibility
        if (navigator.mediaDevices === undefined) {
          console.warn('Browser\'s version is too old')
        }

        let constraints = {
          audio: false,
          video: {
            width: settings.camera.input.width,
            height: settings.camera.input.height
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
        this.videoMonitor.srcObject = stream
        this.videoMonitor.play()
      },
      startRecording () {
        VERBOSE && console.log('startRecording')
        recorder.startRecording(this.stream)
      },
      stopRecording () {
        VERBOSE && console.log('stopRecording')
        recorder.stopRecording()
        this.videoReplay.src = recorder.url()
      },
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
        this.videoReplay.play()
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

  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 420px;
  }

  main {
    display: flex;
    justify-content: space-between;
  }

  main > div { flex-basis: 50%; }
</style>
