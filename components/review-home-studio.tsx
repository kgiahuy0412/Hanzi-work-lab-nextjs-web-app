"use client";

import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Vocabulary } from "@/lib/content-types";
import type { DailySessionSnapshot } from "@/lib/daily-session";

type ReviewHomeStudioProps = {
  authenticated: boolean;
  dailySession: DailySessionSnapshot;
  verified?: boolean;
  vocabulary: Vocabulary[];
};

export function ReviewHomeStudio({ verified = false }: ReviewHomeStudioProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="learner-dashboard home-portal-dashboard">
      <section className="home-portal-hero" aria-labelledby="home-portal-title">
        <div aria-hidden="true" className="home-portal-art">
          <img
            alt=""
            decoding="async"
            fetchPriority="high"
            sizes="(max-width: 720px) 100vw, calc(100vw - 88px)"
            src="/assets/home/himi-language-portal-hero-1536.webp"
            srcSet="/assets/home/himi-language-portal-hero-1536.webp 1536w, /assets/home/himi-language-portal-hero-2k.webp 2560w, /assets/home/himi-language-portal-hero-4k.webp 3840w"
          />
        </div>

        {verified ? (
          <p className="home-portal-success" role="status">
            <Check aria-hidden="true" size={17} /> Email đã xác minh. Chào mừng bạn đến Himi Chinese.
          </p>
        ) : null}

        <motion.div
          className="home-portal-copy"
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .62, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 id="home-portal-title">
            <span>Nói tiếng</span>
            <span>Trung trong</span>
            <span>đời sống thật</span>
          </h1>
          <p>Himi đưa bạn vào tình huống thật —<br />nghe, nói và phản xạ tự nhiên.</p>

          <div className="home-portal-actions">
            <Link className="home-portal-primary" href="/practice" prefetch>
              Bắt đầu luyện nói <ArrowRight aria-hidden="true" size={23} />
            </Link>
            <Link className="home-portal-secondary" href="/courses" prefetch>
              <span aria-hidden="true"><Play size={18} fill="currentColor" /></span>
              Xem lộ trình
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
