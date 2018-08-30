
// --- Scaling utils -----------------------------------------------------------

// let center = (src, ref) => {
//   src.x = ref.x + (ref.width - src.width) / 2
//   src.y = ref.y + (ref.height - src.height) / 2
// }
//
// let scale_fill = (src, ref) => {
//   let ratioW = ref.width / src.width
//   let ratioH = ref.height / src.height
//   let ratio = Math.max(ratioW, ratioH)
//   src.width *= ratio
//   src.height *= ratio
//   center(src, ref)
// }
//
// let scale_fit = (src, ref) => {
//   let ratioW = ref.width / src.width
//   let ratioH = ref.height / src.height
//   let ratio = Math.min(ratioW, ratioH)
//   src.width *= ratio
//   src.height *= ratio
//   center(src, ref)
// }

// --- Type convertion util ----------------------------------------------------

/*
 * Return the Area associated to a given resolution
 */
let resolutionToArea = (resolution) => {
  let area = {
    x: 0,
    y: 0,
    width: resolution.width,
    height: resolution.height
  }
  return area
}

// --- Renderer ----------------------------------------------------------------

export default class Renderer {
  /**
   @param {CanvasImageSource} [src] : the source
   @param {HTMLCanvasElement} [dst] : the destination
   @param {IResolution} [aoiRes]    : the areaOfInterest resolution (w, h)
   @param {IResolution} [dstRes]    : the destination canvas resolution (w, h)
   @param {number} [zoom]           : the areaOfInterest zoom factor
  **/
  constructor (src, dst, aoiRes, dstRes, zoom = 1) {
    this.src = src
    this.dst = dst

    this.srcRes = getResolution(src)
    this.dstRes = getResolutionSetting(dstRes, this.srcRes)
    this.dst.width = this.dstRes.width
    this.dst.height = this.dstRes.height

    this.areaOfInterest = getResolutionSetting(aoiRes, this.srcRes)
    this.areaOfInterest = scaleAreaOfInterest(this.srcRes, this.areaOfInterest, zoom)

    this.renderArea = resolutionToArea(this.dstRes)

    this.isMirror = false

    // console.log('Render stream with settings: ' + JSON.stringify(this, null, 2))
  }

  setConstraints (area) {
    if (this.renderArea.width > area.width || this.renderArea.height > area.height) {
      // update cnvas size
    }
  }

  setMirror (value) {
    this.isMirror = value
  }

  applyMask (maskImage) {
    console.log('todo')
  }

  draw () {
    let ctx = this.dst.getContext('2d', {alpha: false})

    if (this.isMirror) {
      ctx.setTransform(-1, 0, 0, 1, this.renderArea.width, 0)
    }

    ctx.drawImage(this.src,
      this.areaOfInterest.x,
      this.areaOfInterest.y,
      this.areaOfInterest.width,
      this.areaOfInterest.height,
      this.renderArea.x,
      this.renderArea.y,
      this.renderArea.width,
      this.renderArea.height)

    if (this.isMirror) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
  }
}

/*
 * Return the resolution of the CanvasImageSource
 */
let getResolution = (src) => {
  // [!] si video ou canvas
  // console.log('warning:', src, src.width, src.videoWidth)
  let res = {
    width: src.videoWidth,
    height: src.videoHeight
  }
  return res
}

/*
 * If setting is well-formated, then return setting, else return default
 */
let getResolutionSetting = (setting, defaultValue) => {
  if (setting && setting.width && setting.height) {
    return setting
  } else {
    return defaultValue
  }
}

/*
 * Return the area corresponding to
 */
let scaleAreaOfInterest = (srcRes, aoiRes, zoom) => {
  let area = {
    x: (srcRes.width - aoiRes.width / zoom) / 2,
    y: (srcRes.height - aoiRes.height / zoom) / 2,
    width: aoiRes.width / zoom,
    height: aoiRes.height / zoom
  }
  return area
}
