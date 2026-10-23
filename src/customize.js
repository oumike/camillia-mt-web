// Customize: settings the flasher applies to a device over USB serial, using
// camillia-mt's `cfg` CLI (handleCfgCommand() in src/main_lvgl.cpp).
//
//   cfg caps                -> [cfg] caps v=1 firstboot=0|1 keys=preset,channels,logo channels=10
//                              logo=WxH logobg=RRGGBB logomax=8192 presets=LongFast,...
//   cfg set preset <name>   -> [cfg] ok preset=<Name> staged | [cfg] err preset: ...
//   cfg set slot <n>        -> [cfg] ok slot=<n> staged (1-based frequency slot; 0 = the preset's own)
//   cfg channels clear      -> [cfg] ok channels cleared slots=N
//   cfg set channel <i> role=.. name=<%-encoded> psk=default|none|<base64> pos=0|1 up=0|1 down=0|1
//                           -> [cfg] ok channel <i> staged | [cfg] err channel ...
//   cfg logo begin <bytes>, cfg logo data <hex>, cfg logo end <crc32>, cfg logo clear
//   cfg set longname|shortname|ssid|wifipass <%-encoded>, cfg set region <code>,
//   cfg set role <ROLE>     -> [cfg] ok <field> staged | [cfg] err <field>: ...
//   cfg commit              -> [cfg] ok committed ... applies-after=setup|setup-done rebooting|rebooting|unchanged
//   cfg abort               -> [cfg] ok aborted
//
// On a fresh install the device holds the settings until on-device setup
// finishes, unless the setup answers (with a region) are sent too: then commit
// finishes setup itself and reboots. On an existing install, commit saves and
// reboots.

import { withBase } from './basePath'

// Mirrors kPresets in camillia-mt's src/config_io.cpp. `name` is the channel
// name the firmware matches on; `tiny` marks the 15.6 kHz pair that only runs
// on radios with a TCXO (the device rejects them otherwise).
export const RADIO_PRESETS = [
  { name: 'LongFast',    label: 'Long Fast',     bw: 250,  sf: 11, cr: 5 },
  { name: 'LongMod',     label: 'Long Moderate', bw: 125,  sf: 11, cr: 8 },
  { name: 'LongSlow',    label: 'Long Slow',     bw: 125,  sf: 12, cr: 8 },
  { name: 'LongTurbo',   label: 'Long Turbo',    bw: 500,  sf: 11, cr: 8 },
  { name: 'MediumFast',  label: 'Medium Fast',   bw: 250,  sf: 9,  cr: 5 },
  { name: 'MediumSlow',  label: 'Medium Slow',   bw: 250,  sf: 10, cr: 5 },
  { name: 'MediumTurbo', label: 'Medium Turbo',  bw: 500,  sf: 9,  cr: 5 },
  { name: 'ShortFast',   label: 'Short Fast',    bw: 250,  sf: 7,  cr: 5 },
  { name: 'ShortSlow',   label: 'Short Slow',    bw: 250,  sf: 8,  cr: 5 },
  { name: 'ShortTurbo',  label: 'Short Turbo',   bw: 500,  sf: 7,  cr: 5 },
  { name: 'LiteFast',    label: 'Lite Fast',     bw: 125,  sf: 9,  cr: 5 },
  { name: 'LiteSlow',    label: 'Lite Slow',     bw: 125,  sf: 10, cr: 5 },
  { name: 'NarrowFast',  label: 'Narrow Fast',   bw: 62.5, sf: 7,  cr: 6 },
  { name: 'NarrowSlow',  label: 'Narrow Slow',   bw: 62.5, sf: 8,  cr: 6 },
  { name: 'TinyFast',    label: 'Tiny Fast',     bw: 15.6, sf: 7,  cr: 5, tiny: true },
  { name: 'TinySlow',    label: 'Tiny Slow',     bw: 15.6, sf: 8,  cr: 6, tiny: true },
]

// Firmware limits: MESH_CHANNELS is 10 (8 on the Cardputer), and Meshtastic
// channel names are at most 11 bytes.
export const MAX_CHANNELS = 10
export const CHANNEL_NAME_MAX = 11

// The splash card colour (Camillia Dark panelBg), for the preview. Applying
// uses the colour the device reports.
export const SPLASH_CARD_BG = '#100C29'

// A channel: psk is 'default' (AQ==), 'none', or a base64 key of 1, 16 or 32
// bytes. An empty primary name means "named after the preset".
const PRIMARY_CHANNEL = { name: '', psk: 'default', pos: true, up: true, down: false }
const secondary = (name, psk, mqtt = false) => ({ name, psk, pos: false, up: mqtt, down: mqtt })
// A primary channel with its own name and key, as Freq51's.
const namedPrimary = (name, psk) => ({ ...PRIMARY_CHANNEL, name, psk })
const CHICAGO_PSK = 'H1HDyEqg5W9XFilicVTIaoWYrs8URmWGo5fAYfbxQgo='

export function newChannel(index) {
  return index === 0 ? { ...PRIMARY_CHANNEL } : secondary('', 'default')
}

