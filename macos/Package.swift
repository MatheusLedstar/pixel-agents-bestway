// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "PixelAgents",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "PixelAgents",
            path: "Sources/PixelAgents"
        ),
        .testTarget(
            name: "PixelAgentsTests",
            dependencies: ["PixelAgents"],
            path: "Tests/PixelAgentsTests"
        ),
    ]
)
