import { describe, expect, it } from "vitest";
import { players } from "../data/players";
import { getDailyIndex, getDailyPlayer, getLimaDateKey, getPuzzleNumber, LAUNCH_DATE } from "./daily";

function addDays(dateKey: string, n: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

describe("getLimaDateKey", () => {
  it("usa la hora de Lima (UTC-5), no UTC", () => {
    expect(getLimaDateKey(new Date("2026-11-27T04:59:59Z"))).toBe("2026-11-26");
    expect(getLimaDateKey(new Date("2026-11-27T05:00:00Z"))).toBe("2026-11-27");
  });

  it("rellena mes y día con ceros", () => {
    expect(getLimaDateKey(new Date("2027-01-05T15:00:00Z"))).toBe("2027-01-05");
  });
});

describe("getPuzzleNumber", () => {
  it("el día de lanzamiento es #1 y sube de uno en uno", () => {
    expect(getPuzzleNumber(LAUNCH_DATE)).toBe(1);
    expect(getPuzzleNumber(addDays(LAUNCH_DATE, 1))).toBe(2);
    expect(getPuzzleNumber(addDays(LAUNCH_DATE, 365))).toBe(366);
  });
});

describe("getDailyPlayer", () => {
  it("es determinista: misma fecha, mismo jugador", () => {
    for (let i = 0; i < 50; i++) {
      const key = addDays(LAUNCH_DATE, i);
      expect(getDailyPlayer(key)).toBe(getDailyPlayer(key));
    }
  });

  it("todo el día de Lima da el mismo jugador sin importar la hora", () => {
    const start = getDailyPlayer(getLimaDateKey(new Date("2026-11-26T05:00:00Z"))); // 00:00 Lima
    const end = getDailyPlayer(getLimaDateKey(new Date("2026-11-27T04:59:59Z"))); // 23:59 Lima
    expect(start).toBe(end);
  });

  it("cada ciclo de N días recorre a todos los jugadores sin repetir", () => {
    const n = players.length;
    for (let cycle = 0; cycle < 20; cycle++) {
      const ids = new Set<string>();
      for (let i = 0; i < n; i++) ids.add(getDailyPlayer(addDays(LAUNCH_DATE, cycle * n + i)).id);
      expect(ids.size).toBe(n);
    }
  });

  it("nunca repite jugador dos días seguidos", () => {
    for (let i = -100; i < 1000; i++) {
      expect(getDailyIndex(addDays(LAUNCH_DATE, i))).not.toBe(getDailyIndex(addDays(LAUNCH_DATE, i + 1)));
    }
  });

  it("funciona para fechas anteriores al lanzamiento", () => {
    expect(players).toContain(getDailyPlayer(addDays(LAUNCH_DATE, -3)));
  });
});