// Community setups, as published by each mesh. Only what the flasher can set
// is here; `notes` lists the rest of their advice. A mesh is listed only when
// its radio is a stock preset, on its default frequency slot or the one in
// `slot` (1-based, as the Meshtastic apps number them). The flasher cannot set
// a frequency that is not on a slot, so MeshOregon, YYCMesh and Spain are left
// out. An empty `preset` keeps the device's own; `url` is optional. Logos are
// rendered from each community's own SVG
// (chicagolandmesh.org/assets/images/logo-clear.svg,
// michmesh.net/img/michmesh-logo-dark.svg).
export const PROFILES = [
  {
    id: 'chimesh',
    area: 'United States',
    label: 'ChiMesh (Chicagoland)',
    url: 'https://chicagolandmesh.org/guides/meshtastic/getting-started/configure/',
    preset: 'LongFast',
    region: 'US',
    logo: withBase('/logos/chimesh.png'),
    channels: [PRIMARY_CHANNEL, secondary('Chicago', CHICAGO_PSK)],
    notes: 'ChiMesh also recommends hop limit 7, a 3-hour NodeInfo interval and MQTT via mqtt.chimesh.org (root topic msh/US/IL/Chi); set those on the device.',
  },
  {
    id: 'michmesh',
    area: 'United States',
    label: 'MichMesh (Michigan)',
    url: 'https://michmesh.net/docs/Meshtastic/Getting%20Started',
    preset: 'LongFast',
    region: 'US',
    logo: withBase('/logos/michmesh.png'),
    channels: [
      PRIMARY_CHANNEL,
      secondary('Michigan', 'MA=='),
      secondary('WMI', 'MA=='),
      secondary('EMI', 'MA=='),
      secondary('Muskegon', 'MA=='),
      secondary('NMI', 'MA=='),
      secondary('YOOPER', 'MA=='),
      secondary('Washtenaw', 'MA=='),
      secondary('W8ZHO', 'none'),
      secondary('Chicago', CHICAGO_PSK),
    ],
    notes: 'W8ZHO and Chicago come from Muskegon Mesh. Ten channels need a device with ten slots (the Cardputer has eight). MichMesh also recommends "OK to MQTT" with root topic msh/US/MI; set that on the device.',
  },
  {
    id: 'iowamesh',
    area: 'United States',
    label: 'Iowa Mesh (Iowa)',
    preset: 'LongFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL, secondary('IROMesh', '7V8jZEvMrVrEXx/c8UekOwE+tSlWaWNffKr6zBtQo/A=')],
    notes: 'Iowa Mesh runs its own MQTT broker, mqtt.iowamesh.net port 8882 (user iromesh, password 2Gab9eAz, root topic iromesh, JSON on, encryption off); set that on the device.',
  },
  {
    id: 'meshstl',
    area: 'United States',
    label: 'MeshSTL (St. Louis)',
    preset: 'LongTurbo',
    region: 'US',
    channels: [
      PRIMARY_CHANNEL,
      secondary('MeshSTL', 'Rqe4phFE+/ydX1jdHMq7ttwlXTqYqRxj35Of3D6o1PE='),
      secondary('MeshSTL-EAS', 'default'),
      secondary('ILMesh-EAS', 'default'),
      secondary('MAC-EAS', 'default'),
      secondary('Rolla-EAS', 'default'),
    ],
    notes: 'The -EAS channels carry emergency alerts. MeshSTL\'s MQTT broker is mqtt.meshstl.org port 1883 (user MeshSTL, password meshstl, root topic msh/US/MeshSTL); set that on the device.',
  },
  {
    id: 'lzmesh',
    area: 'United States',
    label: 'LZMesh (SW Missouri)',
    preset: '',
    region: 'US',
    channels: [
      PRIMARY_CHANNEL,
      secondary('LZMesh', 'uLT6S8kQlQHjA7yEtBkzIj3zm6K6lE55mulplDZyF/0=', true),
      secondary('LZRF', 'dTEweE82YjhWc1pRS1dzY1FESEk4dnlBcVM2SUxmV3c='),
    ],
    notes: 'LZMesh doesn\'t publish its radio preset, so the device keeps its own. LZRF stays on the radio; LZMesh also goes to MQTT, via mqtt.lzmesh.com (meshdev / large4cats, root topic msh/LZ); set that on the device.',
  },
  {
    id: 'pugetmesh',
    area: 'United States',
    label: 'Puget Mesh (Seattle)',
    preset: 'LongFast',
    region: 'US',
    channels: [
      PRIMARY_CHANNEL,
      secondary('PS-Mesh!', 'jHrxpQOq6dEBC5Ldr3ULrQ=='),
      secondary('PS-MQTT!', 'mqttmqttmqttmqttmqttQQ==', true),
    ],
    notes: 'PS-MQTT! is relayed to Puget Mesh\'s Discord. Their broker is meshtastic.pugetmesh.org (meshdev / large4cats, root topic msh/US); set that on the device.',
  },
  {
    id: 'floridamesh',
    area: 'United States',
    label: 'Florida Mesh (Florida)',
    url: 'https://areyoumeshingwith.us/docs/meshtastic/regional-lora-settings/',
    preset: 'LongFast',
    region: 'US',
    channels: [
      PRIMARY_CHANNEL,
      secondary('FloridaMesh', 'ZdCyZ4ent/NZyeXvNjtBvrrp0lClodUyhYpVL4xshnA=', true),
      secondary('emergency', 'default'),
      secondary('weather', 'default'),
      secondary('testing', 'default'),
      secondary('telemetry', 'default'),
    ],
    notes: 'Long Fast is the statewide preset; Southeast Florida runs Medium Fast. MQTT is mqtt.areyoumeshingwith.us with a per-user login from their Discord bot (root topic msh/US/FL).',
  },
  {
    id: 'ctmesh',
    area: 'United States',
    label: 'CT Mesh (Connecticut)',
    preset: 'LongFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL, secondary('ConnNet', 'pJgk5XqJY8Ar+jSqC5W81g==')],
    notes: 'CT Mesh\'s broker, mqtt.ctmesh.org (meshdev / large4cats, root topic msh/US/CT), takes uplink only; set that on the device.',
  },
  {
    id: 'nwimesh',
    area: 'United States',
    label: 'NWI Mesh Net (NW Indiana)',
    url: 'https://nwimesh.net/local-encrypted-channel',
    preset: 'LongFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL, { ...secondary('Testing', 'default'), up: true }, secondary('NWI', CHICAGO_PSK)],
    notes: 'NWI shares its key with ChiMesh\'s Chicago channel. It recommends hop limit 7 and its broker, mqtt.nwimesh.net (meshdev / large4cats, root topic msh/US/IN/NWI); set those on the device.',
  },
  {
    id: 'bostonmesh',
    area: 'United States',
    label: 'Greater Boston Mesh (Boston)',
    url: 'https://bostonme.sh/meshtastic',
    preset: 'LongFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'Greater Boston Mesh uses the default channel. Its broker is mqttmt01.bostonme.sh port 1883 (meshdev / large4cats, root topic msh/US/MA); set that on the device.',
  },
  {
    id: 'centralvalley',
    area: 'United States',
    label: 'Central Valley Mesh (Central CA)',
    url: 'https://centralvalleymesh.net/',
    preset: '',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'Central Valley Mesh runs Long Fast or Medium Fast depending on the area, so the device keeps its own; ask in their Discord. Their community channel CVM is shared there too. The broker is mqtt.cvme.sh (cvmesh / large4dogs, root topic msh/US/CA/centralvalley); set that on the device.',
  },
  {
    id: 'freq51',
    area: 'United States',
    label: 'Freq51 (Utah and Idaho)',
    url: 'https://freq51.net/channels',
    preset: 'MediumFast',
    slot: 51,
    region: 'US',
    channels: [
      namedPrimary('Freq51', '1A=='),
      secondary('MediumFast', 'default'),
      secondary('DC801', 'MHHa9wlKe4chJ01SuTKt1RnqbSXv4UJNAP+ONcKfa0c='),
      secondary('SAINTCON', 'dFa5cC4GuZ9AnFgPKzBjzqO6Ch8doQdOMqzwlmEff0Q='),
      secondary('2ndStarLabs', 'BRdqPvLgcJKPN5BBCHUVxU6YavR11R3HAoy5wSZdSqc='),
      secondary('IDAlerts', 'EdYPaoEzYapldDMwSIeYaLuOVhEqAj5S0Hm5owRoWEg='),
      secondary('IDEmergency', 'z/N/1qMBO9LubPEQ7tjOZfUrFuRCmni2OosuNgHpgJM='),
      secondary('BBBB-Alerts', 'none'),
    ],
    notes: 'Freq51 runs Medium Fast on slot 51 (914.625 MHz) with hop limit 7. Its MQTT root topic is msh/US/UT, uplink on and downlink off; the server is shared on their Discord.',
  },
  {
    id: 'nymesh',
    area: 'United States',
    label: 'nyme.sh (New York City)',
    preset: 'MediumSlow',
    slot: 48,
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'nyme.sh\'s broker is mqtt.nyme.sh (meshdev / large4cats, root topic msh/US/NY) and takes no downlink; set that on the device.',
  },
  {
    id: 'nova',
    area: 'United States',
    label: 'NoVA (Northern Virginia)',
    preset: 'LongFast',
    slot: 9,
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'Slot 9 comes from a single source; check with the local mesh.',
  },
  {
    id: 'showmemesh',
    area: 'United States',
    label: 'Show Me Mesh (Jefferson City, MO)',
    preset: 'MediumSlow',
    slot: 1,
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: '',
  },
  {
    id: 'meshavl',
    area: 'United States',
    label: 'MeshAVL (Asheville, NC)',
    preset: '',
    region: 'US',
    channels: [PRIMARY_CHANNEL, secondary('MeshAVL', 'PLUCMx82+f/2etr+yoFXuQ==')],
    notes: 'MeshAVL doesn\'t publish its radio preset, so the device keeps its own.',
  },
  {
    id: 'nhmesh',
    area: 'United States',
    label: 'NHMesh (New Hampshire)',
    preset: '',
    region: 'US',
    channels: [PRIMARY_CHANNEL, secondary('NHMesh', 'NA==')],
    notes: 'NHMesh doesn\'t publish its radio preset, so the device keeps its own.',
  },
  {
    id: 'mountainmesh',
    area: 'United States',
    label: 'Mountain Mesh (Atlanta)',
    preset: 'MediumFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: '',
  },
  {
    id: 'baymesh',
    area: 'United States',
    label: 'BayMesh (SF Bay Area)',
    url: 'https://bayme.sh/docs/public-channels/',
    preset: 'MediumFast',
    region: 'US',
    channels: [
      PRIMARY_CHANNEL,
      secondary('NoBots', 'NQ=='),
      secondary('Ham', 'CQ=='),
      secondary('MeshQuake', 'EQ=='),
      secondary('BayMeshNews', '5g=='),
      secondary('SF', 'SA=='),
      secondary('Oakland', 'OA=='),
      secondary('Berkeley', 'none'),
      secondary('CRUZ', 'NA=='),
      secondary('Test', 'TQ=='),
    ],
    notes: 'BayMesh lists more public channels than fit (First 1A==, Retro eQ==, Boozin\' ew==, TheBadPlace 5g==). It recommends hop limit 4 for relays and 6 for handhelds, and its broker is mqtt.bayme.sh (meshdev / large4cats, root topic msh/US/bayarea); set those on the device. Ten channels need a device with ten slots (the Cardputer has eight).',
  },
  {
    id: 'socalmesh',
    area: 'United States',
    label: 'SoCal Mesh (Southern California)',
    url: 'https://socalmesh.org/',
    preset: 'LongTurbo',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'Long Turbo on slot 14 is what SoCal Mesh\'s home page recommends; its older best-practices page still says Long Fast on slot 20. Their broker is mqtt.socalmesh.org (meshdev / large4cats, root topic msh/US/CA/socalmesh); set that on the device.',
  },
  {
    id: 'phillymesh',
    area: 'United States',
    label: 'PhillyMesh (Philadelphia)',
    preset: 'LongTurbo',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: '',
  },
  {
    id: 'denver',
    area: 'United States',
    label: 'Denver',
    preset: 'MediumFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'Colorado Mesh uses the official broker with root topic msh/US/CO; set that on the device.',
  },
  {
    id: 'mspmesh',
    area: 'United States',
    label: 'MSP Mesh (Twin Cities)',
    url: 'https://mspmesh.org/settings/',
    preset: 'MediumFast',
    region: 'US',
    channels: [PRIMARY_CHANNEL],
    notes: 'MSP Mesh suggests 3 to 5 hops inside the 494/694 loop; set that on the device.',
  },
  {
    id: 'mbug',
    area: 'Americas and Asia-Pacific',
    label: 'MBUG (Brisbane)',
    preset: 'MediumFast',
    region: 'ANZ',
    channels: [
      PRIMARY_CHANNEL,
      secondary('Weather', 'default'),
      secondary('POTA', '4l7IvHA1aIA+zCw0alSTCiGelsh30JqFHRxBEUFGIZ0='),
      secondary('Meshergex', 'MQ=='),
      secondary('Alert', 'none'),
    ],
    notes: 'MBUG publishes the Meshergex and Alert keys as MX== and AL==, which are the same keys as MQ== and none. Their broker is mqtt.mbug.com.au (mbug / small4dogs, root topic msh/ANZ); set that on the device.',
  },
  {
    id: 'nz-shortfast',
    area: 'Americas and Asia-Pacific',
    label: 'Auckland, Waikato, Wellington (NZ)',
    preset: 'ShortFast',
    region: 'ANZ',
    channels: [PRIMARY_CHANNEL],
    notes: 'The rest of New Zealand runs Long Fast.',
  },
  {
    id: 'mesharg',
    area: 'Americas and Asia-Pacific',
    label: 'MeshArg (Argentina)',
    preset: '',
    region: 'ANZ',
    channels: [
      PRIMARY_CHANNEL,
      secondary('BairesMesh', 'aB3K7ZIciBKq49nxn5gVmPQEtbTUVZOHKxuCaCKaHtA='),
      secondary('RosarioMesh', 'kss+4MMhc9unauU8i6bix0Lt/pkjWMv1PIFr0fH8g58='),
      secondary('NQNmesh', 'B7jYDJLWy9TSnajWI/yAJETLBcjN2RNXUU4jS4eRyJo='),
      secondary('CordobaMesh', 'CoRd0B4lHaBoN6OWT0u2EvNX9Jci7gsIiIJtD30BCCw='),
      secondary('ERMesh', 'w9nTAUTYp2eFo7KyCfo5a42YSM4ewfrV/PSoxcjrAPI='),
      secondary('MendozaMesh', 'yVyN1359YQb0S1LW2cslgMrXHbTkHnR1TSHYDa7VCCs='),
    ],
    notes: 'The radio preset differs by city, so the device keeps its own; BairesMesh runs Medium Fast. MeshArg asks for no MQTT on its networks.',
  },
  {
    id: 'meshtw',
    area: 'Americas and Asia-Pacific',
    label: 'MeshTW (Taiwan)',
    url: 'https://hackmd.io/@NeoChen1024/By4pGMZvle',
    preset: 'MediumFast',
    slot: 1,
    region: 'TW',
    channels: [PRIMARY_CHANNEL],
    notes: 'Taiwan\'s community moved from Long Fast to Medium Fast on slot 1 (920.125 MHz), furthest from the LTE band. Their MQTT root topic is msh/TW.',
  },
  {
    id: 'italia',
    area: 'Europe',
    label: 'Meshtastic Italia (Italy)',
    preset: 'MediumFast',
    region: 'EU_868',
    channels: [
      PRIMARY_CHANNEL,
      secondary('Italia', 'mQ=='),
      secondary('RRP', 'bFFpanZJWVkwZVFXaW1oTnhaT2U2bGYwb0l6Mkd4Szg='),
      secondary('AllerteRRP', '1SFJZEJnA1ACu8DP0hps2jqZ9QOHp7ZEXKmqf6gcEGU='),
    ],
    notes: 'Medium Fast is the preset across Italy. RRP and AllerteRRP are a partner network\'s channels.',
  },
  {
    id: 'meshhessen',
    area: 'Europe',
    label: 'Mesh Hessen (Germany)',
    preset: 'ShortSlow',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL, secondary('Mesh Hessen', '+uTMEaOR7hkqaXv+DROOEd5BhvAIQY/CZ/Hr4soZcOU=')],
    notes: 'Mesh Hessen\'s broker is mqtt.meshhessen.de (meshhessen / meshhessen, root topic msh/EU_868); set that on the device.',
  },
  {
    id: 'gaulix',
    area: 'Europe',
    label: 'Gaulix (France)',
    url: 'https://gaulix.fr/docs-parametrage/parametrage-rapide-flash-reglages-ajout-de-canaux-via-qr-code/',
    preset: 'LongMod',
    slot: 1,
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL],
    notes: 'Gaulix runs Long Moderate at 869.4625 MHz (slot 1). Its channels come from the QR codes on its site; add them on the device. MQTT is per-user (root topic msh/EU_868).',
  },
  {
    id: 'berlin',
    area: 'Europe',
    label: 'Berlin Mesh (Berlin)',
    preset: 'MediumFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL, secondary('TEST', 'default')],
    notes: '',
  },
  {
    id: 'portugal',
    area: 'Europe',
    label: 'Meshtastic Portugal',
    url: 'https://meshtastic.pt/channels',
    preset: 'LongFast',
    region: 'EU_868',
    channels: [
      PRIMARY_CHANNEL,
      secondary('SOS', 'default', true),
      secondary('Iberia', 'default', true),
      secondary('Portugal_RF', 'default'),
      secondary('MFTest', 'default', true),
    ],
    notes: 'Portugal_RF stays on the radio. The community also publishes a channel for each district (see their channel list), uses a hop limit of 4 and runs its own broker, mqtt.meshtastic.pt (meshdev / large4cats, root topic msh); set those on the device.',
  },
  {
    id: 'finland',
    area: 'Europe',
    label: 'MeshAbout.fi (Finland)',
    preset: 'LongFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL, secondary('Radio', 'none'), secondary('Radio&MQTT', 'MQ==', true)],
    notes: 'Radio is unencrypted and stays on the radio; Radio&MQTT also goes to MQTT (root topic msh/EU_868/FI).',
  },
  {
    id: 'hungary',
    area: 'Europe',
    label: 'Hungary (868 MHz)',
    preset: 'MediumFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL, secondary('Hungary', 'default')],
    notes: 'Hungary\'s 433 MHz network is on a frequency the flasher cannot set. The community broker is mqtt.creativo.hu (meshdev / large4cats, root topic msh/EU_868/HU).',
  },
  {
    id: 'hungary-433',
    area: 'Europe',
    label: 'Hungary (433 MHz)',
    preset: 'LongFast',
    slot: 1,
    region: 'EU_433',
    channels: [PRIMARY_CHANNEL, secondary('Hungary', 'default')],
    notes: 'Long Fast at 433.125 MHz (slot 1). The broker is mqtt.creativo.hu (meshdev / large4cats, root topic msh/EU_433/HU).',
  },
  {
    id: 'kyiv',
    area: 'Europe',
    label: 'Kyiv (433 MHz)',
    preset: 'LongFast',
    slot: 1,
    region: 'EU_433',
    channels: [PRIMARY_CHANNEL],
    notes: 'Long Fast at 433.125 MHz (slot 1).',
  },
  {
    id: 'switzerland',
    area: 'Europe',
    label: 'Switzerland',
    preset: 'MediumFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL],
    notes: '',
  },
  {
    id: 'stockholm',
    area: 'Europe',
    label: 'Stockholm',
    url: 'https://meshat.se/meshtastic/cli-konfiguration-fran-grunden/',
    preset: 'MediumFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL],
    notes: 'Meshat.se\'s broker is mqtt.meshat.se (msh / msh, root topic msh/SE); set that on the device.',
  },
  {
    id: 'warsaw',
    area: 'Europe',
    label: 'Warsaw',
    preset: 'MediumFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL],
    notes: '',
  },
  {
    id: 'austria',
    area: 'Europe',
    label: 'Austria',
    preset: 'LongFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL],
    notes: '',
  },
  {
    id: 'uk',
    area: 'Europe',
    label: 'United Kingdom',
    preset: 'LongFast',
    region: 'EU_868',
    channels: [PRIMARY_CHANNEL],
    notes: 'The UK uses the EU 868 MHz region; leave Override Duty Cycle off.',
  },
]

