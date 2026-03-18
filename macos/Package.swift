// swift-tools-version: 6.0

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
            path: "Sources/PixelAgents",
            resources: [.copy("Resources")]
        ),
        .testTarget(
            name: "PixelAgentsTests",
            dependencies: ["PixelAgents"],
            path: "Tests/PixelAgentsTests"
        ),
    ]
)
