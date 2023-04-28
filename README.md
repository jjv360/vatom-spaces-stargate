# Vatom Template Plugin 🔌

This plugin is designed to be used from within [Vatom Spaces](https://vatom.com).

## Features

- [ ] Stargate
  - [ ] Click to activate (temporary, until DHDs work)
  - [ ] Shader-based animation of the event horizon
  - [ ] Light effects
  - [ ] Sound effects
  - [ ] Teleport user on enter
- [ ] Stargate network
  - [ ] Give each stargate an automatically generated 9-digit alphabetic address
  - [ ] Create relay server to keep stargates in sync across domains
  - [ ] Activate target stargate in receive mode
- [ ] Standard DHD
  - [ ] Allow activating the nearest stargate with a hardcoded address
  - [ ] Map gate address digits to chevrons
  - [ ] Allow users to dial custom addresses
- [ ] Handheld DHD
  - [ ] See and store nearby gate addresses
  - [ ] Dial a stored address

## Development

- Ensure you have [Node](https://nodejs.org) installed
- Install dependencies with `npm install`
- Login to the Vatom CLI with `npm run login`
- Build and load the plugin into your space with `npm run sideload -- myspace` (replace `myspace` with your space alias name)
- When ready, publish to the Marketplace with `npm run publish`

> **Note:** You can only sideload plugins in a space you are the owner of.
