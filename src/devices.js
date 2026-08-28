// Single source of truth for hardware targets. Used by both the Devices section
// (info display) and the Flasher (manifest selection).
import { withBase } from './basePath'

export const DEVICES = [
  {
    env: 'tdeck',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-deck-portable-microcontroller-programmer-lora-915-mhz-h642' },
    name: 'LilyGo T-Deck',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 320×240 display, physical keyboard, trackball, L76K GPS. Full mesh UI with microSD config import/export.',
    link: 'https://www.lilygo.cc/products/t-deck',
    image: withBase('/devices/tdeck.png'),
  },
  {
    env: 'tlora-pager-tft',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-lora-pager-us-915-mhz-lora-esp32-s3-handheld-aiot-programmable-development-device-k257-01' },
    name: 'LilyGo T-Lora Pager TFT',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 480×222 TFT, physical keyboard, roller wheel + click, GPS. Full mesh UI with microSD config import/export.',
    link: 'https://lilygo.cc/',
    image: withBase('/devices/tlora-pager-tft.png'),
  },
  {
    env: 'cardputer-cap',
    buy: { seller: 'M5Stack', href: 'https://shop.m5stack.com/products/m5stack-cardputer-kit-w-m5stamps3' },
    name: 'M5Stack Cardputer + Cap LoRa/GPS',
    chip: 'ESP32-S3',
    desc: 'Keyboard-driven nav, microSD config, GPS, full mesh UI. Pairs with the M5Stack Cap LoRa/GPS module.',
    link: 'https://shop.m5stack.com/products/m5stack-cardputer-kit-w-m5stamps3',
    image: withBase('/devices/cardputer-cap.png'),
  },
  {
    env: 'heltec-v4',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/heltec-wifi-lora-32v4-esp32s3-sx1262-lora-node-meshtastic-lorawan' },
    name: 'Heltec WiFi LoRa 32 V4 + TFT',
    chip: 'ESP32-S3',
    desc: 'Touch-first horizontal UI, GPS, full mesh UI. microSD is not enabled in this profile.',
    link: 'https://heltec.org/',
    image: withBase('/devices/heltec-v4-expansion-kit.png'),
  },
  {
    env: 'heltec-v4-vertical',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/heltec-wifi-lora-32v4-esp32s3-sx1262-lora-node-meshtastic-lorawan' },
    name: 'Heltec WiFi LoRa 32 V4 + TFT (vertical)',
    chip: 'ESP32-S3',
    desc: 'Same as Heltec V4 with a vertical-oriented UI layout.',
    link: 'https://heltec.org/',
    image: withBase('/devices/heltec-v4-expansion-kit.png'),
  },
  {
    env: 'mesh-deck',
    buy: { seller: 'Attaky', href: 'https://shop.attaky.com/' },
    name: 'Attaky Mesh Deck',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 320×240 touch display, 48-key QWERTY, D-pad, GPS, MAX17048 fuel gauge. No microSD — config, DM history and the node archive live in internal flash.',
    link: 'https://shop.attaky.com/',
    image: withBase('/devices/mesh-deck.jpg'),
  },
  {
    env: 'm9',
    buy: { seller: 'Elecrow', href: 'https://www.elecrow.com/thinknode-m9-meshcore-communication-terminal-with-full-keyboard-2-4inch-lcd-esp32-s3-lr1110-gps-2300mah.html' },
    name: 'Elecrow ThinkNode M9',
    chip: 'ESP32-S3',
    desc: 'LR1110 LoRa — the only non-SX1262 board here — 2.4″ 320×240 display, 37-key QWERTY with a d-pad and six dedicated shortcut buttons, GPS, microSD, 2300 mAh. No touch panel.',
    link: 'https://www.elecrow.com/thinknode-m9-meshcore-communication-terminal-with-full-keyboard-2-4inch-lcd-esp32-s3-lr1110-gps-2300mah.html',
    image: withBase('/devices/m9.jpg'),
  },
  {
    // Deliberately bare. The build exists and flashes like any other, but
    // nothing here says what the hardware is: no chip, no description, no
    // manufacturer link, no seller. Devices.jsx renders each of those only when
    // present, so leaving them out is the whole mechanism — and the artwork is
    // question marks rather than a photo. Fill the fields in when it is time to
    // say more; nothing else needs changing.
    env: 'square',
    name: 'Square',
    chip: '???',
    image: withBase('/devices/square.svg'),
  },
]