// The "Start from" list's groups, in order.
export const PROFILE_AREAS = [...new Set(PROFILES.map(p => p.area))]

// "MichMesh (Michigan)" -> "MichMesh".
export function profileName(profile) {
  return profile.label.replace(/\s*\(.*\)$/, '')
}

// What choosing a profile fills in, for the note under the list.
export function profileFills(profile) {
  const parts = [profile.preset && 'radio preset', profile.slot && 'frequency slot', 'channels', profile.logo && 'logo'].filter(Boolean)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
}

// On-device setup's questions. Mirrors kRegions in camillia-mt's
// src/config_io.cpp and kOnboardRoles in src/main_lvgl.cpp.
export const REGIONS = [
  { code: 'US', label: 'United States (902–928 MHz)' },
  { code: 'EU_868', label: 'Europe 868 MHz' },
  { code: 'EU_433', label: 'Europe 433 MHz' },
  { code: 'EU_866', label: 'Europe 866 MHz (Lite)' },
  { code: 'EU_N_868', label: 'Europe 868 MHz (Narrow)' },
  { code: 'ANZ', label: 'Australia / New Zealand 915 MHz' },
  { code: 'ANZ_433', label: 'Australia / New Zealand 433 MHz' },
  { code: 'NZ_865', label: 'New Zealand 865 MHz' },
  { code: 'BR_902', label: 'Brazil 902 MHz' },
  { code: 'CN', label: 'China 470 MHz' },
  { code: 'IN', label: 'India 865 MHz' },
  { code: 'JP', label: 'Japan 920 MHz' },
  { code: 'KR', label: 'Korea 920 MHz' },
  { code: 'KZ_433', label: 'Kazakhstan 433 MHz' },
  { code: 'KZ_863', label: 'Kazakhstan 863 MHz' },
  { code: 'MY_433', label: 'Malaysia 433 MHz' },
  { code: 'MY_919', label: 'Malaysia 919 MHz' },
  { code: 'NP_865', label: 'Nepal 865 MHz' },
  { code: 'PH_433', label: 'Philippines 433 MHz' },
  { code: 'PH_868', label: 'Philippines 868 MHz' },
  { code: 'PH_915', label: 'Philippines 915 MHz' },
  { code: 'RU', label: 'Russia 868 MHz' },
  { code: 'SG_923', label: 'Singapore 923 MHz' },
  { code: 'TH', label: 'Thailand 920 MHz' },
  { code: 'TW', label: 'Taiwan 920 MHz' },
  { code: 'UA_433', label: 'Ukraine 433 MHz' },
  { code: 'UA_868', label: 'Ukraine 868 MHz' },
  { code: 'LORA_24', label: '2.4 GHz (SX128x radios only)' },
]

