import { BaseComponent } from "vatom-spaces-plugins"
import { Queue, animateAudioVolume, createLoopingAudio } from "./Utils"

/**
 * Logic behind the Stargate.
 */
export class StargateComponent extends BaseComponent {

    /** Operation queue */
    queue = new Queue()

    /** Details of the current gate connection */
    connection = null

    /** Register this component */
    static register(plugin) {

        // Register the component
        plugin.objects.registerComponent(this, {
            id: 'stargate',
            name: 'Stargate',
            hidden: true,
            settings: []
        })

    }

    /** Called on load */
    onLoad() {

        // Loaded
        console.debug(`[Stargate] Loaded stargate component`)

    }

    /** Called on click */
    onClick() {

        // Stop if queue is running
        if (this.queue.isRunning)
            return console.debug(`[Stargate] Clicked, but queue is still running`)

        // Activate the stargate
        if (this.connection)
            this.close()
        else
            this.dial("000000")

    }

    /** Dial an address */
    dial(address) {

        // Do in the queue
        this.queue.do(async () => {

            // Stop if already connected
            if (this.connection?.address == address)    return console.log(`[Stargate] Attempted to dial, but gate is already connected to ${address}`)
            else if (this.connection)                   return console.warn(`[Stargate] Attempted to dial, but gate is already connected to ${this.connection.address}`)

            // Start dialing sequence
            console.debug(`[Stargate] Dialing ${address}`)

            // Create thread to extend the duration of this action ... gate takes a while to connect
            let connectDelayThread = new Promise(resolve => setTimeout(resolve, 5000))

            // Play the activation sound
            await this.plugin.audio.play(this.plugin.paths.absolute('activate.mp3'), {
                x: this.fields.x,
                height: this.fields.height,
                y: this.fields.y,
                radius: 50,
                volume: 1,
            })

            // Create audio for the gate loop ... the ambient sound while the gate is active
            let audioLoopID = await createLoopingAudio(this.plugin.paths.absolute('puddle_loop.mp3'), 0, {
                parent: this.objectID,
            })

            // Create a thread to animate the audio volume slowly
            let audioLoopRaiseThread = animateAudioVolume(audioLoopID, 0, 1, 2000, 500)

            // Wait for all threads to finish
            await Promise.all([connectDelayThread, audioLoopRaiseThread])

            // Connected!
            this.connection = {
                address,
                direction: 'out',
                audioLoopID
            }

        })

    }

    /** Close the gate */
    close() {

        // Add to queue
        this.queue.do(async () => {

            // Stop if not connected
            if (!this.connection)
                return console.warn(`[Stargate] Attempted to close, but gate is already closed`)

            // Close the gate
            console.debug(`[Stargate] Closing gate to ${this.connection.address}`)

            // Play the shutdown sound
            await this.plugin.audio.play(this.plugin.paths.absolute('shutdown.mp3'), {
                x: this.fields.x,
                height: this.fields.height,
                y: this.fields.y,
                radius: 50,
                volume: 1,
            })

            // Create a thread to animate the audio volume slowly
            let audioLoopLowerThread = animateAudioVolume(this.connection.audioLoopID, 1, 0, 2000, 500)

            // Wait for all threads to finish
            await Promise.all([audioLoopLowerThread])

            // Cleanup
            this.plugin.objects.remove(this.connection.audioLoopID)
            this.connection = null

        })

    }

}