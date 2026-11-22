// ============================================================================
// Ember Court — stats.js
// ONE JOB: run statistics and session records. Everything a run produces
// (damage, combos, best score, fastest win) is collected here, in memory
// only — the game never writes cookies, localStorage or any file, so the
// hosted entry stays within its content policy. The title screen shows the
// session's best score; the end screens show the full breakdown (rendered
// from battle.js stats via render.js).
// ============================================================================

/** Session records: the best of everything this browser session has seen. */
export const sessionRecords = {
  bestScore: 0,
  bestScoreMode: '',
  mostDamageDealt: 0,
  mostCombos: 0,
  fastestCampaignWinTurns: null,
  campaignsWon: 0,
  endlessBestLevel: 0,
  runsPlayed: 0,
  runsWon: 0,
};

/** Record a finished run into the session records. */
export function recordRun(run) {
  sessionRecords.runsPlayed++;
  if (run.score > sessionRecords.bestScore) {
    sessionRecords.bestScore = run.score;
    sessionRecords.bestScoreMode = run.mode === 'endless' ? 'Endless Duel' : 'Campaign';
  }
  if (run.stats.damageDealt > sessionRecords.mostDamageDealt) {
    sessionRecords.mostDamageDealt = run.stats.damageDealt;
  }
  if (run.stats.combosTriggered > sessionRecords.mostCombos) {
    sessionRecords.mostCombos = run.stats.combosTriggered;
  }
  if (run.won) {
    sessionRecords.runsWon++;
    if (run.mode === 'campaign') {
      sessionRecords.campaignsWon++;
      if (sessionRecords.fastestCampaignWinTurns === null ||
          run.stats.turnsTaken < sessionRecords.fastestCampaignWinTurns) {
        sessionRecords.fastestCampaignWinTurns = run.stats.turnsTaken;
      }
    } else if (run.level - 1 > sessionRecords.endlessBestLevel) {
      sessionRecords.endlessBestLevel = run.level - 1;
    }
  }
}

/** Win rate across the session, as a percentage string. */
export function sessionWinRate() {
  if (!sessionRecords.runsPlayed) return '—';
  return Math.round((sessionRecords.runsWon / sessionRecords.runsPlayed) * 100) + '%';
}

/** A one-line summary of the session's best score for the title screen. */
export function bestScoreLine() {
  if (!sessionRecords.runsPlayed) return 'No runs yet this session — the court awaits.';
  return 'Best score this session: ' + sessionRecords.bestScore +
    ' (' + sessionRecords.bestScoreMode + ') · ' +
    sessionRecords.runsWon + '/' + sessionRecords.runsPlayed + ' runs won (' +
    sessionWinRate() + ') · deepest Endless: Lv ' + sessionRecords.endlessBestLevel;
}

/** Grade a run's performance, S to D, from score + combos + damage. */
export function gradeRun(run) {
  let points = 0;
  points += Math.min(40, Math.floor(run.score / 25));
  points += Math.min(25, run.stats.combosTriggered * 3);
  points += Math.min(20, Math.floor(run.stats.damageDealt / 10));
  points += Math.min(15, run.stats.battlesWon * 2);
  if (run.won) points += 10;
  if (points >= 95) return { grade: 'S', label: 'Legend of the Court' };
  if (points >= 80) return { grade: 'A', label: 'Master Duelist' };
  if (points >= 65) return { grade: 'B', label: 'Seasoned Challenger' };
  if (points >= 50) return { grade: 'C', label: 'Promising Duelist' };
  return { grade: 'D', label: 'The court is still teaching you' };
}

/** Average damage per card played — a handy efficiency stat. */
export function damagePerCard(run) {
  if (!run.stats.cardsPlayed) return '0.0';
  return (run.stats.damageDealt / run.stats.cardsPlayed).toFixed(1);
}

/** Average damage per turn — the run's tempo. */
export function damagePerTurn(run) {
  if (!run.stats.turnsTaken) return '0.0';
  return (run.stats.damageDealt / run.stats.turnsTaken).toFixed(1);
}
