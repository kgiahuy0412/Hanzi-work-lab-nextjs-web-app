"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Gauge } from "lucide-react";
import {
  combineListeningPerformance,
  emptyListeningPerformance,
  HSK_LISTENING_PERFORMANCE_KEY,
  parseListeningPerformance,
  parseScenarioListeningPerformance,
  SCENARIO_LISTENING_PERFORMANCE_KEY,
  summarizeListeningPerformance,
  type ListeningPerformanceTotals,
} from "@/lib/listening-performance";
import { formatPracticeReactionTime } from "@/lib/practice-performance";

export function ListeningPerformanceSummary({
  authenticated,
  initialScenarioPerformance = emptyListeningPerformance,
}: {
  authenticated?: boolean;
  initialScenarioPerformance?: ListeningPerformanceTotals;
}) {
  const [hskPerformance, setHskPerformance] = useState<ListeningPerformanceTotals>(emptyListeningPerformance);
  const [scenarioPerformance, setScenarioPerformance] = useState<ListeningPerformanceTotals>(
    authenticated ? initialScenarioPerformance : emptyListeningPerformance,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadPerformance() {
      try {
        setHskPerformance(parseListeningPerformance(
          window.localStorage.getItem(HSK_LISTENING_PERFORMANCE_KEY),
        ));
        if (authenticated === false) {
          setScenarioPerformance(parseScenarioListeningPerformance(
            window.localStorage.getItem(SCENARIO_LISTENING_PERFORMANCE_KEY),
          ));
          return;
        }
        if (authenticated === undefined) {
          const response = await fetch("/api/progress/practice", {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) {
            setScenarioPerformance(parseScenarioListeningPerformance(
              window.localStorage.getItem(SCENARIO_LISTENING_PERFORMANCE_KEY),
            ));
            return;
          }
          const body: unknown = await response.json();
          const progress = body && typeof body === "object"
            ? (body as { progress?: unknown }).progress
            : null;
          setScenarioPerformance(parseListeningPerformance(JSON.stringify(progress ?? null)));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHskPerformance(emptyListeningPerformance);
        if (authenticated !== true) {
          try {
            setScenarioPerformance(parseScenarioListeningPerformance(
              window.localStorage.getItem(SCENARIO_LISTENING_PERFORMANCE_KEY),
            ));
          } catch {
            setScenarioPerformance(emptyListeningPerformance);
          }
        }
      }
    }

    void loadPerformance();
    return () => controller.abort();
  }, [authenticated]);

  const totals = useMemo(
    () => combineListeningPerformance(scenarioPerformance, hskPerformance),
    [hskPerformance, scenarioPerformance],
  );
  const { accuracyPercent, averageReactionMs } = summarizeListeningPerformance(totals);

  return (
    <section className="listening-performance-summary" aria-labelledby="listening-performance-title">
      <div className="listening-performance-heading">
        <span className="listening-performance-heading-icon"><BarChart3 aria-hidden="true" size={20} /></span>
        <span>
          <strong id="listening-performance-title">Báo cáo luyện nghe</strong>
          <small>Tổng hợp kết quả từ HSK và Theo tình huống</small>
        </span>
      </div>
      <div className="listening-performance-metrics">
        <div>
          <BarChart3 aria-hidden="true" size={18} />
          <span><strong>{totals.totalQuestions}</strong><small>Tổng số câu</small></span>
        </div>
        <div>
          <CheckCircle2 aria-hidden="true" size={18} />
          <span><strong>{accuracyPercent === null ? "—" : `${accuracyPercent}%`}</strong><small>Độ chính xác</small></span>
        </div>
        <div>
          <Gauge aria-hidden="true" size={18} />
          <span><strong>{formatPracticeReactionTime(averageReactionMs)}</strong><small>Phản xạ trung bình</small></span>
        </div>
      </div>
    </section>
  );
}
