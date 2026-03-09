import Testing
import Foundation
import os
@testable import PixelAgents

@Suite("FileWatcher")
struct FileWatcherTests {
    @Test func watcherStartsAndTracksPath() async throws {
        let tmpDir = NSTemporaryDirectory() + "fw-test-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let watcher = FileWatcher { }
        await watcher.watch(path: tmpDir)

        let paths = await watcher.watchedPaths
        #expect(paths.contains(tmpDir))
        #expect(await watcher.isWatching)

        await watcher.stopAll()
        #expect(await watcher.watchedPaths.isEmpty)
        #expect(!(await watcher.isWatching))
    }

    @Test func watcherIgnoresInvalidPath() async {
        let watcher = FileWatcher { }
        await watcher.watch(path: "/nonexistent/path/\(UUID().uuidString)")

        #expect(await watcher.watchedPaths.isEmpty)
        #expect(!(await watcher.isWatching))
    }

    @Test func watcherDeduplicatesSamePath() async throws {
        let tmpDir = NSTemporaryDirectory() + "fw-dup-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let watcher = FileWatcher { }
        await watcher.watch(path: tmpDir)
        await watcher.watch(path: tmpDir) // duplicate

        #expect(await watcher.watchedPaths.count == 1)

        await watcher.stopAll()
    }

    @Test func watcherUnwatchSpecificPath() async throws {
        let tmpDir1 = NSTemporaryDirectory() + "fw-uw1-\(UUID().uuidString)"
        let tmpDir2 = NSTemporaryDirectory() + "fw-uw2-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir1, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(atPath: tmpDir2, withIntermediateDirectories: true)
        defer {
            try? FileManager.default.removeItem(atPath: tmpDir1)
            try? FileManager.default.removeItem(atPath: tmpDir2)
        }

        let watcher = FileWatcher { }
        await watcher.watch(path: tmpDir1)
        await watcher.watch(path: tmpDir2)

        #expect(await watcher.watchedPaths.count == 2)

        await watcher.unwatch(path: tmpDir1)
        let remaining = await watcher.watchedPaths
        #expect(remaining.count == 1)
        #expect(remaining.contains(tmpDir2))

        await watcher.stopAll()
    }

    @Test func watcherDetectsFileChange() async throws {
        let tmpDir = NSTemporaryDirectory() + "fw-detect-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        var changeDetected = false
        let expectation = OSAllocatedUnfairLock(initialState:false)

        let watcher = FileWatcher(debounceInterval: .milliseconds(50)) {
            expectation.withLock { $0 = true }
        }
        await watcher.watch(path: tmpDir)

        // Write a file to trigger change
        try "test content".write(
            toFile: "\(tmpDir)/test.txt",
            atomically: true,
            encoding: .utf8
        )

        // Wait for debounce + processing
        try await Task.sleep(for: .milliseconds(300))

        changeDetected = expectation.withLock { $0 }
        #expect(changeDetected)

        await watcher.stopAll()
    }

    @Test func watcherStopAllCleansUp() async throws {
        let tmpDir = NSTemporaryDirectory() + "fw-stop-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let watcher = FileWatcher { }
        await watcher.watch(path: tmpDir)

        #expect(await watcher.isWatching)

        await watcher.stopAll()

        #expect(!(await watcher.isWatching))
        #expect(await watcher.watchedPaths.isEmpty)
    }

    @Test func watcherDebounceCoalesces() async throws {
        let tmpDir = NSTemporaryDirectory() + "fw-debounce-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let callCount = OSAllocatedUnfairLock(initialState:0)

        let watcher = FileWatcher(debounceInterval: .milliseconds(200)) {
            callCount.withLock { $0 += 1 }
        }
        await watcher.watch(path: tmpDir)

        // Write multiple files rapidly (should be debounced into 1 callback)
        for i in 0..<5 {
            try "content \(i)".write(
                toFile: "\(tmpDir)/file\(i).txt",
                atomically: true,
                encoding: .utf8
            )
            try await Task.sleep(for: .milliseconds(10))
        }

        // Wait for debounce to fire
        try await Task.sleep(for: .milliseconds(500))

        let count = callCount.withLock { $0 }
        // Should be coalesced (ideally 1, but could be 2 depending on timing)
        #expect(count >= 1)
        #expect(count <= 3) // Definitely fewer than 5

        await watcher.stopAll()
    }

    @Test func watcherMultiplePaths() async throws {
        let tmpDir1 = NSTemporaryDirectory() + "fw-multi1-\(UUID().uuidString)"
        let tmpDir2 = NSTemporaryDirectory() + "fw-multi2-\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir1, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(atPath: tmpDir2, withIntermediateDirectories: true)
        defer {
            try? FileManager.default.removeItem(atPath: tmpDir1)
            try? FileManager.default.removeItem(atPath: tmpDir2)
        }

        let watcher = FileWatcher { }
        await watcher.watch(path: tmpDir1)
        await watcher.watch(path: tmpDir2)

        let paths = await watcher.watchedPaths
        #expect(paths.count == 2)
        #expect(paths.contains(tmpDir1))
        #expect(paths.contains(tmpDir2))

        await watcher.stopAll()
    }
}
