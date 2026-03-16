import Foundation

// MARK: - Smart Activity Classification

/// Result of classifying an agent's real activity based on multiple signals.
struct ClassifiedActivity {
    let zone: ZoneId
    let visualActivity: VisualActivity
    let emote: String?
    let toolDescription: String  // e.g. "implementing UserService", "running xUnit tests"
}

/// Visual activity state for rendering.
enum VisualActivity: String {
    case planning      // at meeting table, thinking
    case coding        // typing on monitor
    case reviewing     // reading code on monitor
    case testing       // running tests, viewing results
    case deploying     // deploy console, monitoring
    case messaging     // communicating, sending messages
    case researching   // researching in library, reading docs
    case debugging     // debugging, analyzing logs
    case idling        // resting in lounge
    case celebrating   // task completed!
}

// MARK: - Zone Score System

/// Accumulates weighted scores for each zone to determine the best placement.
private struct ZoneScore {
    var planning: Double = 0
    var coding: Double = 0
    var testing: Double = 0
    var deploying: Double = 0
    var comms: Double = 0
    var lounge: Double = 0
    var library: Double = 0
    var workshop: Double = 0

    /// Returns the zone with the highest score. Ties broken by priority order.
    var highestZone: ZoneId {
        let scores: [(ZoneId, Double)] = [
            (.coding, coding),
            (.testing, testing),
            (.deploying, deploying),
            (.workshop, workshop),
            (.planning, planning),
            (.comms, comms),
            (.library, library),
            (.lounge, lounge)
        ]
        // Sort by score descending; first in list wins ties (coding > testing > etc.)
        return scores.max(by: { $0.1 < $1.1 })?.0 ?? .lounge
    }

    mutating func add(_ zone: ZoneId, _ points: Double) {
        switch zone {
        case .planning:  planning += points
        case .coding:    coding += points
        case .testing:   testing += points
        case .deploying: deploying += points
        case .comms:     comms += points
        case .lounge:    lounge += points
        case .library:   library += points
        case .workshop:  workshop += points
        }
    }
}

// MARK: - Activity Classifier

/// Intelligent classifier that analyzes MULTIPLE signals with a scoring system to determine:
/// - Which ROOM the agent should be in
/// - Which VISUAL ACTIVITY to show
/// - Which EMOTE to display
/// - A human-readable tool description
enum ActivityClassifier {

    /// Classify the REAL activity of an agent based on multiple weighted signals.
    static func classify(
        agentName: String,
        agentType: String?,
        activity: AgentActivity?,
        tasks: [AgentTask],
        messages: [InboxMessage]
    ) -> ClassifiedActivity {

        let currentAction = activity?.currentAction ?? .idle
        let currentFile = activity?.currentFile
        let agentTasks = tasks.filter { $0.owner == agentName }
        let activeTask = agentTasks.first { $0.status == .inProgress }
        let recentMessages = messages.filter { $0.from == agentName || $0.to == agentName }

        // Analyze each signal independently
        let fileContext = classifyFile(currentFile)
        let taskContext = classifyTask(activeTask)
        let agentContext = classifyAgentType(agentType)
        let nameContext = classifyAgentName(agentName)

        // Build scores from all signals
        var scores = ZoneScore()
        var bestEmote: String?
        var bestDesc = "working"

        // Signal 1: ActivityType (weight: high - this is what the agent is DOING right now)
        applyActivitySignal(&scores, currentAction, &bestEmote, &bestDesc)

        // Signal 2: File context (weight: high when writing/reading)
        applyFileSignal(&scores, fileContext, currentFile, currentAction, &bestDesc)

        // Signal 3: Task context (weight: medium-high)
        applyTaskSignal(&scores, taskContext, activeTask, &bestDesc)

        // Signal 4: Agent type from config (weight: medium)
        applyAgentTypeSignal(&scores, agentContext)

        // Signal 5: Agent name keywords (weight: medium-low)
        applyAgentNameSignal(&scores, nameContext)

        // Signal 6: Recent message content (weight: medium)
        applyMessageSignal(&scores, recentMessages, agentName, &bestEmote, &bestDesc)

        // Signal 7: Task completion ratio (weight: high for terminal states)
        applyCompletionSignal(&scores, agentTasks, currentAction)

        // Winner
        let winnerZone = scores.highestZone
        let winnerVisual = visualForZone(winnerZone, currentAction: currentAction)
        let winnerEmote = bestEmote ?? emoteForZone(winnerZone)

        return ClassifiedActivity(
            zone: winnerZone,
            visualActivity: winnerVisual,
            emote: winnerEmote,
            toolDescription: bestDesc
        )
    }

