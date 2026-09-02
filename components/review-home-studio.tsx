"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, AudioLines, BrainCircuit, Check, Mic2, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Vocabulary } from "@/lib/content-types";
import type { DailySessionSnapshot } from "@/lib/daily-session";

type ReviewHomeStudioProps = {
  authenticated: boolean;
  dailySession: DailySessionSnapshot;
  verified?: boolean;
  vocabulary: Vocabulary[];
};

const HOME_DIALOGUE = [
  { speaker: "man", hanzi: "你今天怎么样？", pinyin: "nǐ jīntiān zěnmeyàng?", translation: "Hôm nay bạn thế nào?" },
  { speaker: "woman", hanzi: "很好，谢谢！", pinyin: "hěn hǎo, xièxie!", translation: "Rất tốt, cảm ơn!" },
  { speaker: "man", hanzi: "一起练习中文吧。", pinyin: "yìqǐ liànxí zhōngwén ba.", translation: "Cùng luyện tiếng Trung nhé." },
  { speaker: "woman", hanzi: "好，我们开始吧！", pinyin: "hǎo, wǒmen kāishǐ ba!", translation: "Được, bắt đầu thôi!" },
] as const;

export function ReviewHomeStudio({ verified = false }: ReviewHomeStudioProps) {
  const reduceMotion = useReducedMotion();
  const [activeDialogue, setActiveDialogue] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const motionEnabled = !reduceMotion && pageVisible;
  const dialogue = HOME_DIALOGUE[activeDialogue];

  useEffect(() => {
    const syncVisibility = () => setPageVisible(document.visibilityState === "visible");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    if (!motionEnabled) return;
    const timer = window.setInterval(() => {
      setActiveDialogue((current) => (current + 1) % HOME_DIALOGUE.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [motionEnabled]);

  return (
    <main className="learner-dashboard home-portal-dashboard">
      <section className={`home-portal-hero${motionEnabled ? " is-motion-active" : " is-motion-paused"}`} aria-labelledby="home-portal-title">
        <div aria-hidden="true" className="home-portal-art">
          <motion.img
            alt=""
            animate={motionEnabled ? { scale: [1.015, 1.04, 1.015], x: [0, -8, 0], y: [0, 4, 0] } : { scale: 1, x: 0, y: 0 }}
            decoding="async"
            fetchPriority="high"
            sizes="(max-width: 720px) 100vw, calc(100vw - 88px)"
            src="/assets/home/himi-language-portal-clean-1536.webp"
            srcSet="/assets/home/himi-language-portal-clean-1536.webp 1536w, /assets/home/himi-language-portal-clean-2k.webp 2560w, /assets/home/himi-language-portal-clean-4k.webp 3840w"
            transition={{ duration: 16, ease: "easeInOut", repeat: motionEnabled ? Infinity : 0 }}
          />
        </div>

        <div aria-hidden="true" className="home-portal-conversation">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`home-portal-dialogue is-${dialogue.speaker}`}
              exit={{ opacity: 0, scale: .96, y: -8 }}
              initial={motionEnabled ? { opacity: 0, scale: .96, y: 10 } : false}
              key={`${dialogue.speaker}-${activeDialogue}`}
              transition={{ duration: .38, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{dialogue.pinyin}</span>
              <strong>{dialogue.hanzi}</strong>
              <small>{dialogue.translation}</small>
              <i className="home-portal-dialogue-wave"><b /><b /><b /></i>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          aria-hidden="true"
          animate={motionEnabled ? { y: [0, -4, 0] } : { y: 0 }}
          className="home-portal-himi-stage"
          transition={{ duration: 4.8, ease: "easeInOut", repeat: motionEnabled ? Infinity : 0 }}
        >
          <Image
            alt=""
            height="420"
            src={motionEnabled ? "/assets/mascot/himi-v2/himi-wave.gif?v=fluid-50fps" : "/assets/mascot/himi-v2/himi-wave.webp"}
            unoptimized
            width="420"
          />
        </motion.div>

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
            <span>Mỗi ngày một tí,</span>
            <span>tự tin cùng <em>Homi</em>.</span>
          </h1>
          <p>Tình huống thật. Phản xạ tự nhiên.</p>

          <div className="home-portal-actions">
            <Link className="home-portal-primary" href="/listening?mode=scenario" prefetch>
              Bắt đầu luyện nói <ArrowRight aria-hidden="true" size={23} />
            </Link>
            <Link className="home-portal-secondary" href="/courses" prefetch>
              <span aria-hidden="true"><Play size={18} fill="currentColor" /></span>
              Xem lộ trình
            </Link>
          </div>

          <nav aria-label="Bắt đầu luyện nhanh" className="home-portal-quick-dock">
            <Link className="home-portal-quick-action is-primary" href="/listening?mode=scenario" prefetch>
              <Mic2 aria-hidden="true" size={26} strokeWidth={2.15} />
              <strong>Luyện nói</strong>
              <small>Tình huống</small>
            </Link>
            <Link className="home-portal-quick-action" href="/listening" prefetch>
              <AudioLines aria-hidden="true" size={27} strokeWidth={2.05} />
              <strong>Nghe phản xạ</strong>
              <small>3 phút</small>
            </Link>
            <Link className="home-portal-quick-action" href="/hsk/1/hsk1-bai-01-chao-anh/flashcard" prefetch>
              <BrainCircuit aria-hidden="true" size={27} strokeWidth={2.05} />
              <strong>Ôn từ</strong>
              <small>5 từ yếu</small>
            </Link>
          </nav>
        </motion.div>
      </section>
    </main>
  );
}
