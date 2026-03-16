import Foundation

// MARK: - A* Path Finder

struct PathFinder {
    struct Node: Comparable {
        let x: Int
        let y: Int
        let g: Int  // cost from start
        let h: Int  // heuristic to end
        var f: Int { g + h }

        static func < (lhs: Node, rhs: Node) -> Bool {
            lhs.f < rhs.f
        }
    }

    static func findPath(
        from start: (Int, Int),
        to end: (Int, Int),
        walls: [[Bool]],
        furniture: [[TileType?]]
    ) -> [(Int, Int)] {
        let rows = walls.count
        let cols = walls[0].count

        guard start != end else { return [] }
        guard isWalkable(end.0, end.1, rows: rows, cols: cols, walls: walls, furniture: furniture) else {
            return []
        }

        var openSet: [Node] = [Node(x: start.0, y: start.1, g: 0, h: heuristic(start, end))]
        var closedSet = Set<Int>()
        var cameFrom: [Int: (Int, Int)] = [:]

        let key = { (x: Int, y: Int) -> Int in y * cols + x }

        while !openSet.isEmpty {
            openSet.sort(by: >)
            let current = openSet.removeLast()
            let ck = key(current.x, current.y)

            if current.x == end.0 && current.y == end.1 {
                return reconstructPath(cameFrom: cameFrom, end: end, cols: cols)
            }

            if closedSet.contains(ck) { continue }
            closedSet.insert(ck)

            // 4-directional neighbors
            let neighbors = [(0, -1), (0, 1), (-1, 0), (1, 0)]
            for (dx, dy) in neighbors {
                let nx = current.x + dx
                let ny = current.y + dy
                let nk = key(nx, ny)

                guard isWalkable(nx, ny, rows: rows, cols: cols, walls: walls, furniture: furniture) else { continue }
                guard !closedSet.contains(nk) else { continue }

                let ng = current.g + 1
                let nh = heuristic((nx, ny), end)
                let neighbor = Node(x: nx, y: ny, g: ng, h: nh)

                // Check if we already have a better path
                if let existing = openSet.first(where: { $0.x == nx && $0.y == ny }), existing.g <= ng {
                    continue
                }

                cameFrom[nk] = (current.x, current.y)
                openSet.append(neighbor)
            }
        }

        return [] // No path found
    }

    private static func heuristic(_ a: (Int, Int), _ b: (Int, Int)) -> Int {
        abs(a.0 - b.0) + abs(a.1 - b.1)
    }

    private static func isWalkable(_ x: Int, _ y: Int, rows: Int, cols: Int, walls: [[Bool]], furniture: [[TileType?]]) -> Bool {
        guard x >= 0 && x < cols && y >= 0 && y < rows else { return false }
        if walls[y][x] { return false }
        // Agents can walk OVER all furniture — only walls block pathfinding
        return true
    }

    private static func reconstructPath(cameFrom: [Int: (Int, Int)], end: (Int, Int), cols: Int) -> [(Int, Int)] {
        var path: [(Int, Int)] = [end]
        var current = end
        let key = { (x: Int, y: Int) -> Int in y * cols + x }

        while let prev = cameFrom[key(current.0, current.1)] {
            path.append(prev)
            current = prev
        }

        path.reverse()
        // Remove the starting position
        if !path.isEmpty { path.removeFirst() }
        return path
    }
}