    // MARK: - Signal 1: Activity Type

    private static func applyActivitySignal(
        _ scores: inout ZoneScore,
        _ action: ActivityType,
        _ emote: inout String?,
        _ desc: inout String
    ) {
        switch action {
        case .writing:
            scores.add(.coding, 4)
            desc = "coding"
        case .reading:
            scores.add(.library, 3)
            scores.add(.coding, 1)
            desc = "reading code"
        case .thinking:
            scores.add(.planning, 4)
            desc = "thinking"
            emote = "\u{1F4AD}"
        case .searching:
            scores.add(.library, 4)
            desc = "searching"
            emote = "\u{1F50D}"
        case .testing:
            scores.add(.testing, 5)
            desc = "running tests"
            emote = "\u{1F9EA}"
        case .running:
            scores.add(.testing, 4)
            scores.add(.deploying, 1)
            desc = "running"
            emote = "\u{26A1}"
        case .deploying:
            scores.add(.deploying, 5)
            desc = "deploying"
            emote = "\u{1F680}"
        case .debugging:
            scores.add(.workshop, 5)
            desc = "debugging"
            emote = "\u{1F527}"
        case .messaging:
            scores.add(.comms, 5)
            desc = "communicating"
            emote = "\u{1F4AC}"
        case .idle:
            scores.add(.lounge, 3)
            desc = "waiting for tasks"
        case .done:
            scores.add(.lounge, 8)  // strong signal
            desc = "tasks completed!"
            emote = "\u{2705}"
        case .error:
            scores.add(.workshop, 6)
            desc = "handling error"
            emote = "\u{1F534}"
        }
    }

    // MARK: - Signal 2: File Context

    private enum FileContext {
        case code          // .cs, .swift, .ts, .js, .py
        case test          // *Test*, *Spec*, test/*
        case sql           // .sql, sp_*, migration*
        case config        // .json, .yaml, .xml, .env, docker*
        case docs          // .md, README, docs/*
        case deployment    // Dockerfile, .yml (CI), deploy*, k8s*
        case ui            // .razor, .xaml, .html+css, .vue, .svelte
        case unknown
    }

    private static func classifyFile(_ file: String?) -> FileContext {
        guard let file = file?.lowercased() else { return .unknown }

        // Tests
        if file.contains("test") || file.contains("spec") || file.contains("xunit") ||
           file.contains("jest") || file.contains("vitest") || file.contains("playwright") {
            return .test
        }

        // SQL / Database
        if file.hasSuffix(".sql") || file.contains("migration") || file.contains("sp_") ||
           file.contains("repository") || file.contains("query") || file.contains("schema") {
            return .sql
        }

        // Deploy / CI/CD
        if file.contains("docker") || file.contains("deploy") || file.contains("k8s") ||
           file.contains("pipeline") || file.contains("ci") || file.contains("cd") ||
           file.contains("terraform") || file.contains("helm") {
            return .deployment
        }

        // UI files
        if file.hasSuffix(".razor") || file.hasSuffix(".xaml") || file.hasSuffix(".vue") ||
           file.hasSuffix(".svelte") || file.contains("component") || file.contains("view") ||
           file.contains("page") || file.contains("layout") {
            return .ui
        }

        // Config
        if file.hasSuffix(".json") || file.hasSuffix(".yaml") || file.hasSuffix(".xml") ||
           file.hasSuffix(".env") || file.hasSuffix(".toml") || file.contains("config") ||
           file.contains("settings") || file.contains("appsettings") {
            return .config
        }

        // Docs
        if file.hasSuffix(".md") || file.contains("readme") || file.contains("docs/") ||
           file.contains("changelog") || file.contains("license") {
            return .docs
        }

        // Code
        if file.hasSuffix(".cs") || file.hasSuffix(".swift") || file.hasSuffix(".ts") ||
           file.hasSuffix(".js") || file.hasSuffix(".tsx") || file.hasSuffix(".jsx") ||
           file.hasSuffix(".py") || file.hasSuffix(".go") || file.hasSuffix(".rs") ||
           file.hasSuffix(".kt") || file.hasSuffix(".java") || file.hasSuffix(".cpp") ||
           file.hasSuffix(".html") || file.hasSuffix(".css") || file.hasSuffix(".scss") {
            return .code
        }

        return .unknown
    }

