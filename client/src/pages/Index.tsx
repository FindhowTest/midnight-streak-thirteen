import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlowingBackground } from "@/components/game/FlowingBackground";
import { GameHeader } from "@/components/game/GameHeader";
import { PlayerCard } from "@/components/game/PlayerCard";
import { ThirteenArrangePanel } from "@/components/game/ThirteenArrangePanel";
import { Button } from "@/components/ui/button";
import { Card as UiCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { useOnlineThirteen } from "@/hooks/useOnlineThirteen";
import type { Card } from "@/types/game";
import type { Lane, ThirteenArrangement, ThirteenPlayerState } from "@/types/thirteen";
import { isValidArrangement } from "@/utils/thirteenEval";

function countChosen(a: ThirteenArrangement) {
  return a.top.length + a.middle.length + a.bottom.length;
}

function removeCard(list: Card[], card: Card) {
  return list.filter(c => !(c.rank === card.rank && c.suit === card.suit));
}

export default function Index() {
  const { isDark, toggleTheme } = useTheme();
  const online = useOnlineThirteen();

  const [joinCode, setJoinCode] = useState("");

  // 我方分墩狀態
  const [activeLane, setActiveLane] = useState<Lane>("bottom");
  const [arrangement, setArrangement] = useState<ThirteenArrangement>({
    top: [],
    middle: [],
    bottom: [],
  });

  // 當 server 發新手牌 / phase 切換時，清空分墩
  const roundKey = online.room?.round ?? 0;
  useEffect(() => {
    setArrangement({ top: [], middle: [], bottom: [] });
    setActiveLane("bottom");
  }, [roundKey, online.room?.phase]);

  const chosenCount = countChosen(arrangement);
  const valid = chosenCount === 13 ? isValidArrangement(arrangement) : false;

  const myPlayerState: ThirteenPlayerState | null = useMemo(() => {
    if (!online.room) return null;
    const me = online.me;
    if (!me) return null;
    return {
      id: me.id,
      name: me.name,
      isComputer: false,
      color: "hsl(210, 100%, 60%)",
      totalScore: online.result?.results.find(r => r.id === me.id)?.total ?? 0,
      hand: online.hand,
      arrangement,
      locked: me.ready,
    };
  }, [online.room, online.me, online.hand, arrangement, online.result]);

  const moveCardToLane = (card: Card, lane: Lane) => {
    setArrangement(prev => {
      // 已在任何墩就不重複加
      const inAny = [...prev.top, ...prev.middle, ...prev.bottom].some(
        c => c.rank === card.rank && c.suit === card.suit
      );
      if (inAny) return prev;

      const next = { ...prev, top: [...prev.top], middle: [...prev.middle], bottom: [...prev.bottom] };
      const cap = lane === "top" ? 3 : 5;
      if (next[lane].length >= cap) return prev;
      next[lane].push(card);
      return next;
    });
  };

  const removeCardFromLane = (card: Card, lane: Lane) => {
    setArrangement(prev => {
      const next = { ...prev, top: [...prev.top], middle: [...prev.middle], bottom: [...prev.bottom] };
      next[lane] = removeCard(next[lane], card);
      return next;
    });
  };

  const clearArrangement = () => setArrangement({ top: [], middle: [], bottom: [] });

  const autoArrange = () => {
    // 簡易：先放尾 5、中 5、頭 3（依牌大到小）
    const sorted = [...online.hand].sort((a, b) => {
      const order = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
      return order.indexOf(b.rank) - order.indexOf(a.rank);
    });
    setArrangement({
      bottom: sorted.slice(0, 5),
      middle: sorted.slice(5, 10),
      top: sorted.slice(10, 13),
    });
  };

  const lockIn = () => {
    if (chosenCount !== 13) return;
    online.submitArrangement(arrangement);
  };

  // ------------------ UI ------------------

  // 沒進房：Lobby
  if (!online.roomId || !online.room) {
    return (
      <div className="min-h-screen relative">
        <FlowingBackground />
        <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-4">
          <GameHeader isDark={isDark} onToggleTheme={toggleTheme} />

          <UiCard className="glass rounded-3xl">
            <CardHeader>
              <CardTitle>十三支｜朋友連線版</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-semibold">你的暱稱</div>
                <Input
                  value={online.name}
                  onChange={(e) => online.setName(e.target.value)}
                  placeholder="例如：Xiannn"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={online.createRoom} className="w-full">建立房間</Button>
                <Button
                  variant="secondary"
                  onClick={() => online.joinRoom(joinCode)}
                  className="w-full"
                >
                  加入房間
                </Button>
              </div>

              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="輸入房號（例如：A1B2C3）"
              />

              {online.error && (
                <div className="text-sm text-red-500">{online.error}</div>
              )}

              <div className="text-xs text-muted-foreground">
                玩法：房主開始後由伺服器洗牌發牌，每人 13 張，分成 尾5/中5/頭3，並且「尾 ≥ 中 ≥ 頭」。
              </div>
            </CardContent>
          </UiCard>
        </div>
      </div>
    );
  }

  // 進房後（等待 or 遊戲中）
  const room = online.room;

  // 等待開始
  if (room.phase === "waiting") {
    return (
      <div className="min-h-screen relative">
        <FlowingBackground />
        <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-4">
          <GameHeader isDark={isDark} onToggleTheme={toggleTheme} />

          <UiCard className="glass rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>房間：{room.roomId}</span>
                <Button variant="outline" size="sm" onClick={online.leaveRoom}>離開</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-semibold">玩家（{room.players.length}/4）</div>
                <motion.div layout className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {room.players.map(p => (
                      <PlayerCard
                        key={p.id}
                        player={{
                          id: p.id,
                          name: p.name + (p.id === room.hostId ? "（房主）" : ""),
                          isComputer: !!p.isBot,
                          color: "hsl(210, 100%, 60%)",
                          totalScore: 0,
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>

              {online.isHost ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => online.addBot('normal')}
                      disabled={room.players.length >= 4}
                      className="w-full"
                    >
                      加入一般電腦
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => online.addBot('competitive')}
                      disabled={room.players.length >= 4}
                      className="w-full"
                    >
                      加入競技電腦
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={online.removeBot}
                    disabled={!room.players.some(p => p.isBot)}
                    className="w-full"
                  >
                    移除一個電腦
                  </Button>

                  <Button
                    onClick={online.startGame}
                    disabled={room.players.length < 2}
                    className="w-full"
                  >
                    開始遊戲
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">等待房主開始…</div>
              )}

              {online.error && (
                <div className="text-sm text-red-500">{online.error}</div>
              )}
            </CardContent>
          </UiCard>
        </div>
      </div>
    );
  }

  // 分墩階段
  if (room.phase === "arranging" && myPlayerState) {
    const others = room.players.filter(p => p.id !== myPlayerState.id);
    return (
      <div className="min-h-screen relative">
        <FlowingBackground />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-lg font-bold text-gradient">房間 {room.roomId}｜第 {room.round} 局</div>
              <div className="text-sm text-muted-foreground">分墩完成後「鎖定提交」，等待其他人</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={online.leaveRoom}>離開</Button>
              <GameHeader isDark={isDark} onToggleTheme={toggleTheme} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,320px] gap-4">
            <ThirteenArrangePanel
              player={myPlayerState}
              activeLane={activeLane}
              onLaneChange={setActiveLane}
              onPickFromHand={(c) => moveCardToLane(c, activeLane)}
              onRemoveFromLane={removeCardFromLane}
              onAuto={autoArrange}
              onClear={clearArrangement}
              onLockIn={lockIn}
              chosenCount={chosenCount}
              isValid={valid}
            />

            <UiCard className="glass rounded-3xl h-fit">
              <CardHeader>
                <CardTitle>房內狀態</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {others.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="truncate">{p.name}</div>
                    <div className={p.ready ? "text-emerald-500" : "text-muted-foreground"}>
                      {p.ready ? "已提交" : "分墩中"}
                    </div>
                  </div>
                ))}

                <div className="pt-2 text-xs text-muted-foreground">
                  你：{online.me?.ready ? "已提交" : "分墩中"}
                  {chosenCount === 13 && !valid ? "（目前倒水）" : ""}
                </div>
                {online.error && (
                  <div className="text-sm text-red-500">{online.error}</div>
                )}
              </CardContent>
            </UiCard>
          </div>
        </div>
      </div>
    );
  }

  // 結果
  if (room.phase === "result" && online.result) {
    return (
      <div className="min-h-screen relative">
        <FlowingBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-lg font-bold text-gradient">第 {online.result.round} 局結果</div>
              <div className="text-sm text-muted-foreground">所有人已亮牌結算</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={online.leaveRoom}>離開</Button>
              <GameHeader isDark={isDark} onToggleTheme={toggleTheme} />
            </div>
          </div>

          <UiCard className="glass rounded-3xl">
            <CardHeader>
              <CardTitle>分數</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {online.result.results
                .slice()
                .sort((a, b) => b.total - a.total)
                .map(r => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="font-semibold">
                      {r.name}{r.fouled ? "（倒水）" : ""}
                    </div>
                    <div className="text-sm">
                      <span className={r.delta >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {r.delta >= 0 ? "+" : ""}{r.delta}
                      </span>
                      <span className="text-muted-foreground"> ／ 總分 {r.total}</span>
                    </div>
                  </div>
                ))}

              <div className="pt-3 flex gap-2">
                {online.isHost ? (
                  <Button onClick={online.playAgain} className="w-full">再來一局</Button>
                ) : (
                  <Button disabled className="w-full">等待房主開新局…</Button>
                )}
              </div>
            </CardContent>
          </UiCard>
        </div>
      </div>
    );
  }

  return null;
}
