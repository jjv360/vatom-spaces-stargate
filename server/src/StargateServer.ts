import colors from 'colors'
import { WebSocket, WebSocketServer } from 'ws'
import { Connection } from './Connection'
import { Stargate } from './Stargate'

/**
 * Main server class
 */
export class StargateServer {

    /** All active connections */
    connections : Connection[] = []

    /** All gates in the network */
    gates : Stargate[] = []

    /** Start the server */
    start() {

        // Show header
        console.log("")
        console.log(colors.yellow('+++') + ' Stargate Network Server version ' + require('../package.json').version + colors.yellow(' +++'))
        console.log("")

        // Create websocket server
        let wss = new WebSocketServer({ port: 8080 })

        // Add WebSocket event listeners
        wss.on("connection", this.onConnection.bind(this))
        wss.on("error", err => console.error("Backend socket error: " + (err.message || err)))

    }

    /** Called when a connection is received */
    onConnection(conn : WebSocket) {

        // Incoming connection
        console.log("Incoming connection")

        // Create connection object
        let connection = new Connection(this, conn)

        // Add to list of connections
        this.connections.push(connection)

    }

}