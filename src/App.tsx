import React, { useState, useCallback, useMemo } from 'react';
import { Box, useApp, useInput } from 'ink';
import type { ViewType, TeamSessionData } from './core/types.js';
import { useGlobalData } from './hooks/useGlobalData.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { useActivityHistory } from './hooks/useActivityHistory.js';
import { useActivityLog } from './hooks/useActivityLog.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import Spinner from './components/Spinner.js';
import DashboardView from './views/DashboardView.js';
import TeamDetailView from './views/TeamDetailView.js';
import TaskBoardView from './views/TaskBoardView.js';
import MessagesView from './views/MessagesView.js';
import AgentDetailView from './views/AgentDetailView.js';
import UsageView from './views/UsageView.js';
import CrossTeamView from './views/CrossTeamView.js';
import CrossTeamCallPanel from './components/CrossTeamCallPanel.js';
import { useUsageData } from './hooks/useUsageData.js';
import { useCrossTeamData } from './hooks/useCrossTeamData.js';

interface AppProps {
  filterTeam?: string;
}

export default function App({ filterTeam }: AppProps) {
  const { exit } = useApp();
  const [currentView, setCurrentView] = useState<ViewType>(filterTeam ? 'team-detail' : 'dashboard');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(filterTeam ?? null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { teams, allTasks, allMessages, allTokens, allSessions, loading, spinnerFrame } = useGlobalData(filterTeam);
  const termSize = useTerminalSize();
  const { usage, refreshUsage } = useUsageData();
  const { crossTeam } = useCrossTeamData();
  const [prevView, setPrevView] = useState<ViewType>('dashboard');

  // Activity history for sparklines
  const activityHistory = useActivityHistory(teams, allTasks, allMessages);

  // Activity log for timeline
  const activityEvents = useActivityLog(allTasks, allMessages);

  const filteredTeams = useMemo(() => {
    if (filterTeam) return teams.filter((t) => t.name === filterTeam);
    return teams;
  }, [teams, filterTeam]);

  const totalAgents = useMemo(
    () => filteredTeams.reduce((sum, t) => sum + t.members.length, 0),
    [filteredTeams],
  );

  const totalTasks = useMemo(() => {
    let count = 0;
    for (const t of allTasks.values()) count += t.length;
    return count;
  }, [allTasks]);

  const totalTokens = useMemo(() => {
    let count = 0;
    for (const t of allTokens.values()) count += t.totalTokens;
    return count;
  }, [allTokens]);

  const hasRealTokens = useMemo(() => {
    for (const t of allTokens.values()) {
      if (t.isReal) return true;
    }
    return false;
  }, [allTokens]);

  const selectedTeamTasks = useMemo(
    () => (selectedTeam ? allTasks.get(selectedTeam) ?? [] : []),
    [allTasks, selectedTeam],
  );

  const selectedTeamMessages = useMemo(
    () => (selectedTeam ? allMessages.get(selectedTeam) ?? [] : []),
    [allMessages, selectedTeam],
  );

  // Build per-team activity data for sparklines
  const teamActivityData = useMemo(() => {
    const map = new Map<string, number[]>();
    // Use agent series as proxy for all teams (global activity)
    for (const team of filteredTeams) {
      map.set(team.name, activityHistory.agentSeries);
    }
    return map;
  }, [filteredTeams, activityHistory.agentSeries]);

  const handleSelectTeam = useCallback((name: string) => {
    setSelectedTeam(name);
    setSelectedIndex(0);
    setCurrentView('team-detail');
  }, []);

  const handleBack = useCallback(() => {
    if (currentView === 'usage' || currentView === 'cross-team') {
      setCurrentView(prevView);
    } else if (currentView === 'agent-detail') {
      setSelectedAgent(null);
      setCurrentView('team-detail');
    } else if (currentView !== 'dashboard') {
      if (filterTeam) return;
      setSelectedTeam(null);
      setSelectedAgent(null);
      setSelectedIndex(0);
      setCurrentView('dashboard');
    }
  }, [currentView, filterTeam, prevView]);

  useInput((input, key) => {
    if (input === 'q') {
      exit();
      return;
    }

    if (key.escape) {
      handleBack();
      return;
    }

    if (currentView === 'usage') {
      if (input === 'r') {
        refreshUsage();
      }
      return;
    }

    if (input === 'u') {
      setPrevView(currentView);
      setCurrentView('usage');
      return;
    }

    if (input === 'c' && (currentView === 'dashboard' || currentView === 'team-detail')) {
      setPrevView(currentView);
      setCurrentView('cross-team');
      return;
    }

    if (currentView === 'dashboard') {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(filteredTeams.length - 1, prev + 1));
      }
    }

    if (currentView === 'team-detail') {
      if (input === 'm') {
        setCurrentView('messages');
      } else if (input === 't') {
        setCurrentView('task-board');
      } else if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        const team = filteredTeams.find((t) => t.name === selectedTeam);
        const maxIdx = (team?.members.length ?? 1) - 1;
        setSelectedIndex((prev) => Math.min(maxIdx, prev + 1));
      } else if (key.return) {
        const team = filteredTeams.find((t) => t.name === selectedTeam);
        if (team && team.members[selectedIndex]) {
          setSelectedAgent(team.members[selectedIndex].name);
          setCurrentView('agent-detail');
          setSelectedIndex(0);
        }
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column">
        <Header
          currentView={currentView}
          teamCount={0}
          agentCount={0}
          taskCount={0}
          totalTokens={0}
          isRealTokens={false}
          spinnerFrame={spinnerFrame}
          filterTeam={filterTeam}
          hasActiveCall={false}
          crossTeamCount={0}
        />
        <Box padding={1}>
          <Spinner label="Loading teams..." frame={spinnerFrame} />
        </Box>
      </Box>
    );
  }

  const selectedTeamObj = filteredTeams.find((t) => t.name === selectedTeam);
  const selectedAgentObj = selectedTeamObj?.members.find((a) => a.name === selectedAgent);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            teams={filteredTeams}
            allTasks={allTasks}
            allMessages={allMessages}
            allTokens={allTokens}
            allSessions={allSessions}
            selectedIndex={selectedIndex}
            onSelectTeam={handleSelectTeam}
            spinnerFrame={spinnerFrame}
            teamActivityData={teamActivityData}
            activityEvents={activityEvents}
          />
        );

      case 'team-detail':
        if (!selectedTeamObj) {
          handleBack();
          return null;
        }
        return (
          <>
            <CrossTeamCallPanel
              crossTeam={crossTeam}
              currentTeamName={selectedTeamObj.name}
              spinnerFrame={spinnerFrame}
            />
            <TeamDetailView
              team={selectedTeamObj}
              tasks={selectedTeamTasks}
              messages={selectedTeamMessages}
              tokens={allTokens.get(selectedTeamObj.name)}
              session={allSessions.get(selectedTeamObj.name)}
              spinnerFrame={spinnerFrame}
              termSize={termSize}
            />
          </>
        );

      case 'task-board':
        return (
          <TaskBoardView
            tasks={selectedTeamTasks}
            teamName={selectedTeam ?? 'all'}
          />
        );

      case 'messages':
        return (
          <MessagesView
            messages={selectedTeamMessages}
            teamName={selectedTeam ?? 'all'}
          />
        );

      case 'agent-detail':
        if (!selectedAgentObj) {
          handleBack();
          return null;
        }
        return (
          <AgentDetailView
            agent={selectedAgentObj}
            tasks={selectedTeamTasks}
            messages={selectedTeamMessages}
            session={selectedTeam ? allSessions.get(selectedTeam) : undefined}
            spinnerFrame={spinnerFrame}
          />
        );

      case 'usage':
        return (
          <UsageView
            usage={usage}
            spinnerFrame={spinnerFrame}
            termSize={termSize}
          />
        );

      case 'cross-team':
        return (
          <CrossTeamView
            crossTeam={crossTeam}
            spinnerFrame={spinnerFrame}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column" minHeight={20}>
      <Header
        currentView={currentView}
        teamCount={filteredTeams.length}
        agentCount={totalAgents}
        taskCount={totalTasks}
        totalTokens={totalTokens}
        isRealTokens={hasRealTokens}
        spinnerFrame={spinnerFrame}
        filterTeam={filterTeam}
        hasActiveCall={crossTeam.activeCall !== null}
        crossTeamCount={crossTeam.registry.length}
      />
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
        {renderView()}
      </Box>
      <Footer view={currentView} />
    </Box>
  );
}
