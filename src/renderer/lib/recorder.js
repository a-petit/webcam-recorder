
/* Canvas video recorder,
 * based on https://webrtc.github.io/samples/src/content/capture/canvas-record/
 *
 * - Handle an unique recording at the same time
 * - Handle the revocation of created blob's url
 */

const VERBOSE = false

let mediaStream = null
let mediaRecorder = null
let recordedBlobs = null
let recordResolution = {}
let blobUrl = null

let clear = () => {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl)
    blobUrl = null
  }
}

let dataAssertionsCheck = (recorder) => {
  if (mediaRecorder === null || mediaRecorder.state !== 'inactive') {
    console.warn('the recorder hasn\'t record anything or is still recording')
  }
  if (recordedBlobs.length === 0) {
    console.warn('they are no recorded blobs')
  }
}

let handleStop = () => {
  VERBOSE && console.log('handle stop')
}

export default {
  startRecording (stream) {
    clear()
    mediaStream = stream

    // let $this = this
    let options = {mimeType: 'video/webm'}
    recordedBlobs = []
    try {
      mediaRecorder = new MediaRecorder(mediaStream, options)
    } catch (e0) {
      console.log('Unable to create MediaRecorder with options Object: ', e0)
      try {
        options = {mimeType: 'video/webm,codecs=vp9'}
        mediaRecorder = new MediaRecorder(mediaStream, options)
      } catch (e1) {
        console.log('Unable to create MediaRecorder with options Object: ', e1)
        try {
          options = 'video/vp8' // Chrome 47
          mediaRecorder = new MediaRecorder(mediaStream, options)
        } catch (e2) {
          alert('MediaRecorder is not supported by this browser.\n\n' +
            'Try Firefox 29 or later, or Chrome 47 or later, ' +
            'with Enable experimental Web Platform features ' +
            'enabled from chrome://flags.')
          console.error('Exception while creating MediaRecorder:', e2)
          return
        }
      }
    }
    let settings = mediaStream.getVideoTracks()[0].getSettings()
    console.log('Record stream with settings: ' + JSON.stringify(settings, null, 2))
    recordResolution.width = settings.width
    recordResolution.height = settings.height
    // let videoTrack = mediaStream.getVideoTracks()[0]
    // recordResolution.width = videoTrack.canvas.clientWidth
    // recordResolution.height = videoTrack.canvas.clientHeight
    // console.log('Record : ', videoTrack)

    VERBOSE && console.log('Created MediaRecorder', mediaRecorder, 'with options', options)
    mediaRecorder.onstop = handleStop
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        console.log('record blob')
        recordedBlobs.push(event.data)
      }
    }
    // mediaRecorder.start(settings.frameRate) // collect 100ms of data
    mediaRecorder.start(100) // collect 100ms of data
    VERBOSE && console.log('MediaRecorder started', mediaRecorder)
  },
  stopRecording () {
    mediaRecorder.stop()
    VERBOSE && console.log('Recorded Blobs: ', recordedBlobs)
  },
  /*
   * Accessing recorded datas
   */
  isRecording () {
    return mediaRecorder !== null && mediaRecorder.state !== 'inactive'
  },
  isVideoAvailable () {
    return !this.isRecording() && recordedBlobs != null && recordedBlobs.length !== 0
  },
  url () {
    VERBOSE && console.log('URL requested')
    dataAssertionsCheck(this)
    let blob = new Blob(recordedBlobs, {type: 'video/webm'})
    let url = window.URL.createObjectURL(blob)
    return url
  },
  download (name) {
    VERBOSE && console.log('Download requested')
    dataAssertionsCheck(this)
    const blob = new Blob(recordedBlobs, {type: 'video/webm'})
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'test-' + name + '.webm'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 100)
  }
}
