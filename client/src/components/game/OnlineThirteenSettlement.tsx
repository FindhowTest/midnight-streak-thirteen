import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card as UiCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayingCard } from "@/components/game/PlayingCard";
import type { RoomPublicState, RoundPlayerResult, RoundResultPayload } from "@/types/online";
import type { ThirteenArrangement } from "@/types/thirteen";
import type { Card } from "@/types/game";
import { compareEval, evalFive, evalThree } from "@/utils/thirteenEval";

type LaneKey = "top" | "middle" | "bottom" | "total";

function laneTitle(lane: Exclude<LaneKey, "total">) {
  if (lane === "top") return "頭墩";
  if (lane === "middle") return "中墩";
  return "尾墩";
}

function getLaneCards(a: ThirteenArrangement | undefined, lane: Exclude<LaneKey, "total">): Card[] {
  if (!a) return [];
  return lane === "top" ? a.top : lane === "middle" ? a.middle : a.bottom;
}

function compareLane(a: ThirteenArrangement | undefined, b: ThirteenArrangement | undefined, lane: Exclude<LaneKey, "total">): number {
  const A = getLaneCards(a, lane);
  const B = getLaneCards(b, lane);
  if (lane === "top") {
    if (A.length !== 3 || B.length !== 3) return 0;
    return Math.sign(compareEval(evalThree(A), evalThree(B)));
  }
  if (A.length !== 5 || B.length !== 5) return 0;
  return Math.sign(compareEval(evalFive(A), evalFive(B)));
}

function netLaneScore(results: RoundPlayerResult[], lane: Exclude<LaneKey, "total">): Record<string, number> {
  const score: Record<string, number> = {};
  for (const r of results) score[r.id] = 0;

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const A = results[i];
      const B = results[j];

      // 倒水：顯示上我們不做逐墩勝負（避免跟伺服器簡化規則不一致）
      if (A.fouled || B.fouled) continue;

      const cmp = compareLane(A.arrangement, B.arrangement, lane);
      score[A.id] += cmp;
      score[B.id] -= cmp;
    }
  }

  return score;
}

function posLabel(pos: "TOP" | "LEFT" | "RIGHT" | "BOTTOM") {
  if (pos === "TOP") return "上家";
  if (pos === "LEFT") return "左家";
  if (pos === "RIGHT") return "右家";
  return "你";
}

function toSeatMap(room: RoomPublicState, myId: string) {
  const others = room.players.filter((p) => p.id !== myId);
  const seats: Array<{ id: string; pos: "TOP" | "LEFT" | "RIGHT" | "BOTTOM" }> = [];
  seats.push({ id: myId, pos: "BOTTOM" });
  if (others[0]) seats.push({ id: others[0].id, pos: "TOP" });
  if (others[1]) seats.push({ id: others[1].id, pos: "LEFT" });
  if (others[2]) seats.push({ id: others[2].id, pos: "RIGHT" });
  return seats;
}

