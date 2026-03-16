import SwiftUI

// MARK: - Tile Types

enum TileType: Int {
    case floor = 0
    case wall = 1
    case door = 2
    case desk = 3
    case monitor = 4
    case chair = 5
    case bookshelf = 6
    case serverRack = 7
    case sofa = 8
    case coffeeMachine = 9
    case whiteboard = 10
    case plant = 11
    case coffeeTable = 12
    case workbench = 13
    case lamp = 14
}

// MARK: - Direction

enum Direction: Sendable {
    case up, down, left, right
}

// MARK: - Desk Seat

struct DeskSeat {
    let gridX: Int
    let gridY: Int
    let facingDirection: Direction
    let roomId: ZoneId
    var occupiedBy: String?
}

// MARK: - Office Room

struct OfficeRoom {
    let id: ZoneId
    let name: String
    let gridX: Int
    let gridY: Int
    let width: Int
    let height: Int
    let doorSide: Direction
    let accentColor: Color
    let ledColor: Color

    static let defaultLayout: [OfficeRoom] = [
        // Top row (y=1..13)
        OfficeRoom(id: .planning,  name: "PLANNING ROOM",    gridX: 1,  gridY: 1,  width: 11, height: 13, doorSide: .down, accentColor: .purple, ledColor: Color(hex: 0xA78BFA)),
        OfficeRoom(id: .coding,    name: "CODING LAB",       gridX: 13, gridY: 1,  width: 13, height: 13, doorSide: .down, accentColor: .green,  ledColor: Color(hex: 0x34D399)),
        OfficeRoom(id: .testing,   name: "TEST LAB",         gridX: 27, gridY: 1,  width: 11, height: 13, doorSide: .down, accentColor: .yellow, ledColor: Color(hex: 0xFBBF24)),
        OfficeRoom(id: .deploying, name: "DEPLOY CENTER",    gridX: 39, gridY: 1,  width: 10, height: 13, doorSide: .down, accentColor: .orange, ledColor: Color(hex: 0xFB923C)),
        // Bottom row (y=18..30) — corridor at y=14-17
        OfficeRoom(id: .comms,     name: "COMMS HUB",        gridX: 1,  gridY: 18, width: 11, height: 13, doorSide: .up,   accentColor: .blue,   ledColor: Color(hex: 0x60A5FA)),
        OfficeRoom(id: .lounge,    name: "LOUNGE",           gridX: 13, gridY: 18, width: 13, height: 13, doorSide: .up,   accentColor: .gray,   ledColor: Color(hex: 0x9CA3AF)),
        OfficeRoom(id: .library,   name: "LIBRARY",          gridX: 27, gridY: 18, width: 11, height: 13, doorSide: .up,   accentColor: .cyan,   ledColor: Color(hex: 0x22D3EE)),
        OfficeRoom(id: .workshop,  name: "DEBUG WORKSHOP",   gridX: 39, gridY: 18, width: 10, height: 13, doorSide: .up,   accentColor: .pink,   ledColor: Color(hex: 0xF472B6)),
    ]
}

// MARK: - Office World State

@Observable
class OfficeWorld {
    let cols = 50
    let rows = 32
    let tileSize: CGFloat = 32

    var floorTiles: [[Int]]
    var wallTiles: [[Bool]]
    var furnitureTiles: [[TileType?]]

    var deskSeats: [DeskSeat] = []
    var characters: [AgentCharacter] = []

    var cameraOffset: CGPoint = .zero
    var cameraZoom: CGFloat = 1.0

    let rooms: [OfficeRoom]

    init() {
        floorTiles = Array(repeating: Array(repeating: 0, count: 50), count: 32)
        wallTiles = Array(repeating: Array(repeating: false, count: 50), count: 32)
        furnitureTiles = Array(repeating: Array(repeating: nil, count: 50), count: 32)
        rooms = OfficeRoom.defaultLayout
        buildMap()
    }

    func buildMap() {
        // 1. Set all floor
        for r in 0..<rows {
            for c in 0..<cols {
                floorTiles[r][c] = 0
            }
        }

        // 2. Outer walls
        for c in 0..<cols {
            wallTiles[0][c] = true
            wallTiles[rows - 1][c] = true
        }
        for r in 0..<rows {
            wallTiles[r][0] = true
            wallTiles[r][cols - 1] = true
        }

        // 3. Corridor floor tint (rows 14-17)
        for r in 14...17 {
            for c in 1..<(cols - 1) {
                floorTiles[r][c] = 1 // corridor
            }
        }

        // 4. Room walls + door gaps + furniture
        for room in rooms {
            buildRoom(room)
        }
    }

