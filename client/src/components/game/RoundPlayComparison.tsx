
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function RoundPlayComparison({ players }: any) {
  const rounds = [
    { key: "top", label: "頭墩" },
    { key: "middle", label: "中墩" },
    { key: "bottom", label: "尾墩" },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx < rounds.length - 1) {
      const t = setTimeout(() => setIdx(i => i + 1), 1500);
      return () => clearTimeout(t);
    }
  }, [idx]);

  const lane = rounds[idx];

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-center text-xl font-bold">
        第 {idx + 1} 墩 · {lane.label}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {players.map((p: any) => (
          <div key={p.id} className="rounded-xl bg-black/20 p-3">
            <div className="font-semibold mb-2">{p.name}</div>
            <div className="flex gap-2">
              {p.arrangement?.[lane.key]?.map((c: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="w-10 h-14 bg-white text-black rounded flex items-center justify-center shadow"
                >
                  {c.rank}{c.suit}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