export const ROLES = [
  { name: 'CLIENT_MUTE', label: 'Client Mute', note: 'Sends and receives, but does not relay. Setup\'s default.' },
  { name: 'CLIENT', label: 'Client', note: 'Sends, receives and relays for others.' },
  { name: 'TRACKER', label: 'Tracker', note: 'Prioritises sending its position.' },
  { name: 'CLIENT_HIDDEN', label: 'Client Hidden', note: 'Sends only what it must; stays out of node lists.' },
]

// Firmware limits: Meshtastic names are at most 24 (long) and 4 (short)
// bytes; the Wi-Fi fields hold 63.
export const LONG_NAME_MAX = 24
export const SHORT_NAME_MAX = 4
const WIFI_MAX = 63

// Blank names: the device names itself from its node ID ("Camillia 1a2b").
// The Wi-Fi password is never remembered in the browser.
export function newSetup() {
  return { longName: '', shortName: '', region: 'US', role: 'CLIENT_MUTE', wifiSsid: '', wifiPass: '' }
}

export const EMPTY_CUSTOMIZATION = { preset: '', slot: 0, channels: null, logo: '', setup: null }

export const SLOT_MAX = 255

const STORAGE_KEY = 'camillia.customize'

function base64Bytes(text) {
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
    return bin.length
  } catch {
    return -1
  }
}

