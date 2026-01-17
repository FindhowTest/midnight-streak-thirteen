const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { isValidArrangement, compareArrangements } = require("./utils/thirteenEval");
const { arrangeNormal, arrangeCompetitive } = require("./utils/botArrange");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

// ===============
// In-memory rooms
// ===============
/**
 * Room = {
 *   roomId, hostId, phase, round,
 *   players: [{ id, name, hand, arrangement, ready, fouled, total }]
 * }
 */
const rooms = new Map();

const SUITS = ["S", "H", "D", "C"]; // Spade/Heart/Diamond/Club
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function toPublicRoom(room) {
  return {
    roomId: room.roomId,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isBot: !!p.isBot,
      botLevel: p.botLevel || undefined,
      ready: !!p.ready,
      fouled: !!p.fouled,
    })),
  };
}

function firstHumanId(room) {
  const h = room.players.find(p => !p.isBot);
  return h ? h.id : room.players[0]?.id;
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function removePlayerEverywhere(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.id === socketId);
    if (idx >= 0) {
      room.players.splice(idx, 1);
      // 若剩下都機器人，直接刪房
      const hasHuman = room.players.some(p => !p.isBot);
      if (room.players.length === 0 || !hasHuman) {
        rooms.delete(roomId);
        continue;
      }
      // host 掉線：轉移給第一位
      if (room.hostId === socketId) {
        room.hostId = firstHumanId(room);
      }
      io.to(roomId).emit("roomUpdate", toPublicRoom(room));
    }
  }
}

function allReady(room) {
  return room.players.length >= 2 && room.players.every(p => p.ready);
}

function genBotId() {
  return `bot-${Math.random().toString(36).slice(2, 10)}`;
}

function createBot(level) {
  const botLevel = level === 'competitive' ? 'competitive' : 'normal';
  const label = botLevel === 'competitive' ? '電腦（競技）' : '電腦（一般）';
  return {
    id: genBotId(),
    name: label,
    isBot: true,
    botLevel,
    hand: [],
    arrangement: null,
    ready: false,
    fouled: false,
    total: 0,
  };
}

function botAutoArrange(bot) {
  if (!bot?.isBot) return;
  const a = bot.botLevel === 'competitive'
    ? arrangeCompetitive(bot.hand)
    : arrangeNormal(bot.hand);
  bot.arrangement = a;
  bot.fouled = !isValidArrangement(a);
  bot.ready = true;
}

function normalizeArrangement(a) {
  return {
    top: a?.top || [],
    middle: a?.middle || [],
    bottom: a?.bottom || [],
  };
}

function cardsKey(cards) {
  return cards.map(c => `${c.rank}${c.suit}`).sort().join(",");
}

