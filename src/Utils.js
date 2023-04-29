import * as shajs from 'sha.js'

/**
 * Shared vars
 */
export const SharedVars = {

    /** @type {StargatePlugin} Reference to the main plugin instance */
    plugin: null,

    /** The unique ID of the current space */
    spaceID: '',

    /** Plugin instance ID, a random identifier for this instance of the plugin */
    instanceID: Math.random().toFixed(36).substring(2)

}

/**
 * Utility to queue promise actions.
 */
export class Queue {

    /** List of pending actions */
    pending = []

    /** True if currently running */
    isRunning = false

    /** Perform an action */
    do(action) {

        // Add to queue
        this.pending.push(action)

        // Start running if not currently running
        if (!this.isRunning)
            this.startExecution()

    }

    /** @private Start execution of the queue */
    async startExecution() {

        // Start running
        this.isRunning = true

        // Start loop
        while (true) {

            // Get next operation
            let nextAction = this.pending.shift()
            if (!nextAction)
                break

            // Run the action
            try {
                await nextAction()
            } catch (err) {
                console.warn(`[Stargate > Queue] Action failed`, err)
            }

        }

        // Done
        this.isRunning = false

    }

}

/** Create a looping audio player and return the object ID */
export async function createLoopingAudio(src, volume = 1, extraFields = {}) {

    // Create it
    return await SharedVars.plugin.objects.create(Object.assign({

        // Object info
        type: 'group',
        clientOnly: true,

        // Attach media components
        components: [
            { id: 'media-playback:media-source' },
            { id: 'media-playback:audio-destination' },
        ],

        // Media source settings
        'component:media-playback:media-source:src': src,
        'component:media-playback:media-source:loop': true,
        'component:media-playback:media-source:proximity': 40,
        'component:media-playback:media-source:synchronized': 'No',
        'component:media-playback:media-source:autoplay': true,

        // Audio destination settings
        'component:media-playback:audio-destination:volume': volume,
        'component:media-playback:audio-destination:fullVolumeRadius': 1,
        'component:media-playback:audio-destination:silenceRadius': 20,

    }, extraFields))

}

/** Generic animation function. Calls the callback smoothly over time. */
export async function animateValue(from, to, duration, initialDelay, callback) {

    // Do initial delay
    if (initialDelay) 
        await new Promise(c => setTimeout(c, initialDelay))

    // Run it
    let startedAt = Date.now()
    while (true) {

        // Wait a bit
        await new Promise(c => setTimeout(c, 50))

        // Stop if complete
        let now = Date.now()
        if (now > startedAt + duration)
            break

        // Set new value
        let progress = (now - startedAt) / duration
        let current = from + (to - from) * progress
        callback(current)

    }
    
    // Set final value
    callback(to)

}

/** Animate the volume of an audio player */
export async function animateAudioVolume(objectID, fromVolume, toVolume, duration, initialDelay = 0) {

    // Animate
    await animateValue(fromVolume, toVolume, duration, initialDelay, volume => {

        // Set it
        SharedVars.plugin.objects.update(objectID, {
            'component:media-playback:audio-destination:volume': volume
        }, true)

    })

}

/** Generate a stargate address */
export function generateAddress(x, y, z, spaceID, metaverseOrigin = [0]) {

    // Round the address to the nearest 100 meters
    x = Math.round(x / 100) * 100
    y = Math.round(y / 100) * 100
    z = Math.round(z / 100) * 100

    // Create point of origin
    let pointOfOrigin = metaverseOrigin

    // Create address string
    let address = `${x}:${y}:${z}:${spaceID}`

    // Get the SHA256 of the address
    let shaHex = shajs('sha256').update(address).digest('hex')

    // Get an array of digits in base10
    let shaInt = BigInt("0x" + shaHex)
    let shaDigitsBase10 = shaInt.toString(10).split('').map(s => parseInt(s))

    // Convert to an array of digits in base 39 and take the first 6 digits
    let digits = convertToBase39(shaDigitsBase10).slice(0, 6)

    // For each digit, ensure it doesn't already exist. If it does, increment it until it doesn't.
    for (let i = 0 ; i < digits.length ; i++) {

        // Get the digit
        let digit = digits[i]

        // Check and increment
        while (pointOfOrigin.includes(digit) || digits.slice(0, i).includes(digit)) {
            digit += 1
            if (digit >= 39) digit = 0
            digits[i] = digit
        }

    }

    // Add the point of origin to the end
    digits = digits.concat(pointOfOrigin)

    // Convert to a string, then we're done
    return digits.map(n => GlyphMap[n]).join('')

}

/** Glyph map */
export const GlyphMap = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-="

/** Convert an array of digits in base 10 to an array of digits in base 39 ... thanks ChatGPT for this */
function convertToBase39(digits) {
    const base39Chars = GlyphMap;
    let base39Number = "";
  
    let quotients = [0];
    for (let i = digits.length - 1; i >= 0; i--) {
      let carry = 0;
      for (let j = 0; j < quotients.length; j++) {
        const accumulator = quotients[j] * 10 + digits[i] + carry;
        const quotient = Math.floor(accumulator / 39);
        const remainder = accumulator % 39;
        quotients[j] = remainder;
        carry = quotient;
      }
      if (carry > 0) {
        quotients.push(carry);
      }
    }
  
    for (let i = 0; i < quotients.length; i++) {
      base39Number = base39Chars[quotients[i]] + base39Number;
    }
  
    return base39Number.split('').map(s => base39Chars.indexOf(s));
}