import { BasePlugin, BaseComponent } from 'vatom-spaces-plugins'
import { StargateComponent } from './StargateComponent'
import { SharedVars } from './Utils'

/**
 * This is the main entry point for your plugin.
 *
 * All information regarding plugin development can be found at
 * https://developer.vatom.com/spaces/plugins-in-spaces/guide-create-plugin
 *
 * @license MIT
 * @author Vatom Inc.
 */
export default class StargatePlugin extends BasePlugin {

    /** Plugin info */
    static id = "com.jjv360.stargate"
    static name = "Stargate"

    /** Called on load */
    async onLoad() {

        // Store reference
        SharedVars.plugin = this
        SharedVars.spaceID = await this.world.getInstanceID()
        self.SharedVars = SharedVars

        // Stargate plugin loading
        console.debug(`[Stargate] Loaded v${require('../package.json').version}`)

        // Register components
        StargateComponent.register(this)

        // Preload one-shot audio files
        this.audio.preload(this.paths.absolute('activate.mp3'))
        this.audio.preload(this.paths.absolute('shutdown.mp3'))

        // Create a button in the toolbar
        this.menus.register({
            section: 'insert-object',
            icon: this.paths.absolute('insert-stargate-icon.png'),
            text: 'Stargate',
            action: () => this.insertStargate()
        })

    }

    /** Called when the user presses the action button */
    async insertStargate() {

        // Get user position
        let pos = await this.user.getPosition()

        // Insert stargate model
        await this.objects.create({

            // Model info
            type: 'model',
            name: 'Stargate',
            url: this.paths.absolute('stargate.glb'),
            collide: true,

            // Position
            x: pos.x,
            height: pos.y || 0,
            y: pos.z,

            // Write to database
            clientOnly: false,

            // Attach components
            components: [
                { id: `${this.id}:stargate` },
            ],

        })

    }

}