    private static func applyFileSignal(
        _ scores: inout ZoneScore,
        _ context: FileContext,
        _ file: String?,
        _ action: ActivityType,
        _ desc: inout String
    ) {
        // File signals are strongest when agent is actively writing/reading
        let isActive = action == .writing || action == .reading
        let weight: Double = isActive ? 1.0 : 0.4

        switch context {
        case .test:
            scores.add(.testing, 5 * weight)
            scores.add(.coding, 1 * weight)
            if isActive { desc = "running tests on \(humanFileName(file))" }
        case .sql:
            scores.add(.coding, 3 * weight)
            scores.add(.library, 2 * weight)
            if isActive { desc = "working on database \(humanFileName(file))" }
        case .deployment:
            scores.add(.deploying, 5 * weight)
            if isActive { desc = "configuring deployment" }
        case .ui:
            scores.add(.coding, 4 * weight)
            scores.add(.planning, 1 * weight)
            if isActive { desc = "building UI \(humanFileName(file))" }
        case .config:
            scores.add(.deploying, 3 * weight)
            scores.add(.coding, 1 * weight)
            if isActive { desc = "configuring \(humanFileName(file))" }
        case .docs:
            scores.add(.library, 5 * weight)
            if isActive { desc = "documenting \(humanFileName(file))" }
        case .code:
            if action == .reading {
                scores.add(.library, 3 * weight)
                scores.add(.coding, 2 * weight)
                if isActive { desc = "reviewing \(humanFileName(file))" }
            } else {
                scores.add(.coding, 5 * weight)
                if isActive { desc = "implementing \(humanFileName(file))" }
            }
        case .unknown:
            break  // no signal
        }
    }

    // MARK: - Signal 3: Task Context

    private enum TaskContext {
        case development
        case testing
        case review
        case planning
        case deployment
        case bugfix
        case docs
        case communication
        case unknown
    }

    private static func classifyTask(_ task: AgentTask?) -> TaskContext {
        guard let task = task else { return .unknown }
        let text = (task.subject + " " + (task.description ?? "")).lowercased()

        if text.contains("test") || text.contains("verify") || text.contains("validate") ||
           text.contains("qa") || text.contains("xunit") || text.contains("jest") ||
           text.contains("e2e") || text.contains("integration test") || text.contains("unit test") {
            return .testing
        }

        if text.contains("deploy") || text.contains("release") || text.contains("ci/cd") ||
           text.contains("pipeline") || text.contains("staging") || text.contains("production") ||
           text.contains("docker") || text.contains("kubernetes") {
            return .deployment
        }

        if text.contains("review") || text.contains("audit") || text.contains("security") ||
           text.contains("owasp") || text.contains("inspect") || text.contains("check") {
            return .review
        }

        if text.contains("fix") || text.contains("bug") || text.contains("debug") ||
           text.contains("error") || text.contains("issue") || text.contains("crash") ||
           text.contains("problem") || text.contains("broken") {
            return .bugfix
        }

        if text.contains("design") || text.contains("plan") || text.contains("architect") ||
           text.contains("schema") || text.contains("api design") || text.contains("endpoint") ||
           text.contains("roadmap") || text.contains("specification") {
            return .planning
        }

        if text.contains("document") || text.contains("readme") || text.contains("docs") ||
           text.contains("changelog") || text.contains("wiki") {
            return .docs
        }

        if text.contains("discuss") || text.contains("sync") || text.contains("report") ||
           text.contains("standup") || text.contains("communicate") {
            return .communication
        }

        if text.contains("implement") || text.contains("create") || text.contains("build") ||
           text.contains("add") || text.contains("develop") || text.contains("write") ||
           text.contains("optimize") || text.contains("refactor") {
            return .development
        }

        return .unknown
    }