export function channelNameBytes(name) {
  return new TextEncoder().encode(name).length
}

// '' when the channel is valid, otherwise why not.
export function channelError(channel, index) {
  const name = channel.name.trim()
  if (channelNameBytes(name) > CHANNEL_NAME_MAX) return `Names are at most ${CHANNEL_NAME_MAX} bytes.`
  if (index > 0 && !name) return 'Give the channel a name.'
  if (channel.psk !== 'default' && channel.psk !== 'none' && ![1, 16, 32].includes(base64Bytes(channel.psk.trim()))) {
    return 'The key must be base64 of 1, 16 or 32 bytes.'
  }
  return ''
}

function utf8Bytes(text) {
  return new TextEncoder().encode(text).length
}

// { field: why } for the setup fields that are not valid; {} when all are.
export function setupErrors(setup) {
  const out = {}
  if (!setup) return out
  if (utf8Bytes(setup.longName.trim()) > LONG_NAME_MAX) out.longName = `At most ${LONG_NAME_MAX} bytes.`
  if (utf8Bytes(setup.shortName.trim()) > SHORT_NAME_MAX) out.shortName = `At most ${SHORT_NAME_MAX} bytes.`
  if (!REGIONS.some(r => r.code === setup.region)) out.region = 'Pick a region.'
  if (utf8Bytes(setup.wifiSsid) > WIFI_MAX) out.wifiSsid = `At most ${WIFI_MAX} bytes.`
  if (setup.wifiSsid && setup.wifiPass && (setup.wifiPass.length < 8 || utf8Bytes(setup.wifiPass) > WIFI_MAX)) {
    out.wifiPass = 'A WPA password is 8 to 63 characters; leave it empty for an open network.'
  }
  return out
}

