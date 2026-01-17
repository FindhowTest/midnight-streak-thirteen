import { motion } from 'framer-motion';
import type { Card } from '@/types/game';
import type { Lane, ThirteenPlayerState } from '@/types/thirteen';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card as UiCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayingCard } from '@/components/game/PlayingCard';

function laneLabel(lane: Lane) {
  switch (lane) {
    case 'top': return '頭墩 (3)';
    case 'middle': return '中墩 (5)';
    default: return '尾墩 (5)';
  }
}

export function ThirteenArrangePanel(props: {
  player: ThirteenPlayerState;
  activeLane: Lane;
  onLaneChange: (lane: Lane) => void;
  onPickFromHand: (card: Card) => void;
  onRemoveFromLane: (card: Card, lane: Lane) => void;
  onAuto: () => void;
  onClear: () => void;
  onLockIn: () => void;
  chosenCount: number;
  isValid: boolean;
}) {
  const { player, activeLane, onLaneChange, onPickFromHand, onRemoveFromLane, onAuto, onClear, onLockIn, chosenCount, isValid } = props;

  const remaining = player.hand.filter(c => {
    const inTop = player.arrangement.top.some(x => x.rank === c.rank && x.suit === c.suit);
    const inMid = player.arrangement.middle.some(x => x.rank === c.rank && x.suit === c.suit);
    const inBot = player.arrangement.bottom.some(x => x.rank === c.rank && x.suit === c.suit);
    return !(inTop || inMid || inBot);
  });

  const laneView = (lane: Lane, cards: Card[], cap: number) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{laneLabel(lane)}</div>
        <div className="text-xs text-muted-foreground">{cards.length}/{cap}</div>
      </div>
      <div className="min-h-[84px] rounded-2xl border border-border/50 bg-background/30 p-2 flex flex-wrap gap-2">
        {cards.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-6">點下方手牌，放到目前選擇的墩</div>
        )}
        {cards.map((c) => (
          <button
            key={`${c.rank}-${c.suit}`}
            onClick={() => onRemoveFromLane(c, lane)}
            className="hover:scale-[1.02] transition-transform"
            title="點我移回手牌"
          >
            <PlayingCard card={c} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <UiCard className="glass rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{player.name} 分墩</span>
          <span className={`text-sm ${chosenCount === 13 ? (isValid ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
            {chosenCount}/13 {chosenCount === 13 ? (isValid ? '✅ 合法' : '❌ 倒水') : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lane selector */}
        <Tabs value={activeLane} onValueChange={(v) => onLaneChange(v as Lane)}>
          <TabsList className="w-full">
            <TabsTrigger value="bottom" className="flex-1">尾</TabsTrigger>
            <TabsTrigger value="middle" className="flex-1">中</TabsTrigger>
            <TabsTrigger value="top" className="flex-1">頭</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-3">
          {laneView('bottom', player.arrangement.bottom, 5)}
          {laneView('middle', player.arrangement.middle, 5)}
          {laneView('top', player.arrangement.top, 3)}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onAuto}>自動分墩</Button>
          <Button variant="outline" onClick={onClear}>清空</Button>
          <Button
            className="ml-auto"
            onClick={onLockIn}
            disabled={chosenCount !== 13}
          >
            鎖定提交
          </Button>
        </div>

        {/* Hand */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">手牌（點一下 → 放到 {laneLabel(activeLane)}）</div>
          <div className="rounded-2xl border border-border/50 bg-background/30 p-2 flex flex-wrap gap-2">
            {remaining.map((c) => (
              <motion.button
                key={`${c.rank}-${c.suit}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickFromHand(c)}
                className="hover:scale-[1.02] transition-transform"
              >
                <PlayingCard card={c} size="sm" />
              </motion.button>
            ))}
          </div>
        </div>
      </CardContent>
    </UiCard>
  );
}