    private static func applyTaskSignal(
        _ scores: inout ZoneScore,
        _ context: TaskContext,
        _ task: AgentTask?,
        _ desc: inout String
    ) {
        guard task != nil else { return }  // no active task = no signal

        let weight: Double = 3.5  // tasks are a strong signal

        switch context {
        case .testing:
            scores.add(.testing, weight)
            desc = taskDescHuman(task, "running tests")
        case .deployment:
            scores.add(.deploying, weight)
            desc = taskDescHuman(task, "deploying")
        case .review:
            scores.add(.library, weight * 0.6)
            scores.add(.workshop, weight * 0.4)
            desc = taskDescHuman(task, "reviewing code")
        case .bugfix:
            scores.add(.workshop, weight)
            desc = taskDescHuman(task, "fixing bug")
        case .planning:
            scores.add(.planning, weight)
            desc = taskDescHuman(task, "planning architecture")
        case .docs:
            scores.add(.library, weight)
            desc = taskDescHuman(task, "writing docs")
        case .communication:
            scores.add(.comms, weight)
            desc = taskDescHuman(task, "coordinating")
        case .development:
            scores.add(.coding, weight)
            desc = taskDescHuman(task, "developing")
        case .unknown:
            scores.add(.coding, 1)  // weak default to coding
        }
    }

    // MARK: - Signal 4: Agent Type

    private enum AgentTypeContext {
        case developer
        case database
        case tester
        case security
        case devops
        case designer
        case lead
        case general
    }

    private static func classifyAgentType(_ type: String?) -> AgentTypeContext {
        switch type {
        case "csharp-developer", "js-developer", "swift-developer",
             "kotlin-developer", "blazor-architect", "api-designer",
             "winforms-developer":
            return .developer
        case "sql-server-expert":
            return .database
        case "tester-qa", "qa-reviewer":
            return .tester
        case "security-expert":
            return .security
        case "devops":
            return .devops
        case "ux-designer":
            return .designer
        case "tech-lead-gestor", "meta-orchestrator":
            return .lead
        default:
            return .general
        }
    }

    private static func applyAgentTypeSignal(_ scores: inout ZoneScore, _ context: AgentTypeContext) {
        let weight: Double = 2.0  // medium weight - type gives default tendency

        switch context {
        case .developer:
            scores.add(.coding, weight)
        case .database:
            scores.add(.coding, weight * 0.7)
            scores.add(.library, weight * 0.3)
        case .tester:
            scores.add(.testing, weight)
        case .security:
            scores.add(.workshop, weight * 0.7)
            scores.add(.library, weight * 0.3)
        case .devops:
            scores.add(.deploying, weight)
        case .designer:
            scores.add(.planning, weight * 0.6)
            scores.add(.coding, weight * 0.4)
        case .lead:
            scores.add(.planning, weight * 0.6)
            scores.add(.comms, weight * 0.4)
        case .general:
            break  // no bias
        }
    }

    // MARK: - Signal 5: Agent Name Keywords

    private static func classifyAgentName(_ name: String) -> AgentTypeContext {
        let lower = name.lowercased()

        // Developer keywords
        if lower.contains("backend") || lower.contains("frontend") ||
           lower.contains("dev") || lower.contains("coder") ||
           lower.contains("engineer") || lower.contains("arch") ||
           lower.contains("blazor") || lower.contains("api") ||
           lower.contains("winforms") || lower.contains("ui-dev") {
            return .developer
        }

        // Database keywords
        if lower.contains("db") || lower.contains("sql") ||
           lower.contains("database") || lower.contains("data") {
            return .database
        }

        // Tester keywords
        if lower.contains("test") || lower.contains("qa") ||
           lower.contains("quality") || lower.contains("validator") {
            return .tester
        }

        // Security keywords
        if lower.contains("security") || lower.contains("sec") ||
           lower.contains("audit") || lower.contains("pentest") {
            return .security
        }

        // DevOps keywords
        if lower.contains("devops") || lower.contains("infra") ||
           lower.contains("deploy") || lower.contains("ops") ||
           lower.contains("sre") || lower.contains("platform") {
            return .devops
        }

        // Designer keywords
        if lower.contains("design") || lower.contains("ux") ||
           lower.contains("ui") || lower.contains("wireframe") {
            return .designer
        }

        // Lead keywords
        if lower.contains("lead") || lower.contains("manager") ||
           lower.contains("coordinator") || lower.contains("orchestr") ||
           lower.contains("gestor") || lower.contains("tech-lead") {
            return .lead
        }

        // Investigator / researcher
        if lower.contains("investigat") || lower.contains("research") ||
           lower.contains("analyst") {
            return .general  // could be anything, but library-leaning
        }

        return .general
    }