export function customizationInvalid(settings) {
  return customizationErrors(settings).some(Boolean) || Object.keys(setupErrors(settings?.setup)).length > 0
    || Boolean(slotError(settings?.slot))
}

export function slotError(slot) {
  return Number.isInteger(slot) && slot >= 0 && slot <= SLOT_MAX ? '' : `The slot must be a whole number from 0 to ${SLOT_MAX}.`
}

export function customizationErrors(settings) {
  if (!settings.channels) return []
  return settings.channels.map(channelError)
}

export function randomPsk(bytes = 32) {
  const key = crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...key))
}

function cleanChannel(raw, index) {
  const base = newChannel(index)
  if (!raw || typeof raw !== 'object') return base
  return {
    name: typeof raw.name === 'string' ? raw.name : base.name,
    psk: typeof raw.psk === 'string' && raw.psk ? raw.psk : base.psk,
    pos: typeof raw.pos === 'boolean' ? raw.pos : base.pos,
    up: typeof raw.up === 'boolean' ? raw.up : base.up,
    down: typeof raw.down === 'boolean' ? raw.down : base.down,
  }
}

export function loadCustomization() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const preset = RADIO_PRESETS.some(p => p.name === saved?.preset) ? saved.preset : ''
    const slot = Number.isInteger(saved?.slot) && saved.slot >= 0 && saved.slot <= SLOT_MAX ? saved.slot : 0
    const channels = Array.isArray(saved?.channels) && saved.channels.length
      ? saved.channels.slice(0, MAX_CHANNELS).map(cleanChannel)
      : null
    const logo = saved?.logo === 'clear' || /^data:image\/png;base64,/.test(saved?.logo ?? '') ? saved.logo : ''
    const raw = saved?.setup
    const setup = raw && typeof raw === 'object'
      ? {
          ...newSetup(),
          ...Object.fromEntries(['longName', 'shortName', 'wifiSsid']
            .filter(k => typeof raw[k] === 'string').map(k => [k, raw[k]])),
          region: REGIONS.some(r => r.code === raw.region) ? raw.region : 'US',
          role: ROLES.some(r => r.name === raw.role) ? raw.role : 'CLIENT_MUTE',
        }
      : null
    return { ...EMPTY_CUSTOMIZATION, preset, slot, channels, logo, setup }
  } catch {
    return { ...EMPTY_CUSTOMIZATION }
  }
}

// False when the browser would not keep it (a large logo can exceed the quota).
export function saveCustomization(settings) {
  try {
    const kept = settings.setup ? { ...settings, setup: { ...settings.setup, wifiPass: '' } } : settings
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kept))
    return true
  } catch {
    return false
  }
}

export function customizationCount(settings) {
  return (settings?.preset ? 1 : 0) + (settings?.channels ? 1 : 0) + (settings?.logo ? 1 : 0)
    + (settings?.setup ? 1 : 0)
}

export function presetLabel(name) {
  return RADIO_PRESETS.find(p => p.name === name)?.label ?? name
}

