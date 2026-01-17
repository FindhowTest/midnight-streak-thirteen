import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import type { Card } from "@/types/game";
import type { ThirteenArrangement } from "@/types/thirteen";
import type {
  DealPayload,
  RoomPublicState,
  RoundResultPayload,
} from "@/types/online";

export function useOnlineThirteen() {
  const myId = socket.id;

  const [name, setName] = useState<string>(() => {
    return localStorage.getItem("thirteen_name") || "";
  });
  const [roomId, setRoomId] = useState<string>("");
  const [room, setRoom] = useState<RoomPublicState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [result, setResult] = useState<RoundResultPayload | null>(null);
  const [error, setError] = useState<string>("");

  const connectedRef = useRef(false);

  useEffect(() => {
    if (name) localStorage.setItem("thirteen_name", name);
  }, [name]);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const onRoomUpdate = (payload: RoomPublicState) => {
      setRoom(payload);
      setRoomId(payload.roomId);
      setError("");
      // phase 切換時，清掉上一局 result
      if (payload.phase !== "result") {
        setResult(null);
      }
    };

    const onDeal = (payload: DealPayload) => {
      setHand(payload.hand);
      setResult(null);
      setError("");
    };

    const onRoundResult = (payload: RoundResultPayload) => {
      setResult(payload);
      setError("");
    };

    const onError = (msg: string) => {
      setError(msg || "發生錯誤");
    };

    socket.on("roomUpdate", onRoomUpdate);
    socket.on("deal", onDeal);
    socket.on("roundResult", onRoundResult);
    socket.on("errorMsg", onError);

    return () => {
      socket.off("roomUpdate", onRoomUpdate);
      socket.off("deal", onDeal);
      socket.off("roundResult", onRoundResult);
      socket.off("errorMsg", onError);
    };
  }, []);

  const isHost = useMemo(() => {
    return !!room && socket.id === room.hostId;
  }, [room]);

  const me = useMemo(() => {
    return room?.players.find(p => p.id === socket.id) || null;
  }, [room]);

  const createRoom = useCallback(async () => {
    setError("");
    if (!name.trim()) {
      setError("請先輸入暱稱");
      return;
    }
    socket.emit("createRoom", { name: name.trim() }, (res: any) => {
      if (res?.error) setError(res.error);
      if (res?.roomId) setRoomId(res.roomId);
    });
  }, [name]);

  const joinRoom = useCallback(
    async (rid: string) => {
      setError("");
      if (!name.trim()) {
        setError("請先輸入暱稱");
        return;
      }
      const upper = rid.trim().toUpperCase();
      socket.emit("joinRoom", { roomId: upper, name: name.trim() }, (res: any) => {
        if (res?.error) setError(res.error);
        if (res?.ok) setRoomId(upper);
      });
    },
    [name]
  );

  const leaveRoom = useCallback(() => {
    if (!roomId) return;
    socket.emit("leaveRoom", { roomId });
    setRoom(null);
    setRoomId("");
    setHand([]);
    setResult(null);
  }, [roomId]);

  const startGame = useCallback(() => {
    if (!roomId) return;
    socket.emit("startGame", { roomId });
  }, [roomId]);

  const addBot = useCallback(
    (level: 'normal' | 'competitive') => {
      if (!roomId) return;
      socket.emit('addBot', { roomId, level });
    },
    [roomId]
  );

  const removeBot = useCallback(() => {
    if (!roomId) return;
    socket.emit('removeBot', { roomId });
  }, [roomId]);

  const submitArrangement = useCallback(
    (arrangement: ThirteenArrangement) => {
      if (!roomId) return;
      socket.emit("submitArrangement", { roomId, arrangement });
    },
    [roomId]
  );

  const playAgain = useCallback(() => {
    if (!roomId) return;
    socket.emit("playAgain", { roomId });
  }, [roomId]);

  return {
    socketId: myId,
    name,
    setName,
    roomId,
    room,
    me,
    isHost,
    hand,
    result,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    addBot,
    removeBot,
    submitArrangement,
    playAgain,
  };
}