    private func buildRoom(_ room: OfficeRoom) {
        let x0 = room.gridX
        let y0 = room.gridY
        let x1 = x0 + room.width - 1
        let y1 = y0 + room.height - 1

        // Draw room walls
        for c in x0...x1 {
            wallTiles[y0][c] = true
            wallTiles[y1][c] = true
        }
        for r in y0...y1 {
            wallTiles[r][x0] = true
            wallTiles[r][x1] = true
        }

        // Room floor tint
        for r in (y0 + 1)..<y1 {
            for c in (x0 + 1)..<x1 {
                floorTiles[r][c] = 2
            }
        }

        // Door gap (center of the door side, 2 tiles wide)
        let doorCenter = (room.doorSide == .down || room.doorSide == .up)
            ? x0 + room.width / 2
            : y0 + room.height / 2

        switch room.doorSide {
        case .down:
            wallTiles[y1][doorCenter] = false
            wallTiles[y1][doorCenter - 1] = false
        case .up:
            wallTiles[y0][doorCenter] = false
            wallTiles[y0][doorCenter - 1] = false
        case .left:
            wallTiles[doorCenter][x0] = false
            wallTiles[doorCenter - 1][x0] = false
        case .right:
            wallTiles[doorCenter][x1] = false
            wallTiles[doorCenter - 1][x1] = false
        }

        // Place furniture based on room type
        placeFurniture(room)
    }

