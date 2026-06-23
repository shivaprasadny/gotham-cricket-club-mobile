import {
  DismissalType,
  SaveInningsRequest,
  SaveScorecardRequest,
  ScorecardResponse,
} from "../types/scorecard";

export const oversToLegalBalls = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d+(\.[0-5])?$/.test(trimmed)) return null;
  const [overs, balls = "0"] = trimmed.split(".");
  return Number(overs) * 6 + Number(balls);
};

export const legalBallsToOvers = (balls: number) =>
  `${Math.floor(Math.max(0, balls) / 6)}.${Math.max(0, balls) % 6}`;

const validateInnings = (innings: SaveInningsRequest): string | null => {
  const numericValues = [
    innings.runs,
    innings.wickets,
    innings.legalBalls,
    innings.totalExtras,
    innings.wides,
    innings.noBalls,
    innings.byes,
    innings.legByes,
    innings.penaltyRuns,
  ];
  if (numericValues.some((value) => value < 0)) {
    return `Innings ${innings.inningsNumber}: values cannot be negative.`;
  }
  if (innings.wickets > 10) {
    return `Innings ${innings.inningsNumber}: wickets cannot exceed 10.`;
  }
  const extras =
    innings.wides +
    innings.noBalls +
    innings.byes +
    innings.legByes +
    innings.penaltyRuns;
  if (extras !== innings.totalExtras) {
    return `Innings ${innings.inningsNumber}: extras breakdown must equal total extras.`;
  }
  if (innings.battingEntries.length > 11 || innings.bowlingEntries.length > 11) {
    return `Innings ${innings.inningsNumber}: maximum 11 batting and bowling rows.`;
  }
  if (
    innings.battingEntries.filter(
      (row) => (row.dismissalType || "DID_NOT_BAT") === "NOT_OUT"
    ).length > 2
  ) {
    return `Innings ${innings.inningsNumber}: only 2 batters can be Not Out.`;
  }
  if (innings.fieldingEntries.length > 12) {
    return `Innings ${innings.inningsNumber}: maximum 12 fielding rows.`;
  }
  const positions = innings.battingEntries.map((row) => row.battingPosition);
  if (positions.some((position) => position < 1) || new Set(positions).size !== positions.length) {
    return `Innings ${innings.inningsNumber}: batting positions must be unique and positive.`;
  }
  const battingPlayers = innings.battingEntries.map((row) =>
    row.playerId ? `id:${row.playerId}` : `name:${row.externalPlayerName?.trim().toLowerCase()}`
  );
  if (new Set(battingPlayers).size !== battingPlayers.length) {
    return `Innings ${innings.inningsNumber}: duplicate batter.`;
  }
  const bowlingPlayers = innings.bowlingEntries.map((row) =>
    row.playerId ? `id:${row.playerId}` : `name:${row.externalPlayerName?.trim().toLowerCase()}`
  );
  if (new Set(bowlingPlayers).size !== bowlingPlayers.length) {
    return `Innings ${innings.inningsNumber}: duplicate bowler.`;
  }
  const fieldingPlayers = innings.fieldingEntries.map((row) => row.playerId);
  if (
    fieldingPlayers.some((playerId) => !playerId) ||
    new Set(fieldingPlayers).size !== fieldingPlayers.length
  ) {
    return `Innings ${innings.inningsNumber}: select each fielder once.`;
  }
  for (const batter of innings.battingEntries) {
    if ((!batter.playerId && !batter.externalPlayerName?.trim()) ||
        (batter.playerId && batter.externalPlayerName?.trim())) {
      return `Innings ${innings.inningsNumber}: each batter needs one player or external name.`;
    }
    if (batter.runs < 0 || batter.ballsFaced < 0 || batter.fours < 0 || batter.sixes < 0) {
      return `Innings ${innings.inningsNumber}: batting values cannot be negative.`;
    }
    if (batter.fours * 4 + batter.sixes * 6 > batter.runs) {
      return `${batter.externalPlayerName || "Batter"}: boundary runs exceed total runs.`;
    }
    if (batter.didNotBat && (batter.runs > 0 || batter.ballsFaced > 0 || batter.dismissed)) {
      return `${batter.externalPlayerName || "Batter"}: did-not-bat entry must be zero and not dismissed.`;
    }
    if (batter.dismissalType === "OTHER" && !batter.dismissalText.trim()) {
      return `${batter.externalPlayerName || "Batter"}: add details for other dismissal.`;
    }
  }
  for (const bowler of innings.bowlingEntries) {
    if ((!bowler.playerId && !bowler.externalPlayerName?.trim()) ||
        (bowler.playerId && bowler.externalPlayerName?.trim())) {
      return `Innings ${innings.inningsNumber}: each bowler needs one player or external name.`;
    }
    if ([bowler.legalBalls, bowler.maidens, bowler.runsConceded, bowler.wickets, bowler.wides, bowler.noBalls, bowler.dotBalls].some((value) => value < 0)) {
      return `Innings ${innings.inningsNumber}: bowling values cannot be negative.`;
    }
    if (bowler.dotBalls > bowler.legalBalls) {
      return `Innings ${innings.inningsNumber}: dot balls cannot exceed legal balls.`;
    }
    if (bowler.maidens > Math.floor(bowler.legalBalls / 6)) {
      return `Innings ${innings.inningsNumber}: maidens cannot exceed completed overs.`;
    }
  }
  for (const fielder of innings.fieldingEntries) {
    if (
      [
        fielder.catches,
        fielder.droppedCatches,
        fielder.runOuts,
        fielder.stumpings,
      ].some((value) => value < 0)
    ) {
      return `Innings ${innings.inningsNumber}: fielding values cannot be negative.`;
    }
  }
  if (innings.battingEntries.reduce((sum, row) => sum + row.runs, 0) > innings.runs) {
    return `Innings ${innings.inningsNumber}: batter runs exceed innings runs.`;
  }
  if (innings.bowlingEntries.reduce((sum, row) => sum + row.wickets, 0) > innings.wickets) {
    return `Innings ${innings.inningsNumber}: bowler wickets exceed innings wickets.`;
  }
  return null;
};