// Parses "[cfg] caps v=1 firstboot=1 keys=preset,channels,logo channels=10
// logo=296x60 logobg=100C29 logomax=8192 presets=LongFast,LongMod".
export function parseCaps(line) {
  const out = { version: 0, firstBoot: false, keys: [], presets: [], channels: 0, logo: null }
  const body = line.slice(line.indexOf('[cfg] caps') + '[cfg] caps'.length)
  for (const token of body.trim().split(/\s+/)) {
    const eq = token.indexOf('=')
    if (eq < 0) continue
    const key = token.slice(0, eq)
    const value = token.slice(eq + 1)
    if (key === 'v') out.version = Number(value) || 0
    else if (key === 'firstboot') out.firstBoot = value === '1'
    else if (key === 'keys') out.keys = value.split(',').filter(Boolean)
    else if (key === 'presets') out.presets = value.split(',').filter(Boolean)
    else if (key === 'channels') out.channels = Number(value) || 0
    else if (key === 'logo') {
      const [w, h] = value.split('x').map(Number)
      if (w > 0 && h > 0) out.logo = { ...out.logo, width: w, height: h }
    } else if (key === 'logobg' && /^[0-9a-f]{6}$/i.test(value)) out.logo = { ...out.logo, bg: `#${value}` }
    else if (key === 'logomax') out.logo = { ...out.logo, maxBytes: Number(value) || 0 }
  }
  if (out.logo && !(out.logo.width && out.logo.height && out.logo.maxBytes)) out.logo = null
  return out
}

// Percent-encodes everything but plain ASCII, so a name survives a
// space-separated line; the firmware decodes it byte for byte.
export function percentEncode(name) {
  return Array.from(new TextEncoder().encode(name), b =>
    /[A-Za-z0-9_.~-]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : `%${b.toString(16).toUpperCase().padStart(2, '0')}`
  ).join('')
}

export function channelCommand(channel, index) {
  const role = index === 0 ? 'primary' : 'secondary'
  const psk = channel.psk === 'default' || channel.psk === 'none' ? channel.psk : channel.psk.trim()
  return `cfg set channel ${index} role=${role} name=${percentEncode(channel.name.trim())} psk=${psk}`
    + ` pos=${channel.pos ? 1 : 0} up=${channel.up ? 1 : 0} down=${channel.down ? 1 : 0}`
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes) {
  let crc = 0xFFFFFFFF
  for (const b of bytes) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new CustomizeError('That file could not be read as an image.'))
    img.src = src
  })
}

function canvasPng(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

// Turns a chosen file (or a same-origin image URL) into a PNG data URL small
// enough to remember in the browser; the device-sized version is made at apply
// time.
export async function prepareLogoSource(source) {
  const isUrl = typeof source === 'string'
  const url = isUrl ? source : URL.createObjectURL(source)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, 640 / img.naturalWidth, 320 / img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    if (!isUrl) URL.revokeObjectURL(url)
  }
}

// Fits the logo to the device's box, flattened onto the card colour (the
// splash has no alpha to blend with), shrinking until it fits in NVS.
export async function renderLogoForDevice(dataUrl, box) {
  const img = await loadImage(dataUrl)
  let scale = Math.min(1, box.width / img.naturalWidth, box.height / img.naturalHeight)
  for (let attempt = 0; attempt < 12; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = box.bg || SPLASH_CARD_BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await canvasPng(canvas)
    if (blob && blob.size <= box.maxBytes) return new Uint8Array(await blob.arrayBuffer())
    scale *= 0.85
  }
  throw new CustomizeError('The logo is too detailed to fit on the device. Try a simpler image.')
}

const LOGO_CHUNK_BYTES = 112   // 224 hex characters: inside the device's 256-byte line

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// The device may still be booting from the flash, or be reset by the port
// opening, so caps is retried until it answers or this runs out.
const PROBE_WINDOW_MS = 20_000
const PROBE_INTERVAL_MS = 1_500
const REPLY_TIMEOUT_MS = 4_000

export class CustomizeError extends Error {}

