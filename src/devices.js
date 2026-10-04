// Single source of truth for hardware targets. Used by both the Devices section
// (info display) and the Flasher (manifest selection).
import { withBase } from './basePath'

export const DEVICES = [
  {
    env: 'tdeck',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-deck-portable-microcontroller-programmer-lora-915-mhz-h642' },
    name: 'LilyGo T-Deck',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 2.8″ 320×240 display, QWERTY keyboard, trackball, L76K GPS, microSD.',
    link: 'https://www.lilygo.cc/products/t-deck',
    image: withBase('/devices/tdeck.png'),
  },
  {
    env: 'tdeck-pro',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-deck-pro-a7682e-4g-us-915-mhz' },
    name: 'LilyGo T-Deck Pro',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 3.1″ 240×320 e-paper with touch, 35-key QWERTY, GPS, microSD, vibration motor.',
    link: 'https://lilygo.cc/products/t-deck-pro',
    image: withBase('/devices/tdeck-pro.jpg'),
  },
  {
    env: 'tlora-pager-tft',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-lora-pager-us-915-mhz-lora-esp32-s3-handheld-aiot-programmable-development-device-k257-01' },
    name: 'LilyGo T-Lora Pager TFT',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 480×222 TFT, QWERTY keyboard, roller wheel, GPS, microSD.',
    link: 'https://lilygo.cc/',
    image: withBase('/devices/tlora-pager-tft.png'),
  },
  {
    env: 'cardputer-cap',
    buy: { seller: 'M5Stack', href: 'https://shop.m5stack.com/products/m5stack-cardputer-kit-w-m5stamps3' },
    name: 'M5Stack Cardputer + Cap LoRa/GPS',
    chip: 'ESP32-S3',
    desc: 'Compact keyboard computer with a 240×135 display and microSD, paired with the Cap LoRa/GPS module (SX1262 + GPS).',
    link: 'https://shop.m5stack.com/products/m5stack-cardputer-kit-w-m5stamps3',
    image: withBase('/devices/cardputer-cap.png'),
  },
  {
    env: 'heltec-v4',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/heltec-wifi-lora-32v4-esp32s3-sx1262-lora-node-meshtastic-lorawan' },
    name: 'Heltec WiFi LoRa 32 V4 + TFT',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa on the expansion kit with a 320×240 touch TFT and GPS. Landscape or portrait.',
    link: 'https://heltec.org/',
    image: withBase('/devices/heltec-v4-expansion-kit.png'),
  },
  {
    // The V4-R8 pairs a different mainboard with a different carrier, so it is a
    // separate target rather than a V4 variant: octal PSRAM takes GPIO33-37 out
    // of circulation and the Expansion Kit V2 rewires display, touch, SD and
    // buzzer. See src/hal/hw_heltec_r8.h in the firmware tree.
    //
    // No V4-R8 product photo yet, so the artwork falls back to the V4
    // expansion-kit shot.
    env: 'heltec-r8',
    buy: { seller: 'Heltec', href: 'https://heltec.org/project/v4-r8-ex/' },
    name: 'Heltec WiFi LoRa 32 V4-R8 + TFT',
    chip: 'ESP32-S3',
    desc: 'V4-R8 mainboard (8 MB PSRAM) on the Expansion Kit V2: 2.8″ 320×240 touch TFT, GPS, microSD. Landscape or portrait.',
    link: 'https://heltec.org/project/v4-r8-ex/',
    image: withBase('/devices/heltec-v4-expansion-kit.png'),
  },
  {
    env: 'mesh-deck',
    buy: { seller: 'Attaky', href: 'https://shop.attaky.com/' },
    name: 'Attaky Mesh Deck',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 320×240 touch display, 48-key QWERTY, D-pad, GPS.',
    link: 'https://shop.attaky.com/',
    image: withBase('/devices/mesh-deck.jpg'),
  },
  {
    env: 'm9',
    buy: { seller: 'Elecrow', href: 'https://www.elecrow.com/thinknode-m9-meshcore-communication-terminal-with-full-keyboard-2-4inch-lcd-esp32-s3-lr1110-gps-2300mah.html' },
    name: 'Elecrow ThinkNode M9',
    chip: 'ESP32-S3',
    desc: 'LR1110 LoRa, 2.4″ 320×240 display, 37-key QWERTY with D-pad and shortcut buttons, GPS, microSD, 2300 mAh battery.',
    link: 'https://www.elecrow.com/thinknode-m9-meshcore-communication-terminal-with-full-keyboard-2-4inch-lcd-esp32-s3-lr1110-gps-2300mah.html',
    image: withBase('/devices/m9.jpg'),
  },
  {
    // Shipped under the codename `square` while the hardware was unreleased;
    // Seeed sells it as the Wio Tracker L2. Still missing a product photo and a
    // manufacturer link, so the artwork stays the question-mark placeholder and
    // `link`/`buy` are omitted — Devices.jsx renders each field only when
    // present. Drop in a photo and the vendor URL when they are available.
    env: 'wio-tracker-l2',
    name: 'Seeed Wio Tracker L2',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 320×240 touch panel, GNSS, audio, microSD.',
    image: withBase('/devices/wio-tracker-l2.svg'),
  },
  {
    // Sold by Muzi Works as a Meshtastic bundle with the SX1262 module in the
    // J8/J9 slot.
    env: 'crowpanel-35',
    buy: { seller: 'Muzi Works', href: 'https://muzi.works/products/elecrow-crowpanel-advance-3-5' },
    name: 'Elecrow CrowPanel Advance 3.5',
    link: 'https://muzi.works/products/elecrow-crowpanel-advance-3-5',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa module, 3.5″ 480×320 IPS touch panel, optional UART GPS. Landscape or portrait.',
    image: withBase('/devices/crowpanel-35.jpg'),
  },
  {
    env: 'p4-amoled-sx1262',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-display-p4' },
    name: 'LilyGo T-Display P4 AMOLED + SX1262',
    chip: 'ESP32-P4',
    desc: 'SX1262 LoRa, 4.1″ 568×1232 AMOLED touch, L76K GNSS, microSD, optional clip-on 68-key keyboard.',
    link: 'https://lilygo.cc/products/t-display-p4',
    image: withBase('/devices/tdisplay-p4.png'),
  },
  {
    env: 'p4-amoled-lr2021',
    name: 'LilyGo T-Display P4 AMOLED + LR2021',
    chip: 'ESP32-P4',
    desc: 'LR2021 LoRa, 4.1″ 568×1232 AMOLED touch, L76K GNSS, microSD, optional clip-on 68-key keyboard.',
    link: 'https://lilygo.cc/products/t-display-p4',
    image: withBase('/devices/tdisplay-p4.png'),
  },
]

// camillia-chat-server's targets (its platformio.ini). `env` is both the build
// and the release asset name, so it must match exactly. The serial-test env is
// a bench build and is never released.
export const CS_DEVICES = [
  {
    env: 'heltec-v4',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/heltec-wifi-lora-32v4-esp32s3-sx1262-lora-node-meshtastic-lorawan' },
    name: 'Heltec WiFi LoRa 32 V4',
    chip: 'ESP32-S3',
    desc: 'The bare board: SX1262 LoRa, 2 MB PSRAM, 16 MB flash. Status on the built-in 128×64 OLED.',
    link: 'https://heltec.org/',
  },
  {
    env: 'heltec-v4-expansion',
    name: 'Heltec WiFi LoRa 32 V4 + TFT',
    chip: 'ESP32-S3',
    desc: 'The same board on the expansion kit. Health, message feed, and activity pages on the 320×240 touch TFT.',
    link: 'https://heltec.org/',
    image: withBase('/devices/heltec-v4-expansion-kit.png'),
  },
]
