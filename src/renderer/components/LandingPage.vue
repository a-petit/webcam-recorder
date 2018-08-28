<template>
  <div id="wrapper">
    <h1>Camera recorder</h1>
    <main>
      <div class="webcam">
        <div>
          Monitor
        </div>
        <video ref="monitor" playsinline></video>
      </div>
      <div class="playback">
        <div>
          Playback
        </div>
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
        testing: true,
        duration: 5000,
        videoMonitor: null,
        videoPlayback: null,
        currentResolution: null,
        resolutions: [
          {name: 'QVGA', value: {width: {exact: 320}, height: {exact: 240}}},
          {name: 'VGA', value: {width: {exact: 320}, height: {exact: 240}}},
          {name: 'HD', value: {width: {exact: 1280}, height: {exact: 720}}},
          {name: 'FULL-HD', value: {width: {exact: 1920}, height: {exact: 1080}}},
          // {name: '2K', value: '2048x1080'},
          // {name: 'WQHD', value: '2650x1440'},
          // {name: 'UHD-1', value: '3840x2160'},
          {name: '4K', value: {width: {exact: 4096}, height: {exact: 2160}}},
          {name: '8K', value: {width: {exact: 7680}, height: {exact: 4320}}}
        ]
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
      if (this.testing) {
        this.commands = {}
      } else {
        this.commands = {
          ' ': this.toggleRecording,
          'p': this.togglePlayback
        }
      }

      this.videoMonitor = this.$refs.monitor
      this.videoPlayback = this.$refs.playback
      document.onkeypress = this.keyPressed
      if (this.testing) {
        this.initNextTest()
      } else {
        this.initRegular()
      }
    },
    methods: {
      initRegular () {
        let constraints = {
          audio: false,
          video: {
            width: settings.camera.input.width,
            height: settings.camera.input.height
          }
        }
        this.initWebcam(constraints)
      },
      initNextTest () {
        if (!this.testID) {
          this.testID = 0
        }
        if (this.testID >= this.resolutions.length) {
          return
        }

        this.currentResolution = this.resolutions[this.testID]

        let constraints = {
          audio: false,
          video: this.currentResolution.value
        }
        this.initWebcam(constraints)
        this.testID = this.testID + 1
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
        this.videoMonitor.srcObject = stream
        this.videoMonitor.play()
        if (this.testing) {
          this.startRecording()
        }
      },
      startRecording () {
        VERBOSE && console.log('startRecording')
        recorder.startRecording(this.stream)
        if (this.testing) {
          setTimeout(this.stopRecording, this.duration)
        }
      },
      stopRecording () {
        VERBOSE && console.log('stopRecording')
        recorder.stopRecording()
        this.videoPlayback.src = recorder.url()
        recorder.download(this.currentResolution.name)
        if (this.testing) {
          setTimeout(this.initNextTest, this.duration)
        }
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
        this.videoPlayback.play()
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
</style>
