// Single source of truth for hardware targets. Used by both the Devices section
// (info display) and the Flasher (manifest selection).
export const DEVICES = [
  {
    env: 'tdeck',
    name: 'LilyGo T-Deck',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 320×240 display, physical keyboard, trackball, L76K GPS. Full mesh UI with microSD config import/export.',
    link: 'https://www.lilygo.cc/products/t-deck',
    image: '/devices/tdeck.png',
  },
  {
    env: 'tlora-pager-tft',
    name: 'LilyGo T-Lora Pager TFT',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 480×222 TFT, physical keyboard, roller wheel + click, GPS. Full mesh UI with microSD config import/export.',
    link: 'https://lilygo.cc/',
    image: '/devices/tlora-pager-tft.png',
  },
  {
    env: 'cardputer-cap',
    name: 'M5Stack Cardputer + Cap LoRa/GPS',
    chip: 'ESP32-S3',
    desc: 'Keyboard-driven nav, microSD config, GPS, full mesh UI. Pairs with the M5Stack Cap LoRa/GPS module.',
    link: 'https://shop.m5stack.com/products/m5stack-cardputer-kit-w-m5stamps3',
    image: '/devices/cardputer-cap.png',
  },
  {
    env: 'heltec-v4',
    name: 'Heltec WiFi LoRa 32 V4 + TFT',
    chip: 'ESP32-S3',
    desc: 'Touch-first horizontal UI, GPS, full mesh UI. microSD is not enabled in this profile.',
    link: 'https://heltec.org/',
    image: '/devices/heltec-v4-expansion-kit.png',
  },
  {
    env: 'heltec-v4-vertical',
    name: 'Heltec WiFi LoRa 32 V4 + TFT (vertical)',
    chip: 'ESP32-S3',
    desc: 'Same as Heltec V4 with a vertical-oriented UI layout.',
    link: 'https://heltec.org/',
    image: '/devices/heltec-v4-expansion-kit.png',
  },
]