function SeatCard(props: {
  pos: "TOP" | "LEFT" | "RIGHT" | "BOTTOM";
  player: RoundPlayerResult;
  activeLane: LaneKey;
  laneNet: {
    top: Record<string, number>;
    middle: Record<string, number>;
    bottom: Record<string, number>;
  };
}) {
  const { player, pos, activeLane, laneNet } = props;

  const dim = activeLane !== "total";
  const showTop = activeLane === "top" || activeLane === "total";
  const showMid = activeLane === "middle" || activeLane === "total";
  const showBot = activeLane === "bottom" || activeLane === "total";

  const topScore = laneNet.top[player.id] ?? 0;
  const midScore = laneNet.middle[player.id] ?? 0;
  const botScore = laneNet.bottom[player.id] ?? 0;

  const laneOpacity = (lane: Exclude<LaneKey, "total">) => {
    if (!dim) return 1;
    return activeLane === lane ? 1 : 0.25;
  };

  const badge = (v: number) => {
    if (v === 0) return <span className="text-muted-foreground">0</span>;
    return <span className={v > 0 ? "text-emerald-500" : "text-red-500"}>{v > 0 ? `+${v}` : v}</span>;
  };

  return (
    <UiCard className="glass rounded-3xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate">{player.name}</div>
            <div className="text-xs text-muted-foreground">{posLabel(pos)}{player.fouled ? "（倒水）" : ""}</div>
          </div>
          <div className="text-right">
            <div className={player.delta >= 0 ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>
              {player.delta >= 0 ? `+${player.delta}` : player.delta}
            </div>
            <div className="text-xs text-muted-foreground">總分 {player.total}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 尾 */}
        <div className="space-y-1" style={{ opacity: laneOpacity("bottom") }}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{laneTitle("bottom")} (5)</span>
            <span>本墩：{badge(botScore)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {showBot && (player.arrangement?.bottom ?? []).map((c, i) => (
              <PlayingCard key={`b-${player.id}-${c.rank}-${c.suit}-${i}`} card={c as any} size="sm" />
            ))}
          </div>
        </div>

        {/* 中 */}
        <div className="space-y-1" style={{ opacity: laneOpacity("middle") }}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{laneTitle("middle")} (5)</span>
            <span>本墩：{badge(midScore)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {showMid && (player.arrangement?.middle ?? []).map((c, i) => (
              <PlayingCard key={`m-${player.id}-${c.rank}-${c.suit}-${i}`} card={c as any} size="sm" />
            ))}
          </div>
        </div>

        {/* 頭 */}
        <div className="space-y-1" style={{ opacity: laneOpacity("top") }}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{laneTitle("top")} (3)</span>
            <span>本墩：{badge(topScore)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {showTop && (player.arrangement?.top ?? []).map((c, i) => (
              <PlayingCard key={`t-${player.id}-${c.rank}-${c.suit}-${i}`} card={c as any} size="sm" />
            ))}
          </div>
        </div>
      </CardContent>
    </UiCard>
  );
}

export function OnlineThirteenSettlement(props: {
  room: RoomPublicState;
  result: RoundResultPayload;
  myId: string;
  isHost: boolean;
  onPlayAgain: () => void;
}) {
  const [activeLane, setActiveLane] = useState<LaneKey>("top");
  const [autoPlay, setAutoPlay] = useState(true);

  const resultsById = useMemo(() => {
    const m = new Map<string, RoundPlayerResult>();
    for (const r of props.result.results) m.set(r.id, r);
    return m;
  }, [props.result.results]);

  const seats = useMemo(() => {
    return toSeatMap(props.room, props.myId)
      .map(s => ({ ...s, player: resultsById.get(s.id) }))
      .filter((s): s is { id: string; pos: "TOP" | "LEFT" | "RIGHT" | "BOTTOM"; player: RoundPlayerResult } => !!s.player);
  }, [props.room, props.myId, resultsById]);

  const laneNet = useMemo(() => {
    return {
      top: netLaneScore(props.result.results, "top"),
      middle: netLaneScore(props.result.results, "middle"),
      bottom: netLaneScore(props.result.results, "bottom"),
    };
  }, [props.result.results]);

  // 自動逐墩播放：頭 -> 中 -> 尾 -> 總分
  useEffect(() => {
    if (!autoPlay) return;
    const order: LaneKey[] = ["top", "middle", "bottom", "total"];
    const idx = order.indexOf(activeLane);
    const next = order[Math.min(idx + 1, order.length - 1)];
    if (activeLane === "total") return;

    const t = window.setTimeout(() => {
      setActiveLane(next);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [activeLane, autoPlay]);

  const jump = (lane: LaneKey) => {
    setAutoPlay(false);
    setActiveLane(lane);
  };

  const replay = () => {
    setActiveLane("top");
    setAutoPlay(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="text-lg font-bold text-gradient">四人攤牌</div>
          <div className="text-sm text-muted-foreground">
            依序展示：頭墩 → 中墩 → 尾墩 → 總分
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={activeLane === "top" ? "default" : "secondary"} onClick={() => jump("top")}>頭墩</Button>
          <Button variant={activeLane === "middle" ? "default" : "secondary"} onClick={() => jump("middle")}>中墩</Button>
          <Button variant={activeLane === "bottom" ? "default" : "secondary"} onClick={() => jump("bottom")}>尾墩</Button>
          <Button variant={activeLane === "total" ? "default" : "secondary"} onClick={() => jump("total")}>總分</Button>
          <Button variant="outline" onClick={replay}>重播</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {seats.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SeatCard
              pos={s.pos}
              player={s.player}
              activeLane={activeLane}
              laneNet={laneNet}
            />
          </motion.div>
        ))}
      </div>

      <UiCard className="glass rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>操作</span>
            {props.isHost ? (
              <Button onClick={props.onPlayAgain}>再來一局</Button>
            ) : (
              <Button disabled>等待房主開新局…</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <div>提示：如果你覺得「開始房間/送出」偶爾慢，通常是網路/連線品質或是同時多個事件渲染造成；逐墩展示可以讓玩家更有感，也能降低「只有分數不透明」的疑慮。</div>
          <div>本墩分數顯示的是「對其他所有玩家的淨勝分」（每贏一位 +1、輸一位 -1）。若有人倒水，伺服器會用簡化規則計分，本畫面不逐墩算勝負（避免不一致）。</div>
        </CardContent>
      </UiCard>
    </div>
  );
}
