// iPhone and iPad have no Web Serial in any browser (they are all WebKit), so
// the flasher can never work there and the page leaves it out. iPadOS 13+
// reports itself as a Mac, so a touch-capable "Mac" is taken to be an iPad.
function isIOS() {
  if (typeof navigator === 'undefined') return false
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export const CAN_FLASH = !isIOS()
