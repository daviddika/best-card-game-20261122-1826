// ============================================================================
// Ember Court — main.js
// ONE JOB: orchestration. This is the only file that knows the whole flow:
// title -> campaign / endless -> battle -> draft -> relic -> next battle ->
// victory / defeat, plus the deterministic ?shot= states for screenshots.
// Rules live in battle.js, painting in render.js, input in input.js; this
// file just wires them together and owns the `game` object input.js calls.
// ============================================================================

import { ACTS, endlessRivalForLevel, HELP_HTML } from './config.js';
import { CARDS, validateCardDatabase } from './cards.js';
import {
  createRun, startBattle, collectWinRewards, advanceAfterWin,
  offerDraftCards, takeDraftCard, offerRelicChoices, takeRelic,
  currentActDef, logLine,
} from './battle.js';
import {
  $, showScreen, renderBattle, renderChoiceScreen,
  renderVictory, renderDefeat, renderTopbar,
} from './render.js';
import { launchConfetti } from './effects.js';
import { sfx, ensureAudio } from './audio.js';
import { startMusic, setMusicMode } from './music.js';
import { recordRun, bestScoreLine } from './stats.js';
import { seedFromUrl } from './random.js';
import { buildShotState, shotFromUrl } from './shots.js';
import { bindInput, wireInput, maybePulseEndTurn } from './input.js';

// Expose the card database for the input nudge helper (no network involved).
window.__emberCards = CARDS;

// The live game object: the single source of truth input.js talks to.
const game = {
  run: null,
  mode: 'campaign',
  choiceKind: null,      // 'draft' | 'relic' | null
  pendingStep: null,     // what happens after the current choice screen

  /** Re-paint the battle table from the current run. */
  refresh() {
    if (!this.run) return;
    renderBattle(this.run);
    maybePulseEndTurn(this.run);
  },

  /** After any player action: if the battle just ended, route to the
   *  win/loss flow. Called after every play and every end-turn. */
  afterPlayerAction() {
    const run = this.run;
    if (!run || !run.over) return;
    if (run.won) this.onBattleWon();
    else this.onBattleLost();
  },

  /** A battle was won: pay rewards, then route to draft / relic / next. */
  onBattleWon() {
    const run = this.run;
    const reward = collectWinRewards(run);
    sfx.win();
    const step = advanceAfterWin(run);
    if (step.step === 'campaign-win') {
      recordRun(run);
      setMusicMode('victory');
      renderVictory(run, reward);
      launchConfetti();
      return;
    }
    if (step.step === 'next-endless') {
      // Endless: a short victory beat, then the next rival.
      setMusicMode('victory');
      renderVictory(run, reward);
      launchConfetti();
      window.setTimeout(() => {
        if (this.run === run) this.startEndlessBattle();
      }, 1800);
      return;
    }
    // Campaign: draft first, then (boss wins) a relic, then the next fight.
    this.pendingStep = step.step;
    this.showDraft();
  },

  /** A battle was lost: the run is over; show the defeat screen. */
  onBattleLost() {
    sfx.lose();
    setMusicMode('defeat');
    recordRun(this.run);
    renderDefeat(this.run);
  },

  /** Show the 3-card draft screen. */
  showDraft() {
    this.choiceKind = 'draft';
    const options = offerDraftCards(this.run);
    renderChoiceScreen(this.run, 'draft', options);
    sfx.draw();
  },

  /** Show the 3-relic screen. */
  showRelics() {
    this.choiceKind = 'relic';
    const options = offerRelicChoices(this.run);
    renderChoiceScreen(this.run, 'relic', options);
    sfx.relic();
  },

  /** The player picked a drafted card: take it, then continue the flow. */
  chooseDraft(cardId) {
    if (this.choiceKind !== 'draft') return;
    takeDraftCard(this.run, cardId);
    sfx.click();
    if (this.pendingStep === 'draft-then-boss') {
      this.startBossBattle();
    } else {
      // Boss win: draft, then relic, then the next act's rival.
      this.showRelics();
    }
  },

  /** The player picked a relic: take it, then start the next act. */
  chooseRelic(relicId) {
    if (this.choiceKind !== 'relic') return;
    takeRelic(this.run, relicId);
    sfx.relic();
    this.startRivalBattle();
  },

  /** Skip a choice screen (draft or relic) and continue without taking. */
  skipChoice() {
    if (this.choiceKind === 'draft') {
      if (this.pendingStep === 'draft-then-boss') this.startBossBattle();
      else this.showRelics();
    } else if (this.choiceKind === 'relic') {
      this.startRivalBattle();
    }
  },

  /** Start the campaign from Act I. */
  startCampaign() {
    ensureAudio();
    startMusic();
    setMusicMode('battle');
    sfx.click();
    this.mode = 'campaign';
    this.run = createRun('campaign', seedFromUrl());
    this.startRivalBattle();
  },

  /** Start Endless Duel from level 1. */
  startEndless() {
    ensureAudio();
    startMusic();
    setMusicMode('battle');
    sfx.click();
    this.mode = 'endless';
    this.run = createRun('endless', seedFromUrl());
    this.startEndlessBattle();
  },

  /** Begin the current act's rival battle. */
  startRivalBattle() {
    const def = currentActDef(this.run).rival;
    this.beginBattle(def);
  },

  /** Begin the current act's boss battle. */
  startBossBattle() {
    const def = currentActDef(this.run).boss;
    this.beginBattle(def);
  },

  /** Begin the current endless rival battle. */
  startEndlessBattle() {
    const def = endlessRivalForLevel(this.run.level);
    this.beginBattle(def);
  },

  /** Shared battle entry: start the engine battle, show the table. */
  beginBattle(def) {
    this.choiceKind = null;
    startBattle(this.run, def);
    showScreen('battle');
    this.refresh();
    logLine(this.run, def.taunt);
    this.refresh();
  },

  /** Restart in the same mode (from an end screen). */
  restartSameMode() {
    if (this.mode === 'endless') this.startEndless();
    else this.startCampaign();
  },

  /** Back to the title screen. */
  toTitle() {
    this.run = null;
    showScreen('title');
    setMusicMode('title');
    const best = document.getElementById('session-best');
    if (best) best.textContent = bestScoreLine();
    renderTopbar({ mode: this.mode, actIndex: 0, level: 1, score: 0, gold: 0, deck: null });
    sfx.click();
  },
};

