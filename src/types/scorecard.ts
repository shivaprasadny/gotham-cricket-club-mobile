export type TossDecision = "BAT" | "BOWL";
export type MatchOutcome = "WIN" | "LOSS" | "TIE" | "NO_RESULT" | "ABANDONED";
export type ScorecardStatus = "DRAFT" | "PUBLISHED";
export type DismissalType =
  | "NOT_OUT"
  | "BOWLED"
  | "CAUGHT"
  | "LBW"
  | "RUN_OUT"
  | "STUMPED"
  | "HIT_WICKET"
  | "RETIRED_HURT"
  | "DID_NOT_BAT"
  | "OTHER";

export type BattingEntryRequest = {
  playerId: number | null;
  externalPlayerName: string | null;
  battingPosition: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissed: boolean;
  dismissalType: DismissalType;
  dismissalText: string;
  didNotBat: boolean;
  retiredHurt: boolean;
};

export type FieldingEntryRequest = {
  playerId: number;
  catches: number;
  droppedCatches: number;
  runOuts: number;
  stumpings: number;
};

export type BowlingEntryRequest = {
  playerId: number | null;
  externalPlayerName: string | null;
  legalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
};

export type SaveInningsRequest = {
  inningsNumber: number;
  battingTeamId: number | null;
  battingTeamName: string | null;
  runs: number;
  wickets: number;
  legalBalls: number;
  totalExtras: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penaltyRuns: number;
  declared: boolean;
  allOut: boolean;
  battingEntries: BattingEntryRequest[];
  bowlingEntries: BowlingEntryRequest[];
  fieldingEntries: FieldingEntryRequest[];
};

export type SaveScorecardRequest = {
  tossWinnerTeamId: number | null;
  tossWinnerName: string | null;
  tossDecision: TossDecision | null;
  outcome: MatchOutcome | null;
  winningTeamId: number | null;
  winningTeamName: string | null;
  winningMarginRuns: number | null;
  winningMarginWickets: number | null;
  resultSummary: string;
  playerOfMatchId: number | null;
  innings: SaveInningsRequest[];
};

export type BattingPerformanceResponse = {
  playerId: number | null;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissalType: DismissalType;
  dismissal?: string | null;
  strikeRate: number;
};

export type FieldingPerformanceResponse = {
  playerId: number;
  playerName: string;
  catches: number;
  droppedCatches: number;
  runOuts: number;
  stumpings: number;
  fieldingDismissals: number;
  catchChances: number;
  catchEfficiency: number;
};

export type BowlingPerformanceResponse = {
  playerId: number | null;
  playerName: string;
  oversDisplay: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
  totalBowlingExtras: number;
};

export type InningsResponse = {
  id: number;
  inningsNumber: number;
  battingTeamId: number | null;
  battingTeamName: string;
  runs: number;
  wickets: number;
  legalBalls: number;
  oversDisplay: string;
  totalExtras: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penaltyRuns: number;
  declared: boolean;
  allOut: boolean;
  batting: BattingPerformanceResponse[];
  bowling: BowlingPerformanceResponse[];
  fielding: FieldingPerformanceResponse[];
};

export type ScorecardResponse = {
  scorecardId: number;
  matchId: number;
  matchSummary: string;
  tossWinnerTeamId: number | null;
  tossWinnerName: string | null;
  tossDecision: TossDecision | null;
  outcome: MatchOutcome;
  winningTeamId: number | null;
  winningTeamName: string | null;
  winningMarginRuns: number | null;
  winningMarginWickets: number | null;
  resultSummary: string;
  firstInningsTotal: number | null;
  chaseTotal: number | null;
  topScorer: string | null;
  bestBowler: string | null;
  playerOfMatchId: number | null;
  playerOfMatchName: string | null;
  target: number | null;
  status: ScorecardStatus;
  publishedAt: string | null;
  innings: InningsResponse[];
};

export type LeaderboardCategory =
  | "RUNS"
  | "HIGHEST_SCORE"
  | "BAT_AVG"
  | "STRIKE_RATE"
  | "WICKETS"
  | "BEST_BOWLING"
  | "ECONOMY"
  | "SIXES"
  | "POM"
  | "CATCHES"
  | "FIELDING_DISMISSALS"
  | "STUMPINGS"
  | "RUN_OUTS"
  | "CATCH_EFFICIENCY";

export type PlayerLeaderboardEntry = {
  rank: number;
  playerId: number;
  fullName: string;
  value: number;
  secondaryValue: number | null;
};

export type RecentMatchPerformance = {
  matchId: number;
  matchSummary: string;
  batting: string;
  bowling: string;
};

export type PlayerStatistics = {
  playerId: number;
  fullName: string;
  matches: number;
  innings: number;
  notOuts: number;
  dismissals: number;
  totalRuns: number;
  highestScore: number;
  battingAverage: number;
  battingStrikeRate: number;
  totalBallsFaced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  bowlingInnings: number;
  totalLegalBalls: number;
  oversDisplay: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  bowlingAverage: number;
  economy: number;
  bowlingStrikeRate: number;
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  wides: number;
  noBalls: number;
  bowledDismissals: number;
  caughtDismissals: number;
  lbwDismissals: number;
  runOutDismissals: number;
  stumpedDismissals: number;
  hitWicketDismissals: number;
  otherDismissals: number;
  catches: number;
  droppedCatches: number;
  runOuts: number;
  stumpings: number;
  fieldingDismissals: number;
  catchChances: number;
  catchEfficiency: number;
  playerOfMatchAwards: number;
  recentPerformances: RecentMatchPerformance[];
};

export type StatisticsFilters = {
  leagueId?: number;
  teamId?: number;
  season?: string;
  year?: number;
};

export type StatisticsFilterOptions = {
  years: number[];
  seasons: string[];
  leagues: { id: number; name: string; season: string }[];
  teams: { id: number; name: string }[];
};

export type TeamStatistics = {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  winPercentage: number;
  totalRunsScored: number;
  totalRunsConceded: number;
  totalWicketsTaken: number;
  totalWicketsLost: number;
  highestTeamScore: number;
  lowestTeamScore: number;
  leadingRunScorerId: number | null;
  leadingRunScorer: string | null;
  leadingWicketTakerId: number | null;
  leadingWicketTaker: string | null;
  recentResults: string[];
};

export type LeagueStatistics = {
  leagueId: number;
  leagueName: string;
  matchesPlayed: number;
  completedMatches: number;
  totalRuns: number;
  totalWickets: number;
  highestTeamScore: number;
  highestIndividualScore: number;
  bestBowlingFigures: string | null;
  leadingRunScorers: PlayerLeaderboardEntry[];
  leadingWicketTakers: PlayerLeaderboardEntry[];
  teamRecords: string[];
};
