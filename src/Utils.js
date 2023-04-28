/**
 * Shared vars
 */
export const SharedVars = {

    /** @type {StargatePlugin} Reference to the main plugin instance */
    plugin: null,

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