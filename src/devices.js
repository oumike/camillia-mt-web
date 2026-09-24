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
    env: 'tdeck-pro',
    buy: { seller: 'Rokland', href: 'https://store.rokland.com/products/lilygo-t-deck-pro-a7682e-4g-us-915-mhz' },
    name: 'LilyGo T-Deck Pro',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 3.1″ e-paper 240×320 portrait, 35-key QWERTY, capacitive touch, GPS, microSD, IMU and a vibration motor. The port follows LilyGo and Meshtastic pin definitions but is not yet verified on physical hardware.',
    link: 'https://lilygo.cc/products/t-deck-pro',
    image: withBase('/devices/tdeck-pro.jpg'),
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
    desc: 'Touch-first UI in either orientation — landscape or portrait is a setting on the device, not a separate download. GPS, full mesh UI. No microSD slot; config, DM history and the node archive live in internal flash.',
    link: 'https://heltec.org/',
    image: withBase('/devices/heltec-v4-expansion-kit.png'),
  },
  {
    // The V4-R8 pairs a different mainboard with a different carrier, so it is a
    // separate target rather than a V4 variant: octal PSRAM takes GPIO33-37 out
    // of circulation and the Expansion Kit V2 rewires display, touch, SD and
    // buzzer. See src/hal/hw_heltec_r8.h in the firmware tree.
    //
    // No V4-R8 product photo or vendor SKU page yet, so the artwork falls back
    // to the V4 expansion-kit shot and `buy` is omitted -- Devices.jsx renders
    // each field only when present. Swap both in when they exist.
    env: 'heltec-r8',
    name: 'Heltec WiFi LoRa 32 V4-R8 + TFT',
    chip: 'ESP32-S3',
    desc: 'The V4-R8 mainboard (8 MB octal PSRAM) on the Expansion Kit V2 carrier: ST7789 320x240 TFT, CHSC6X touch, GPS, and the microSD slot the v1 kit does not have. Touch-first UI in either orientation — landscape or portrait is a setting on the device, not a separate download. Not yet verified on physical hardware.',
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
    // Shipped under the codename `square` while the hardware was unreleased;
    // Seeed sells it as the Wio Tracker L2. Still missing a product photo and a
    // manufacturer link, so the artwork stays the question-mark placeholder and
    // `link`/`buy` are omitted — Devices.jsx renders each field only when
    // present. Drop in a photo and the vendor URL when they are available.
    env: 'wio-tracker-l2',
    name: 'Seeed Wio Tracker L2',
    chip: 'ESP32-S3',
    desc: 'SX1262 LoRa, 320×240 touch panel, GNSS, ES8311 audio, 16 MB flash and 8 MB PSRAM. Touch-first UI with an on-screen keyboard, optional BLE keyboard, and SD_MMC storage for config import/export. Brightness, battery, audio, SD and BLE support are not yet verified on physical hardware.',
    image: withBase('/devices/wio-tracker-l2.svg'),
  },
  {
    env: 'p4-amoled-sx1262',
    name: 'LilyGo T-Display P4 AMOLED + SX1262',
    chip: 'ESP32-P4',
    desc: 'SX1262 LoRa, 4.1″ 568×1232 AMOLED, capacitive touch, L76K GNSS, microSD and 32 MB PSRAM. Touch-first portrait UI with an on-screen keyboard and automatic support for the detachable 68-key keyboard.',
    link: 'https://lilygo.cc/products/t-display-p4',
    image: withBase('/devices/tdisplay-p4.png'),
  },
  {
    env: 'p4-amoled-lr2021',
    name: 'LilyGo T-Display P4 AMOLED + LR2021',
    chip: 'ESP32-P4',
    desc: 'LR2021 LoRa, 4.1″ 568×1232 AMOLED, capacitive touch, L76K GNSS, microSD and 32 MB PSRAM. Touch-first portrait UI with an on-screen keyboard and automatic support for the detachable 68-key keyboard.',
    link: 'https://lilygo.cc/products/t-display-p4',
    image: withBase('/devices/tdisplay-p4.png'),
  },
]