// Applies `settings` to an already-opened port. `log` receives progress text.
// Resolves to { firstBoot, outcome } where outcome is the commit's last word:
// 'setup' (held until on-device setup completes), 'rebooting', 'unchanged'.
export async function applyCustomization(port, settings, log = () => {}) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = port.readable.getReader()
  const writer = port.writable.getWriter()
  const waiters = new Set()
  let pending = ''
  let closed = false
  let committed = false

  const pump = (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        pending += decoder.decode(value, { stream: true })
        const lines = pending.split(/\r?\n/)
        pending = lines.pop() ?? ''
        for (const line of lines) {
          for (const waiter of [...waiters]) {
            if (waiter.match(line)) {
              waiters.delete(waiter)
              waiter.resolve(line)
            }
          }
        }
      }
    } catch {}
    closed = true
    for (const waiter of waiters) waiter.resolve(null)
    waiters.clear()
  })()

  function waitForLine(match, timeoutMs) {
    if (closed) return Promise.resolve(null)
    return new Promise(resolve => {
      const waiter = { match, resolve }
      waiters.add(waiter)
      setTimeout(() => {
        if (waiters.delete(waiter)) resolve(null)
      }, timeoutMs)
    })
  }

  const send = text => writer.write(encoder.encode(`${text}\n`))

  async function command(text, match) {
    const reply = waitForLine(match, REPLY_TIMEOUT_MS)
    await send(text)
    const line = await reply
    if (!line) throw new CustomizeError(`The device did not answer "${text}".`)
    return line.slice(line.indexOf('[cfg]'))
  }

  try {
    log('Waiting for the device to answer...')
    let caps = null
    const deadline = Date.now() + PROBE_WINDOW_MS
    while (!caps && Date.now() < deadline && !closed) {
      const reply = waitForLine(
        line => line.includes('[cfg] caps') || /\[cli\] unknown command: cfg/.test(line),
        PROBE_INTERVAL_MS
      )
      await send('\ncfg caps')
      const line = await reply
      if (!line) continue
      if (line.includes('[cli] unknown command')) {
        throw new CustomizeError(
          'This firmware does not support customization. Flash a newer Camillia-MT release and try again.'
        )
      }
      caps = parseCaps(line)
    }
    if (!caps) {
      throw new CustomizeError(
        closed
          ? 'The device disconnected before it answered.'
          : 'The device did not answer. Make sure it has finished booting, then try again.'
      )
    }

    const wants = key => {
      if (caps.keys.includes(key)) return
      throw new CustomizeError(
        `This firmware cannot set the ${{ logo: 'boot logo', setup: 'setup answers', slot: 'frequency slot' }[key] ?? key}. Flash a newer Camillia-MT release and try again.`
      )
    }
    const fail = reply => { throw new CustomizeError(reply.replace(/^\[cfg\] err\s*/, '')) }

    if (settings.preset) {
      if (caps.presets.length && !caps.presets.some(p => p.toLowerCase() === settings.preset.toLowerCase())) {
        throw new CustomizeError(`${presetLabel(settings.preset)} is not supported by this device's radio.`)
      }
      log(`Setting radio preset to ${presetLabel(settings.preset)}...`)
      const set = await command(`cfg set preset ${settings.preset}`, line => /\[cfg\] (ok|err) preset/.test(line))
      if (set.startsWith('[cfg] err')) fail(set)
      if (settings.slot > 0) {
        wants('slot')
        log(`Pinning it to frequency slot ${settings.slot}...`)
        const pinned = await command(`cfg set slot ${settings.slot}`, line => /\[cfg\] (ok|err) slot/.test(line))
        if (pinned.startsWith('[cfg] err')) fail(pinned)
      }
    }

    if (settings.channels) {
      wants('channels')
      if (caps.channels && settings.channels.length > caps.channels) {
        throw new CustomizeError(
          `This device has ${caps.channels} channel slots and you have ${settings.channels.length} channels. Remove ${settings.channels.length - caps.channels} and try again.`
        )
      }
      log(`Setting ${settings.channels.length} channel${settings.channels.length === 1 ? '' : 's'}...`)
      const cleared = await command('cfg channels clear', line => /\[cfg\] (ok|err) channels/.test(line))
      if (cleared.startsWith('[cfg] err')) fail(cleared)
      for (const [index, channel] of settings.channels.entries()) {
        const set = await command(channelCommand(channel, index), line => /\[cfg\] (ok|err) channel/.test(line))
        if (set.startsWith('[cfg] err')) fail(set)
      }
    }

    if (settings.logo === 'clear') {
      wants('logo')
      log('Restoring the default boot flower...')
      const cleared = await command('cfg logo clear', line => /\[cfg\] (ok|err) logo/.test(line))
      if (cleared.startsWith('[cfg] err')) fail(cleared)
    } else if (settings.logo) {
      wants('logo')
      if (!caps.logo) throw new CustomizeError('This device does not show a boot logo.')
      const png = await renderLogoForDevice(settings.logo, caps.logo)
      const begun = await command(`cfg logo begin ${png.length}`, line => /\[cfg\] (ok|err) logo/.test(line))
      if (begun.startsWith('[cfg] err')) fail(begun)
      for (let offset = 0; offset < png.length; offset += LOGO_CHUNK_BYTES) {
        log(`Sending boot logo... ${Math.round((offset / png.length) * 100)}%`)
        const hex = Array.from(png.subarray(offset, offset + LOGO_CHUNK_BYTES), b => b.toString(16).padStart(2, '0')).join('')
        const ack = await command(`cfg logo data ${hex}`, line => /\[cfg\] (ok|err) logo/.test(line))
        if (ack.startsWith('[cfg] err')) fail(ack)
      }
      const ended = await command(`cfg logo end ${crc32(png).toString(16).padStart(8, '0')}`, line => /\[cfg\] (ok|err) logo/.test(line))
      if (ended.startsWith('[cfg] err')) fail(ended)
    }

    if (settings.setup) {
      wants('setup')
      const setup = settings.setup
      const fields = [
        ['region', setup.region],
        ['role', setup.role],
        ['longname', setup.longName.trim() && percentEncode(setup.longName.trim())],
        ['shortname', setup.shortName.trim() && percentEncode(setup.shortName.trim())],
        ['ssid', setup.wifiSsid && percentEncode(setup.wifiSsid)],
      ]
      log('Sending the setup answers...')
      for (const [field, value] of fields) {
        if (!value) continue
        const set = await command(`cfg set ${field} ${value}`, line => new RegExp(`\\[cfg\\] (ok|err) ${field}`).test(line))
        if (set.startsWith('[cfg] err')) fail(set)
      }
      if (setup.wifiSsid) {
        // Sent even when empty, which is an open network: the trailing space
        // is trimmed and the firmware reads the bare `cfg set wifipass` as ''.
        const pass = await command(`cfg set wifipass ${percentEncode(setup.wifiPass)}`, line => /\[cfg\] (ok|err) wifipass/.test(line))
        if (pass.startsWith('[cfg] err')) fail(pass)
      }
    }

    log('Saving on the device...')
    const commit = await command('cfg commit', line => /\[cfg\] (ok|err) (committed|nothing|commit)/.test(line))
    if (commit.startsWith('[cfg] err')) fail(commit)
    const outcome = /applies-after=setup/.test(commit)
      ? 'setup'
      : /setup-done/.test(commit)
        ? 'setup-done'
        : /rebooting/.test(commit)
        ? 'rebooting'
        : 'unchanged'
    committed = true
    return { firstBoot: caps.firstBoot, outcome }
  } finally {
    // Nothing half-sent may be committed by a later attempt.
    if (!committed && !closed) {
      try { await send('cfg abort') } catch {}
    }
    // Give a rebooting device's last line a moment, then let go of the port.
    await delay(100)
    try { await reader.cancel() } catch {}
    await pump
    try { reader.releaseLock() } catch {}
    try { writer.releaseLock() } catch {}
  }
}