    private static func applyAgentNameSignal(_ scores: inout ZoneScore, _ context: AgentTypeContext) {
        let weight: Double = 1.5  // lower weight - name is a hint, not definitive

        switch context {
        case .developer:
            scores.add(.coding, weight)
        case .database:
            scores.add(.coding, weight * 0.7)
            scores.add(.library, weight * 0.3)
        case .tester:
            scores.add(.testing, weight)
        case .security:
            scores.add(.workshop, weight * 0.6)
            scores.add(.library, weight * 0.4)
        case .devops:
            scores.add(.deploying, weight)
        case .designer:
            scores.add(.planning, weight * 0.5)
            scores.add(.coding, weight * 0.5)
        case .lead:
            scores.add(.planning, weight * 0.5)
            scores.add(.comms, weight * 0.5)
        case .general:
            break
        }
    }

    // MARK: - Signal 6: Message Content Analysis

    private static func applyMessageSignal(
        _ scores: inout ZoneScore,
        _ messages: [InboxMessage],
        _ agentName: String,
        _ emote: inout String?,
        _ desc: inout String
    ) {
        // Check for very recent messages (< 60s) — agent is actively communicating
        let hasVeryRecentMessage = messages.contains {
            abs($0.timestamp.timeIntervalSinceNow) < 60
        }

        if hasVeryRecentMessage {
            scores.add(.comms, 3)
        }

        // Analyze the LATEST message for content keywords
        guard let latestMsg = messages
            .sorted(by: { $0.timestamp > $1.timestamp })
            .first else { return }

        let text = latestMsg.text.lowercased()

        // Bug / Debug keywords
        if text.contains("bug") || text.contains("fix") || text.contains("error") ||
           text.contains("crash") || text.contains("exception") || text.contains("null") ||
           text.contains("broken") || text.contains("failed") {
            scores.add(.workshop, 3)
            scores.add(.testing, 1)
            if abs(latestMsg.timestamp.timeIntervalSinceNow) < 120 {
                desc = "investigating issue"
                emote = "\u{1F527}"
            }
        }

        // Deploy / Release keywords
        if text.contains("deploy") || text.contains("staging") || text.contains("production") ||
           text.contains("release") || text.contains("rollback") || text.contains("docker") ||
           text.contains("container") || text.contains("pipeline") {
            scores.add(.deploying, 3)
            if abs(latestMsg.timestamp.timeIntervalSinceNow) < 120 {
                desc = "preparing deployment"
                emote = "\u{1F680}"
            }
        }

        // Test keywords
        if text.contains("test") || text.contains("passed") || text.contains("green") ||
           text.contains("coverage") || text.contains("assertion") || text.contains("xunit") ||
           text.contains("jest") || text.contains("spec") {
            scores.add(.testing, 3)
            if abs(latestMsg.timestamp.timeIntervalSinceNow) < 120 {
                desc = "verifying tests"
                emote = "\u{1F9EA}"
            }
        }

        // Review / Merge keywords
        if text.contains("review") || text.contains("approve") || text.contains("merge") ||
           text.contains("pr") || text.contains("pull request") || text.contains("lgtm") ||
           text.contains("feedback") {
            scores.add(.library, 3)
            if abs(latestMsg.timestamp.timeIntervalSinceNow) < 120 {
                desc = "code review"
                emote = "\u{1F50D}"
            }
        }

        // Completed keywords
        if text.contains("completed") || text.contains("done") || text.contains("finished") ||
           text.contains("success") {
            scores.add(.lounge, 2)
            if abs(latestMsg.timestamp.timeIntervalSinceNow) < 120 {
                emote = "\u{2705}"
            }
        }

        // Planning keywords
        if text.contains("design") || text.contains("architect") || text.contains("plan") ||
           text.contains("schema") || text.contains("proposal") || text.contains("rfc") {
            scores.add(.planning, 3)
            if abs(latestMsg.timestamp.timeIntervalSinceNow) < 120 {
                desc = "planning design"
                emote = "\u{1F4AD}"
            }
        }
    }

    // MARK: - Signal 7: Task Completion Ratio

