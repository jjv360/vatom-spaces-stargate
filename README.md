# Vatom Plugin: Stargate 🔌

This plugin is designed to be used from within [Vatom Spaces](https://vatom.com). Adds a working Stargate to your space.

## Features

- [ ] Stargate
  - [x] Click to activate (temporary, until DHDs work)
  - [x] Shader-based animation of the event horizon
  - [x] Light effects
  - [x] Sound effects
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

## Gate addresses

I'm attempting to keep this as close to the lore as possible, while still being functional. So gates are addressed by a code which represents where it is in the Metaverse. Gate addresses are created by following this process:
- Create a "point of origin" array, which right now is just `[0]` for Vatom Spaces. In the future maybe this could represent other metaverse platforms...
- Take the X, Y and Z coordinates of the gate, and round it to the nearest 100 meters
- Take the unique ID of the space the gate is in
- Create a string of the form `X:Y:Z:SPACEID` (so separate them by a colon)
- Take a SHA256 hash of the string
- Convert the hash into a BigInt, and then convert it to base 39 (there are 39 glyphs on a stargate)
- Take the first 6 "digits" (which should now be numbers from 0 to 38)
- For each digit, if the digit already exists in the array so far or in the point of origin array, increment the digit by one until it isn't anymore (rolling over if necessary)
- Append the point of origin string to the end of the ID generated so far
- Take the resulting 7 digits and convert them to a string by taking the index of each digit from this string: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-=`
- The resulting string is the gate address. To convert to glyphs for visual representation, see the milky way table [here](https://stargate-sgc.fandom.com/wiki/Glyph).

## Development

- Ensure you have [Node](https://nodejs.org) installed
- Install dependencies with `npm install`
- Login to the Vatom CLI with `npm run login`
- Build and load the plugin into your space with `npm run sideload -- myspace` (replace `myspace` with your space alias name)
- When ready, publish to the Marketplace with `npm run publish`

> **Note:** You can only sideload plugins in a space you are the owner of.