// Test hook: headless play-tests drive the game through this object.
// (window.__emberTest = { game, playCardAt, endTurn } — set below.)
window.__emberGame = game;

/** Boot: validate the card database, wire input, then either show a
 *  deterministic ?shot= state or the title screen. */
function boot() {
  const problems = validateCardDatabase();
  if (problems.length) {
    console.error('Ember Court card database problems:', problems);
  }
  bindInput(game);
  wireInput();

  const shot = shotFromUrl();
  if (shot) {
    const state = buildShotState(shot);
    if (state) {
      if (state.shot === 'title') {
        showScreen('title');
        const best = document.getElementById('session-best');
        if (best) best.textContent = bestScoreLine();
      } else if (state.shot === 'battle') {
        game.run = state.run;
        game.mode = 'campaign';
        showScreen('battle');
        renderBattle(state.run);
      } else if (state.shot === 'victory') {
        game.run = state.run;
        renderVictory(state.run, state.reward);
        launchConfetti();
      } else if (state.shot === 'defeat') {
        game.run = state.run;
        renderDefeat(state.run);
      }
      // Mark the shot state for the test harness.
      document.body.dataset.shot = shot;
      window.__emberShot = shot;
      return;
    }
  }
  showScreen('title');
  const best = document.getElementById('session-best');
  if (best) best.textContent = bestScoreLine();
  renderTopbar({ mode: 'campaign', actIndex: 0, level: 1, score: 0, gold: 0, deck: null });
}

// Expose a small test API for the headless play-test (same-page only).
import { playCardAt, endTurn } from './input.js';
window.__emberTest = { game, playCardAt, endTurn };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