    private static func applyCompletionSignal(
        _ scores: inout ZoneScore,
        _ agentTasks: [AgentTask],
        _ currentAction: ActivityType
    ) {
        guard !agentTasks.isEmpty else { return }

        let total = agentTasks.count
        let completed = agentTasks.filter { $0.status == .completed }.count
        let inProgress = agentTasks.filter { $0.status == .inProgress }.count
        let pending = agentTasks.filter { $0.status == .pending }.count
        let ratio = Double(completed) / Double(total)

        // ALL tasks completed -> celebrating in lounge
        if completed == total {
            scores.add(.lounge, 10)  // very strong signal
            return
        }

        // High completion ratio (>75%) -> close to finishing
        if ratio > 0.75 {
            scores.add(.lounge, 2)
        }

        // Has pending tasks but NONE in progress -> idle/planning
        if pending > 0 && inProgress == 0 && currentAction == .idle {
            scores.add(.planning, 3)
            scores.add(.lounge, 1)
        }

        // Has tasks in progress -> working (slight boost to coding)
        if inProgress > 0 {
            scores.add(.coding, 1)
        }
    }

    // MARK: - Zone → Visual Mapping

    private static func visualForZone(_ zone: ZoneId, currentAction: ActivityType) -> VisualActivity {
        switch zone {
        case .planning:  return .planning
        case .coding:    return currentAction == .reading ? .reviewing : .coding
        case .testing:   return .testing
        case .deploying: return .deploying
        case .comms:     return .messaging
        case .lounge:
            return currentAction == .done ? .celebrating : .idling
        case .library:
            return currentAction == .writing ? .coding : .researching
        case .workshop:
            return currentAction == .error ? .debugging : .reviewing
        }
    }

    private static func emoteForZone(_ zone: ZoneId) -> String {
        switch zone {
        case .planning:  return "\u{1F4AD}"  // thought bubble
        case .coding:    return "\u{1F4BB}"  // laptop
        case .testing:   return "\u{1F9EA}"  // test tube
        case .deploying: return "\u{1F680}"  // rocket
        case .comms:     return "\u{1F4AC}"  // speech bubble
        case .lounge:    return "\u{2615}"   // coffee
        case .library:   return "\u{1F4D6}"  // book
        case .workshop:  return "\u{1F527}"  // wrench
        }
    }

    // MARK: - Human-Readable Descriptions

    /// Converts a file path to a human-readable name.
    /// "UserService.cs" -> "UserService", "AuthControllerTests.cs" -> "AuthController tests"
    private static func humanFileName(_ file: String?) -> String {
        guard let file = file else { return "" }
        var name = (file as NSString).lastPathComponent

        // Remove extension
        if let dotIndex = name.lastIndex(of: ".") {
            name = String(name[name.startIndex..<dotIndex])
        }

        // Handle test files: "UserServiceTests" -> "UserService tests"
        let testSuffixes = ["Tests", "Test", "Spec", "Specs"]
        for suffix in testSuffixes {
            if name.hasSuffix(suffix) {
                name = String(name.dropLast(suffix.count)) + " tests"
                break
            }
        }

        // Truncate if too long
        if name.count > 25 {
            name = String(name.prefix(25)) + "..."
        }

        return name
    }

    /// Converts a task subject to a human-friendly description.
    private static func taskDescHuman(_ task: AgentTask?, _ fallback: String) -> String {
        guard let task = task else { return fallback }

        let subject = task.subject.trimmingCharacters(in: .whitespaces)
        guard !subject.isEmpty else { return fallback }

        // Clean up common patterns to be more human
        var clean = subject

        // Remove common prefixes that are redundant
        let prefixes = ["Implement ", "Create ", "Add ", "Fix ", "Update ", "Write "]
        for prefix in prefixes {
            if clean.hasPrefix(prefix) {
                let action = prefix.trimmingCharacters(in: .whitespaces).lowercased()
                clean = action + "ing " + String(clean.dropFirst(prefix.count))
                // Fix double-ing: "fixing" not "fixinging"
                if action == "fix" { clean = "fixing " + String(subject.dropFirst(prefix.count)) }
                if action == "write" { clean = "writing " + String(subject.dropFirst(prefix.count)) }
                if action == "create" { clean = "creating " + String(subject.dropFirst(prefix.count)) }
                if action == "update" { clean = "updating " + String(subject.dropFirst(prefix.count)) }
                break
            }
        }

        if clean.count > 35 {
            clean = String(clean.prefix(35)) + "..."
        }

        return clean
    }
}
