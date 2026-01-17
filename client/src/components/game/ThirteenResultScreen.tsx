import { motion } from 'framer-motion';
import type { ThirteenPlayerState } from '@/types/thirteen';
import { Button } from '@/components/ui/button';
import { Card as UiCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayingCard } from '@/components/game/PlayingCard';
import { evalFive, evalThree, explainCategory } from '@/utils/thirteenEval';

function laneTitle(lane: 'top' | 'middle' | 'bottom') {
  if (lane === 'top') return '頭墩 (3)';
  if (lane === 'middle') return '中墩 (5)';
  return '尾墩 (5)';
}

function LaneRow(props: {
  lane: 'top' | 'middle' | 'bottom';
  cards: { rank: string; suit: string }[];
  label: string;
  typeText: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{props.label}</span>
        <span>{props.typeText}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {props.cards.map((c: any, i) => (
          <div key={`${c.rank}-${c.suit}-${i}`}>
            <PlayingCard card={c as any} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThirteenResultScreen(props: {
  players: ThirteenPlayerState[];
  roundScores: Record<string, number>;
  onNextRound: () => void;
  onRestart: () => void;
}) {
  const sorted = [...props.players].sort((a, b) => (props.roundScores[b.id] ?? 0) - (props.roundScores[a.id] ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">本局結算</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={props.onNextRound}>下一局</Button>
              <Button variant="outline" onClick={props.onRestart}>重置</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {sorted.map(p => {
              const topEval = p.arrangement.top.length === 3 ? evalThree(p.arrangement.top) : null;
              const midEval = p.arrangement.middle.length === 5 ? evalFive(p.arrangement.middle) : null;
              const botEval = p.arrangement.bottom.length === 5 ? evalFive(p.arrangement.bottom) : null;
              const score = props.roundScores[p.id] ?? 0;

              return (
                <UiCard key={p.id} className="rounded-3xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className={`${score >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{score >= 0 ? `+${score}` : score}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.fouled && (
                      <div className="text-sm text-red-500 font-semibold">倒水（不合法分墩）</div>
                    )}
                    <LaneRow
                      lane="bottom"
                      label={laneTitle('bottom')}
                      cards={p.arrangement.bottom as any}
                      typeText={botEval ? explainCategory(botEval.category) : ''}
                    />
                    <LaneRow
                      lane="middle"
                      label={laneTitle('middle')}
                      cards={p.arrangement.middle as any}
                      typeText={midEval ? explainCategory(midEval.category) : ''}
                    />
                    <LaneRow
                      lane="top"
                      label={laneTitle('top')}
                      cards={p.arrangement.top as any}
                      typeText={topEval ? explainCategory(topEval.category) : ''}
                    />
                    <div className="text-xs text-muted-foreground">
                      累積：{p.totalScore}
                    </div>
                  </CardContent>
                </UiCard>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