function scoreRound(room) {
  // 清空 delta
  const deltas = new Map(room.players.map(p => [p.id, 0]));

  const fouls = room.players.filter(p => p.fouled);

  // 倒水：簡化規則
  if (fouls.length > 0) {
    // fouled vs non-fouled: fouled -6, other +6
    for (const a of room.players) {
      for (const b of room.players) {
        if (a.id >= b.id) continue;
        const aF = !!a.fouled;
        const bF = !!b.fouled;
        if (aF && !bF) {
          deltas.set(a.id, deltas.get(a.id) - 6);
          deltas.set(b.id, deltas.get(b.id) + 6);
        } else if (!aF && bF) {
          deltas.set(a.id, deltas.get(a.id) + 6);
          deltas.set(b.id, deltas.get(b.id) - 6);
        }
      }
    }
  } else {
    // 正常：每一對玩家互比三墩，每墩贏 +1，輸 -1；全贏(3墩)額外 +3/-3
    const players = room.players;
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const A = players[i];
        const B = players[j];
        const cmp = compareArrangements(A.arrangement, B.arrangement);

        const sTop = cmp.top;
        const sMid = cmp.middle;
        const sBot = cmp.bottom;

        const sum = sTop + sMid + sBot;

        deltas.set(A.id, deltas.get(A.id) + sum);
        deltas.set(B.id, deltas.get(B.id) - sum);

        // 全贏：A 三墩都贏 => sum=3；B 三墩都贏 => sum=-3
        if (sum === 3) {
          deltas.set(A.id, deltas.get(A.id) + 3);
          deltas.set(B.id, deltas.get(B.id) - 3);
        } else if (sum === -3) {
          deltas.set(A.id, deltas.get(A.id) - 3);
          deltas.set(B.id, deltas.get(B.id) + 3);
        }
      }
    }
  }

  // 套用到 total
  for (const p of room.players) {
    p.total = (p.total ?? 0) + (deltas.get(p.id) ?? 0);
  }

  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    delta: deltas.get(p.id) ?? 0,
    total: p.total ?? 0,
    fouled: !!p.fouled,
    arrangement: p.arrangement,
  }));
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name }, cb) => {
    const n = String(name || "").trim().slice(0, 20);
    if (!n) return cb?.({ error: "暱稱不可為空" });

    let roomId = genRoomId();
    while (rooms.has(roomId)) roomId = genRoomId();

    const room = {
      roomId,
      hostId: socket.id,
      phase: "waiting",
      round: 0,
      players: [{
        id: socket.id,
        name: n,
        hand: [],
        arrangement: null,
        ready: false,
        fouled: false,
        total: 0,
      }],
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    cb?.({ roomId });
    io.to(roomId).emit("roomUpdate", toPublicRoom(room));
  });

  socket.on("joinRoom", ({ roomId, name }, cb) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const n = String(name || "").trim().slice(0, 20);
    const room = getRoom(rid);
    if (!room) return cb?.({ error: "房間不存在" });
    if (!n) return cb?.({ error: "暱稱不可為空" });
    if (room.phase !== "waiting") return cb?.({ error: "遊戲進行中，暫不開放加入" });
    if (room.players.length >= 4) return cb?.({ error: "房間已滿" });

    // 防止同 socket 重複加入
    if (room.players.some(p => p.id === socket.id)) {
      socket.join(rid);
      cb?.({ ok: true });
      io.to(rid).emit("roomUpdate", toPublicRoom(room));
      return;
    }

    room.players.push({
      id: socket.id,
      name: n,
      hand: [],
      arrangement: null,
      ready: false,
      fouled: false,
      total: 0,
    });

    socket.join(rid);
    cb?.({ ok: true });
    io.to(rid).emit("roomUpdate", toPublicRoom(room));
  });

  socket.on("leaveRoom", ({ roomId }) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const room = getRoom(rid);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(rid);

    const hasHuman = room.players.some(p => !p.isBot);
    if (room.players.length === 0 || !hasHuman) {
      rooms.delete(rid);
      return;
    }
    if (room.hostId === socket.id) room.hostId = firstHumanId(room);
    io.to(rid).emit("roomUpdate", toPublicRoom(room));
  });

  // Host adds bots while waiting
  socket.on("addBot", ({ roomId, level }) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const room = getRoom(rid);
    if (!room) return socket.emit("errorMsg", "房間不存在");
    if (room.hostId !== socket.id) return socket.emit("errorMsg", "只有房主可以加入電腦");
    if (room.phase !== "waiting") return socket.emit("errorMsg", "遊戲進行中，無法加入電腦");
    if (room.players.length >= 4) return socket.emit("errorMsg", "房間已滿");

    room.players.push(createBot(level));
    io.to(rid).emit("roomUpdate", toPublicRoom(room));
  });

  socket.on("removeBot", ({ roomId }) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const room = getRoom(rid);
    if (!room) return;
    if (room.hostId !== socket.id) return socket.emit("errorMsg", "只有房主可以移除電腦");
    if (room.phase !== "waiting") return socket.emit("errorMsg", "遊戲進行中，無法移除電腦");
    const idx = room.players.findIndex(p => p.isBot);
    if (idx >= 0) room.players.splice(idx, 1);
    io.to(rid).emit("roomUpdate", toPublicRoom(room));
  });

  socket.on("startGame", ({ roomId }) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const room = getRoom(rid);
    if (!room) return socket.emit("errorMsg", "房間不存在");
    if (room.hostId !== socket.id) return socket.emit("errorMsg", "只有房主可以開始");
    if (room.players.length < 2) return socket.emit("errorMsg", "至少 2 人才能開始");

    room.round += 1;
    room.phase = "arranging";

    const deck = shuffle(createDeck());
    // 發牌
    for (const p of room.players) {
      p.hand = deck.splice(0, 13);
      p.arrangement = null;
      p.ready = false;
      p.fouled = false;

      if (p.isBot) {
        // bot 自動分墩
        botAutoArrange(p);
      } else {
        // 只發給自己
        io.to(p.id).emit("deal", { roomId: rid, round: room.round, hand: p.hand });
      }
    }

    io.to(rid).emit("roomUpdate", toPublicRoom(room));

    // 若全是 bot/已自動 ready（例如 1 真人 + bot），可能直接結算
    if (allReady(room)) {
      room.phase = "result";
      const results = scoreRound(room);
      io.to(rid).emit("roundResult", { roomId: rid, round: room.round, results });
      io.to(rid).emit("roomUpdate", toPublicRoom(room));
    }
  });

  socket.on("submitArrangement", ({ roomId, arrangement }) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const room = getRoom(rid);
    if (!room) return socket.emit("errorMsg", "房間不存在");
    if (room.phase !== "arranging") return;

    const p = room.players.find(x => x.id === socket.id);
    if (!p) return;
    if (p.ready) return; // 已提交

    const a = normalizeArrangement(arrangement);

    // 1) 卡數檢查
    const totalCount = a.top.length + a.middle.length + a.bottom.length;
    if (a.top.length !== 3 || a.middle.length !== 5 || a.bottom.length !== 5 || totalCount !== 13) {
      p.fouled = true;
    }

    // 2) 必須完全等於手牌
    const handKey = cardsKey(p.hand);
    const arrKey = cardsKey([...a.top, ...a.middle, ...a.bottom]);
    if (handKey !== arrKey) {
      p.fouled = true;
    }

    // 3) 倒水判定
    if (!p.fouled && !isValidArrangement(a)) {
      p.fouled = true;
    }

    p.arrangement = a;
    p.ready = true;

    io.to(rid).emit("roomUpdate", toPublicRoom(room));

    if (allReady(room)) {
      room.phase = "result";
      const results = scoreRound(room);
      io.to(rid).emit("roundResult", { roomId: rid, round: room.round, results });
      io.to(rid).emit("roomUpdate", toPublicRoom(room));
    }
  });

  socket.on("playAgain", ({ roomId }) => {
    const rid = String(roomId || "").trim().toUpperCase();
    const room = getRoom(rid);
    if (!room) return;
    if (room.hostId !== socket.id) return socket.emit("errorMsg", "只有房主可以開新局");

    // 回到 waiting，但保留 total
    room.phase = "waiting";
    for (const p of room.players) {
      p.hand = [];
      p.arrangement = null;
      p.ready = false;
      p.fouled = false;
    }
    io.to(rid).emit("roomUpdate", toPublicRoom(room));
  });

  socket.on("disconnect", () => {
    removePlayerEverywhere(socket.id);
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