    private func placeFurniture(_ room: OfficeRoom) {
        let x0 = room.gridX + 1
        let y0 = room.gridY + 1
        let innerW = room.width - 2
        let innerH = room.height - 2

        switch room.id {
        case .coding:
            // 3 columns x 2 rows of desk+monitor+chair
            let colSpacing = innerW / 4
            let rowSpacing = innerH / 3
            for col in 0..<3 {
                for row in 0..<2 {
                    let cx = x0 + colSpacing * (col + 1)
                    let cy = y0 + rowSpacing * (row + 1)
                    let monitorY = cy - 1
                    if isValid(monitorY, cx) { furnitureTiles[monitorY][cx] = .monitor }
                    if isValid(cy, cx) { furnitureTiles[cy][cx] = .desk }
                    let chairY = cy + 1
                    if isValid(chairY, cx) { furnitureTiles[chairY][cx] = .chair }
                    deskSeats.append(DeskSeat(gridX: cx, gridY: chairY, facingDirection: .up, roomId: room.id))
                }
            }

        case .planning:
            // Whiteboard at top
            let whiteY = y0 + 1
            let midX = x0 + innerW / 2
            if isValid(whiteY, midX) { furnitureTiles[whiteY][midX] = .whiteboard }
            if isValid(whiteY, midX - 1) { furnitureTiles[whiteY][midX - 1] = .whiteboard }
            // Meeting table (desks) center
            let tableY = y0 + innerH / 2
            for dx in -1...1 {
                if isValid(tableY, midX + dx) { furnitureTiles[tableY][midX + dx] = .desk }
            }
            // Chairs around table: 3 on top, 3 on bottom
            for dx in -1...1 {
                let topSeatY = tableY - 1
                let botSeatY = tableY + 1
                if isValid(topSeatY, midX + dx) { furnitureTiles[topSeatY][midX + dx] = .chair }
                if isValid(botSeatY, midX + dx) { furnitureTiles[botSeatY][midX + dx] = .chair }
                deskSeats.append(DeskSeat(gridX: midX + dx, gridY: topSeatY, facingDirection: .down, roomId: room.id))
                deskSeats.append(DeskSeat(gridX: midX + dx, gridY: botSeatY, facingDirection: .up, roomId: room.id))
            }
            // Plant
            if isValid(y0 + 1, x0 + 1) { furnitureTiles[y0 + 1][x0 + 1] = .plant }

        case .testing:
            // 3 columns x 2 rows of workbench+chair
            let colSpacing = innerW / 4
            let rowSpacing = innerH / 3
            for col in 0..<3 {
                for row in 0..<2 {
                    let cx = x0 + colSpacing * (col + 1)
                    let cy = y0 + rowSpacing * (row + 1)
                    if isValid(cy, cx) { furnitureTiles[cy][cx] = .workbench }
                    let chairY = cy + 1
                    if isValid(chairY, cx) { furnitureTiles[chairY][cx] = .chair }
                    deskSeats.append(DeskSeat(gridX: cx, gridY: chairY, facingDirection: .up, roomId: room.id))
                }
            }

        case .deploying:
            // Server racks on right wall
            for dy in 0..<3 {
                let ry = y0 + 2 + dy * 2
                let rx = x0 + innerW - 1
                if isValid(ry, rx) { furnitureTiles[ry][rx] = .serverRack }
            }
            // 2x2 desk grid
            let colSpacing = innerW / 3
            for col in 0..<2 {
                for row in 0..<2 {
                    let cx = x0 + colSpacing * (col + 1)
                    let cy = y0 + 3 + row * 4
                    if isValid(cy, cx) { furnitureTiles[cy][cx] = .desk }
                    if isValid(cy - 1, cx) { furnitureTiles[cy - 1][cx] = .monitor }
                    let chairY = cy + 1
                    if isValid(chairY, cx) { furnitureTiles[chairY][cx] = .chair }
                    deskSeats.append(DeskSeat(gridX: cx, gridY: chairY, facingDirection: .up, roomId: room.id))
                }
            }

        case .comms:
            // 2x2 desk grid with monitors
            let colSpacing = innerW / 3
            let rowSpacing = innerH / 3
            for col in 0..<2 {
                for row in 0..<2 {
                    let cx = x0 + colSpacing * (col + 1)
                    let cy = y0 + rowSpacing * (row + 1)
                    if isValid(cy, cx) { furnitureTiles[cy][cx] = .desk }
                    if isValid(cy - 1, cx) { furnitureTiles[cy - 1][cx] = .monitor }
                    let chairY = cy + 1
                    if isValid(chairY, cx) { furnitureTiles[chairY][cx] = .chair }
                    deskSeats.append(DeskSeat(gridX: cx, gridY: chairY, facingDirection: .up, roomId: room.id))
                }
            }

        case .lounge:
            // Sofa at top
            let sofaY = y0 + 2
            let midX = x0 + innerW / 2
            for dx in -2...2 {
                if isValid(sofaY, midX + dx) { furnitureTiles[sofaY][midX + dx] = .sofa }
            }
            // Coffee table center
            let tableY = y0 + innerH / 2
            if isValid(tableY, midX) { furnitureTiles[tableY][midX] = .coffeeTable }
            if isValid(tableY, midX - 1) { furnitureTiles[tableY][midX - 1] = .coffeeTable }
            // Coffee machine in corner
            if isValid(y0 + 1, x0 + innerW - 1) { furnitureTiles[y0 + 1][x0 + innerW - 1] = .coffeeMachine }
            // Plant
            if isValid(y0 + 1, x0 + 1) { furnitureTiles[y0 + 1][x0 + 1] = .plant }
            // Seats around coffee table
            for dx in -1...1 {
                let seatY = tableY + 1
                if isValid(seatY, midX + dx) { furnitureTiles[seatY][midX + dx] = .chair }
                deskSeats.append(DeskSeat(gridX: midX + dx, gridY: seatY, facingDirection: .up, roomId: room.id))
            }
            // Sofa seats
            for dx in stride(from: -2, through: 2, by: 2) {
                deskSeats.append(DeskSeat(gridX: midX + dx, gridY: sofaY, facingDirection: .down, roomId: room.id))
            }

        case .library:
            // Bookshelves on left and right walls
            for dy in stride(from: 1, to: innerH - 1, by: 2) {
                if isValid(y0 + dy, x0) { furnitureTiles[y0 + dy][x0] = .bookshelf }
                if isValid(y0 + dy, x0 + innerW - 1) { furnitureTiles[y0 + dy][x0 + innerW - 1] = .bookshelf }
            }
            // Reading table center
            let midX = x0 + innerW / 2
            let tableY = y0 + innerH / 2
            if isValid(tableY, midX) { furnitureTiles[tableY][midX] = .desk }
            if isValid(tableY, midX - 1) { furnitureTiles[tableY][midX - 1] = .desk }
            if isValid(tableY, midX + 1) { furnitureTiles[tableY][midX + 1] = .lamp }
            // Chairs
            for dx in -1...0 {
                for side in [-1, 1] {
                    let seatY = tableY + side
                    if isValid(seatY, midX + dx) { furnitureTiles[seatY][midX + dx] = .chair }
                    deskSeats.append(DeskSeat(gridX: midX + dx, gridY: seatY, facingDirection: side == -1 ? .down : .up, roomId: room.id))
                }
            }

        case .workshop:
            // Workbench at top
            let benchY = y0 + 2
            let midX = x0 + innerW / 2
            for dx in -1...1 {
                if isValid(benchY, midX + dx) { furnitureTiles[benchY][midX + dx] = .workbench }
            }
            // 2x2 seats
            for col in 0..<2 {
                for row in 0..<2 {
                    let cx = x0 + 2 + col * (innerW - 4)
                    let cy = y0 + 4 + row * 4
                    if isValid(cy, cx) { furnitureTiles[cy][cx] = .chair }
                    deskSeats.append(DeskSeat(gridX: cx, gridY: cy, facingDirection: .up, roomId: room.id))
                }
            }
        }
    }

    private func isValid(_ row: Int, _ col: Int) -> Bool {
        row >= 0 && row < rows && col >= 0 && col < cols
    }

    func roomAt(gridX: Int, gridY: Int) -> OfficeRoom? {
        rooms.first { room in
            gridX >= room.gridX && gridX < room.gridX + room.width &&
            gridY >= room.gridY && gridY < room.gridY + room.height
        }
    }

    func availableSeat(in zoneId: ZoneId) -> Int? {
        for (i, seat) in deskSeats.enumerated() {
            if seat.roomId == zoneId && seat.occupiedBy == nil {
                return i
            }
        }
        return nil
    }

    func releaseSeat(for agentName: String) {
        for i in deskSeats.indices {
            if deskSeats[i].occupiedBy == agentName {
                deskSeats[i].occupiedBy = nil
            }
        }
    }
}
