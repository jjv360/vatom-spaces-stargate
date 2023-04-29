import { WebSocket, Data } from "ws"
import { StargateServer } from "./StargateServer"
import { Stargate } from "./Stargate"

/**
 * Represents a connection to a client.
 */
export class Connection {

    /** Reference to the server */
    server : StargateServer

    /** WebSocket connection */
    websocket : WebSocket

    /** Gate this connection is for */
    gate ?: Stargate

    /** Message queue */
    messageQueue : Data[] = []

    /** True if the message queue loop is active */
    messageQueueActive = false

    /** Constructor */
    constructor(server : StargateServer, websocket : WebSocket) {

        // Store websocket
        this.server = server
        this.websocket = websocket

        // Add WebSocket event listeners
        websocket.on("message", this.onMessage.bind(this))
        websocket.on("close", this.onClose.bind(this))
        websocket.on("error", this.onError.bind(this))

    }

    /** Called when a message is received */
    onMessage(data : Data) {
            
        // Add to queue
        this.messageQueue.push(data)

        // Start processing queue if needed
        if (!this.messageQueueActive)
            this.processMessageQueue()

    }

    /** Called when the connection is closed */
    onClose(code : number, reason : Buffer) {

        // Log the disconnection
        console.log(`Connection to gate ${this.gate?.id} closed: ${code} ${reason}`)

        // Remove us from the active connection list
        let idx = this.server.connections.indexOf(this)
        if (idx != -1)
            this.server.connections.splice(idx, 1)

    }

    /** Called when an error occurs */
    onError(err : Error) {
        
        // Log the error
        console.log(`Connection to gate ${this.gate?.id} error: ${err.message || err}`)

    }

    /** Message queue processing loop */
    async processMessageQueue() {

        // Mark active
        this.messageQueueActive = true

        // Loop forever
        while (true) {

            // Get next message
            let message = this.messageQueue.shift()
            if (!message)
                break

            // Process it and catch errors
            try {
                    
                // Process message
                await this.processMessage(message)

            } catch (err : any) {
                
                // Log the error
                console.error(`Connection to gate ${this.gate?.id} error processing message: ${err.message || err}`)
                this.websocket.close(1000, err?.message || 'Unknown error')

            }

        }

        // Done
        this.messageQueueActive = false

    }

    /** Process an individual message */
    async processMessage(message : Data) {

        // Check message type
        let msg = JSON.parse(message.toString())
        if (msg.action == 'connect') {

            // Sanity checks
            if (!msg.gate) throw new Error("Missing gate ID.")
            if (this.gate) throw new Error("Already connected to a gate.")

            // Get gate
            this.gate = this.server.gates.find(g => g.id == msg.id)
            if (!this.gate && msg.register) {

                // Create new gate
                console.log(`Registering new gate ${msg.id}`)
                this.gate = new Stargate()
                this.gate.id = msg.id
                this.server.gates.push(this.gate)

            }

            // If no gate found, fail
            if (!this.gate)
                throw new Error("Gate not found.")

            // Success
            console.log(`Connection to gate ${this.gate.id} established.`)

        } else {

            // Unknown action
            throw new Error("Unknown action: " + msg.action)

        }

    }

}