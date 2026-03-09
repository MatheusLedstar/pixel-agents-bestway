import Foundation

// MARK: - File Watcher

/// Monitors file system directories for changes using DispatchSource with debounce.
actor FileWatcher {
    private var sources: [String: DispatchSourceFileSystemObject] = [:]
    private var fileDescriptors: [String: Int32] = [:]
    private var debounceTask: Task<Void, Never>?
    private let debounceInterval: Duration
    private let onChange: @Sendable () async -> Void

    init(debounceInterval: Duration = .milliseconds(300), onChange: @escaping @Sendable () async -> Void) {
        self.debounceInterval = debounceInterval
        self.onChange = onChange
    }

    deinit {
        // Sources are cancelled (which triggers setCancelHandler closing fds),
        // so we only need to cancel remaining sources here.
        for (_, source) in sources {
            source.cancel()
        }
    }

    /// Start watching a directory path for changes
    func watch(path: String) {
        guard sources[path] == nil else { return }

        let fd = open(path, O_EVTONLY)
        guard fd >= 0 else { return }

        fileDescriptors[path] = fd

        let source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fd,
            eventMask: [.write, .rename, .delete, .extend],
            queue: .global(qos: .utility)
        )

        source.setEventHandler { [weak self] in
            guard let self else { return }
            Task {
                await self.handleChange()
            }
        }

        source.setCancelHandler {
            close(fd)
        }

        sources[path] = source
        source.resume()
    }

    /// Stop watching a specific path
    func unwatch(path: String) {
        if let source = sources.removeValue(forKey: path) {
            source.cancel() // setCancelHandler closes the fd
        }
        fileDescriptors.removeValue(forKey: path)
    }

    /// Stop watching all paths
    func stopAll() {
        debounceTask?.cancel()
        debounceTask = nil
        for (_, source) in sources {
            source.cancel() // setCancelHandler closes the fd
        }
        sources.removeAll()
        fileDescriptors.removeAll()
    }

    /// Debounced change handler
    private func handleChange() {
        debounceTask?.cancel()
        debounceTask = Task { [onChange, debounceInterval] in
            try? await Task.sleep(for: debounceInterval)
            guard !Task.isCancelled else { return }
            await onChange()
        }
    }

    var watchedPaths: [String] {
        Array(sources.keys)
    }

    var isWatching: Bool {
        !sources.isEmpty
    }
}