export const validateScorecard = (
  payload: SaveScorecardRequest,
  publishing = false
): string | null => {
  if (!payload.outcome) return "Match outcome is required.";
  if (!payload.innings.length || payload.innings.length > 2) {
    return "A scorecard needs one or two innings.";
  }
  const numbers = payload.innings.map((innings) => innings.inningsNumber);
  if (new Set(numbers).size !== numbers.length || numbers[0] !== 1 ||
      (numbers.includes(2) && !numbers.includes(1))) {
    return "Innings numbers must be unique and begin with innings 1.";
  }
  for (const innings of payload.innings) {
    const error = validateInnings(innings);
    if (error) return error;
  }
  if (payload.outcome === "WIN" || payload.outcome === "LOSS") {
    const marginCount =
      Number(payload.winningMarginRuns != null) +
      Number(payload.winningMarginWickets != null);
    if (marginCount !== 1) return "Win or loss requires one margin: runs or wickets.";
  }
  if ((payload.outcome === "NO_RESULT" || payload.outcome === "ABANDONED") &&
      (payload.winningMarginRuns != null || payload.winningMarginWickets != null)) {
    return "No result or abandoned matches cannot have a winning margin.";
  }
  if (payload.outcome === "TIE" && payload.innings.length === 2 &&
      payload.innings[0].runs !== payload.innings[1].runs) {
    return "A tied match must have equal innings scores.";
  }
  if (publishing && ["WIN", "LOSS", "TIE"].includes(payload.outcome) &&
      payload.innings.length !== 2) {
    return "Publishing this result requires two innings.";
  }
  return null;
};

export const responseToDraft = (scorecard: ScorecardResponse): SaveScorecardRequest => ({
  tossWinnerTeamId: scorecard.tossWinnerTeamId,
  tossWinnerName: scorecard.tossWinnerName,
  tossDecision: scorecard.tossDecision,
  outcome: scorecard.outcome,
  winningTeamId: scorecard.winningTeamId,
  winningTeamName: scorecard.winningTeamName,
  winningMarginRuns: scorecard.winningMarginRuns,
  winningMarginWickets: scorecard.winningMarginWickets,
  resultSummary: scorecard.resultSummary || "",
  playerOfMatchId: scorecard.playerOfMatchId,
  innings: scorecard.innings.map((innings) => ({
    inningsNumber: innings.inningsNumber,
    battingTeamId: innings.battingTeamId,
    battingTeamName: innings.battingTeamName,
    runs: innings.runs,
    wickets: innings.wickets,
    legalBalls: innings.legalBalls,
    totalExtras: innings.totalExtras || 0,
    // Old scorecards may only have totalExtras; preserve their former
    // wides-based interpretation until the editor saves a detailed breakdown.
    wides:
      innings.wides ??
      (innings.noBalls == null &&
      innings.byes == null &&
      innings.legByes == null &&
      innings.penaltyRuns == null
        ? innings.totalExtras || 0
        : 0),
    noBalls: innings.noBalls || 0,
    byes: innings.byes || 0,
    legByes: innings.legByes || 0,
    penaltyRuns: innings.penaltyRuns || 0,
    declared: innings.declared,
    allOut: innings.allOut,
    battingEntries: innings.batting.map((row, index) => ({
      playerId: row.playerId,
      externalPlayerName: row.playerId ? null : row.playerName,
      battingPosition: index + 1,
      runs: row.runs,
      ballsFaced: row.balls,
      fours: row.fours,
      sixes: row.sixes,
      dismissed: Boolean(row.dismissal && row.dismissal !== "Did not bat" && row.dismissal !== "Retired hurt"),
      dismissalType:
        row.dismissalType ||
        (row.dismissal === "Did not bat"
          ? "DID_NOT_BAT"
          : row.dismissal === "Retired hurt"
          ? "RETIRED_HURT"
          : row.dismissal
          ? "OTHER"
          : "NOT_OUT") as DismissalType,
      dismissalText: row.dismissal || "",
      didNotBat: row.dismissal === "Did not bat",
      retiredHurt: row.dismissal === "Retired hurt",
    })),
    bowlingEntries: innings.bowling.map((row) => ({
      playerId: row.playerId,
      externalPlayerName: row.playerId ? null : row.playerName,
      legalBalls: oversToLegalBalls(row.oversDisplay) || 0,
      maidens: row.maidens,
      runsConceded: row.runsConceded,
      wickets: row.wickets,
      wides: row.wides ?? row.totalBowlingExtras ?? 0,
      noBalls: row.noBalls || 0,
      dotBalls: row.dotBalls || 0,
    })),
    fieldingEntries: (innings.fielding || []).map((row) => ({
      playerId: row.playerId,
      catches: row.catches,
      droppedCatches: row.droppedCatches,
      runOuts: row.runOuts,
      stumpings: row.stumpings,
    })),
  })),
});
