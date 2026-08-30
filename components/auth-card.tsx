"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Link from "next/link";
import Image from "next/image";
import { type FocusEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Home, KeyRound, LockKeyhole, Mail, RotateCcw, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/brand-logo";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";

gsap.registerPlugin(useGSAP);

type AuthMode = "login" | "register" | "forgot-password" | "admin";

const errorMessages: Record<string, string> = {
  duplicate: "Email này đã được sử dụng.",
  email_in_use: "Email này đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.",
  invalid_credentials: "Email hoặc mật khẩu không đúng. Với Console, tài khoản cũng phải có quyền editor, reviewer hoặc admin.",
  invalid_email: "Địa chỉ email chưa đúng định dạng.",
  invalid_name: "Tên hiển thị cần từ 2 đến 120 ký tự.",
  invalid_password: `Mật khẩu cần từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự.`,
  password_mismatch: "Hai mật khẩu chưa trùng nhau.",
  password_changed: "Mật khẩu đã được đổi. Hãy đăng nhập lại bằng mật khẩu mới.",
  password_reset: "Mật khẩu đã được đặt lại và các phiên cũ đã bị thu hồi. Hãy đăng nhập lại.",
  rate_limited: "Có quá nhiều yêu cầu trong thời gian ngắn. Hãy đợi một lúc rồi thử lại.",
  required: "Hãy đăng nhập để tiếp tục.",
  forbidden: "Tài khoản hiện tại không có quyền truy cập khu vực quản trị.",
  register_failed: "Chưa thể tạo tài khoản lúc này. Hãy thử lại sau ít phút.",
};

type RegisterState = "idle" | "submitting" | "success";

export function AuthCard({ mode, error, initialRegisterSuccess = false, returnTo, sent = false }: { mode: AuthMode; error?: string; initialRegisterSuccess?: boolean; returnTo: string; sent?: boolean }) {
  const [motionRun, setMotionRun] = useState(0);
  const [passwordActive, setPasswordActive] = useState(false);
  const [registerState, setRegisterState] = useState<RegisterState>(initialRegisterSuccess ? "success" : "idle");
  const [registerError, setRegisterError] = useState<string>();
  const authRootRef = useRef<HTMLElement>(null);
  const redirectTimer = useRef<number | null>(null);
  const registering = mode === "register";
  const admin = mode === "admin";
  const learnerLogin = mode === "login";
  const forgotPassword = mode === "forgot-password";
  const learnerAuth = learnerLogin || registering || forgotPassword;
  const title = registering
    ? "Tạo tài khoản học"
    : forgotPassword
      ? "Đặt lại mật khẩu"
      : admin
        ? "Đăng nhập quản trị"
        : "Sẵn sàng cho ca học hôm nay?";
  const description = registering
    ? "Tạo tài khoản để đồng bộ bài học, Luyện ca, trò chơi và lịch ôn trên các thiết bị của bạn."
    : forgotPassword
      ? "Nhập email đã đăng ký. Nếu tài khoản tồn tại, Himi Chinese sẽ gửi một liên kết dùng một lần."
    : admin
      ? "Console dành cho biên tập viên, kiểm duyệt viên và quản trị viên đã được phân quyền."
      : "Đăng nhập để tiếp tục đúng bài đang học.";
  const Icon = registering ? UserPlus : admin ? ShieldCheck : KeyRound;
  const action = registering ? "/api/auth/register" : forgotPassword ? "/api/auth/forgot-password" : "/api/auth/login";
  const notice = error === "password_changed" || error === "password_reset";
  const visibleError = registerError ?? error;

  const handlePasswordBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextField = event.relatedTarget;
    if (nextField instanceof HTMLInputElement && nextField.type === "password") return;
    setPasswordActive(false);
  };

  useGSAP(() => {
    const root = authRootRef.current;
    if (!learnerAuth || !root) return;

    const sceneArt = root.querySelector<HTMLElement>(".auth-login-scene-art");
    const foreground = root.querySelector<HTMLElement>(".auth-login-scene-foreground");
    const walker = root.querySelector<HTMLElement>(".auth-motion-walker");
    const sprite = root.querySelector<HTMLElement>(".auth-motion-walker-sprite");
    const shadow = root.querySelector<HTMLElement>(".auth-motion-walker-shadow");
    const card = root.querySelector<HTMLElement>(".auth-card-login-scene");
    const brand = root.querySelector<HTMLElement>(".auth-scene-brand");
    const home = root.querySelector<HTMLElement>(".auth-scene-home");
    const replay = root.querySelector<HTMLElement>(".auth-scene-replay");
    if (!sceneArt || !foreground || !walker || !sprite || !shadow || !card || !brand || !home || !replay) return;

    const interfaceElements = [brand, home, replay];
    const media = gsap.matchMedia();

    const buildEntrance = (mobile: boolean) => {
      const cardXPercent = mobile ? 0 : -50;
      const pocketY = mobile ? 160 : registering ? 62 : 108;
      const walkerMidX = mobile ? "61vw" : "55vw";
      const walkerPointX = mobile ? "76vw" : "68vw";
      const walkerExitX = mobile ? "80vw" : "72vw";

      gsap.set(sceneArt, { autoAlpha: 0, scale: 1.012, y: 14 });
      gsap.set(foreground, { autoAlpha: 0, scale: 1, y: 8 });
      gsap.set(interfaceElements, { autoAlpha: 0, y: -7 });
      gsap.set(walker, { autoAlpha: 0, scale: .92, xPercent: -130, y: 0 });
      gsap.set(sprite, { backgroundPosition: "0% 0%", rotation: -.65, y: 0 });
      gsap.set(shadow, { autoAlpha: .42, scaleX: 1 });
      gsap.set(card, {
        autoAlpha: 0,
        clipPath: "inset(42% 36% 42% 36% round 24px)",
        rotation: -1.2,
        scaleX: .2,
        scaleY: .12,
        xPercent: cardXPercent,
        y: pocketY,
      });

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(walker, { autoAlpha: 1, duration: .2, scale: .95, xPercent: mobile ? -70 : -82 }, 0)
        .to(walker, { duration: 1.45, ease: "none", scale: 1.18, x: walkerMidX, xPercent: 0 }, .12)
        .to(walker, { duration: .42, ease: "power2.in", rotation: -5, scale: 1.72, x: walkerPointX, y: -2 }, 1.57)
        .to(walker, { autoAlpha: 0, duration: .28, ease: "power2.in", scale: 2.16, x: walkerExitX, y: 0 }, 1.99)
        .to(sprite, { backgroundPosition: "100% 0%", duration: .77, ease: "steps(7)", repeat: 2 }, 0)
        .to(sprite, { duration: .1925, ease: "sine.inOut", repeat: 11, rotation: .65, y: -3, yoyo: true }, 0)
        .to(shadow, { autoAlpha: .27, duration: .1925, ease: "sine.inOut", repeat: 11, scaleX: .84, yoyo: true }, 0)
        .to(sceneArt, { autoAlpha: 1, duration: .42, scale: 1, y: 0 }, 1.82)
        .to(foreground, { autoAlpha: 1, duration: .16, y: 0 }, 2.08)
        .to(card, {
          autoAlpha: 1,
          clipPath: "inset(31% 27% 31% 27% round 24px)",
          duration: .2,
          ease: "power2.out",
          rotation: -.7,
          scaleX: .36,
          scaleY: .27,
          xPercent: cardXPercent,
          y: pocketY - 8,
        }, 2.18)
        .to(card, {
          clipPath: "inset(2% round 27px)",
          duration: .5,
          ease: "power4.out",
          rotation: .24,
          scaleX: .96,
          scaleY: .985,
          xPercent: cardXPercent,
          y: -16,
        }, 2.38)
        .to(card, {
          clipPath: "inset(0 round 27px)",
          duration: .4,
          ease: "power3.out",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          xPercent: cardXPercent,
          y: 0,
        }, 2.82)
        .to(foreground, { autoAlpha: 0, duration: .42, ease: "power2.out", scale: 1.004, y: -4 }, 3.02)
        .to(interfaceElements, { autoAlpha: 1, duration: .46, stagger: .05, y: 0 }, 3.08);

      return () => timeline.kill();
    };

    media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => buildEntrance(false));
    media.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", () => buildEntrance(true));
    media.add("(prefers-reduced-motion: reduce)", () => {
      const mobile = window.matchMedia("(max-width: 900px)").matches;
      gsap.set([walker, foreground], { display: "none" });
      gsap.set(sceneArt, { autoAlpha: 1, scale: 1, y: 0 });
      gsap.set(interfaceElements, { autoAlpha: 1, y: 0 });
      gsap.set(card, { autoAlpha: 1, clipPath: "inset(0 round 27px)", rotation: 0, scale: 1, xPercent: mobile ? 0 : -50, y: 0 });
    });

    return () => media.revert();
  }, { dependencies: [learnerAuth, motionRun, registering], scope: authRootRef });

  useGSAP(() => {
    const root = authRootRef.current;
    if (registerState !== "success" || !root) return;
    const overlay = root.querySelector<HTMLElement>(".auth-registration-success");
    const penguin = root.querySelector<HTMLElement>(".auth-registration-success img");
    const copy = root.querySelector<HTMLElement>(".auth-registration-success-copy");
    if (!overlay || !penguin || !copy) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(overlay, { autoAlpha: reducedMotion ? 1 : 0 });
    gsap.set(penguin, { autoAlpha: reducedMotion ? 1 : 0, rotation: reducedMotion ? 0 : -7, scale: reducedMotion ? 1 : .7, y: reducedMotion ? 0 : 96 });
    gsap.set(copy, { autoAlpha: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 });
    if (reducedMotion) return;

    const timeline = gsap.timeline();
    timeline
      .to(overlay, { autoAlpha: 1, duration: .28, ease: "power2.out" })
      .to(penguin, { autoAlpha: 1, duration: .62, ease: "power4.out", rotation: 3.5, scale: 1.045, y: -18 }, .05)
      .to(penguin, { duration: .26, ease: "power2.out", rotation: 0, scale: 1, y: 0 }, .67)
      .to(copy, { autoAlpha: 1, duration: .38, ease: "power3.out", y: 0 }, .54);
    return () => timeline.kill();
  }, { dependencies: [registerState], scope: authRootRef });

  useEffect(() => {
    if (!registering) return;
    const successImage = new window.Image();
    successImage.src = "/assets/auth/penguin-register-success.png";
  }, [registering]);

  useEffect(() => () => {
    if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
  }, []);

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!registering) return;
    event.preventDefault();
    if (registerState !== "idle") return;

    setRegisterError(undefined);
    setRegisterState("submitting");

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("responseMode", "json");
      const response = await fetch(action, { body: formData, method: "POST" });
      const result = await response.json() as { error?: string; ok?: boolean; redirectTo?: string };

      if (!response.ok || !result.ok || !result.redirectTo) {
        setRegisterError(result.error && errorMessages[result.error] ? result.error : "register_failed");
        setRegisterState("idle");
        return;
      }

      setPasswordActive(false);
      setRegisterState("success");
      redirectTimer.current = window.setTimeout(() => window.location.assign(result.redirectTo!), 1900);
    } catch {
      setRegisterError("register_failed");
      setRegisterState("idle");
    }
  };

  return <main className={`auth-page auth-gsap-motion ${learnerAuth ? "auth-page-login-scene" : ""} ${forgotPassword ? "auth-page-forgot-scene" : ""} ${passwordActive ? "auth-password-is-active" : ""} ${registerState === "success" ? "auth-register-is-success" : ""}`.trim()} ref={authRootRef}>
    {learnerAuth ? <>
      <div aria-hidden="true" className="auth-login-scene-art" />
      <div aria-hidden="true" className="auth-login-scene-foreground" />
      <span aria-hidden="true" className="auth-password-mascot"><Image alt="" height={961} src="/assets/auth/penguin-cover-eyes.png" unoptimized width={566} /></span>
      <Link aria-label="Himi Chinese - Về trang chủ" className="auth-scene-brand" href="/"><BrandMark priority /><BrandWordmark /></Link>
      <Link className="auth-scene-home" href="/"><Home aria-hidden="true" size={17} />Về trang chủ</Link>
      <button aria-label="Phát lại chuyển động" className="auth-scene-replay" onClick={() => setMotionRun((run) => run + 1)} title="Xem lại chuyển động" type="button"><RotateCcw aria-hidden="true" size={17} /></button>
      <span aria-hidden="true" className="auth-motion-walker"><span className="auth-motion-walker-shadow" /><span className="auth-motion-walker-sprite" /></span>
    </> : null}
    {registerState === "success" ? <section aria-live="polite" className="auth-registration-success" role="status">
      <div className="auth-registration-success-inner">
        <Image alt="Cánh Cụt Himi vui vẻ bật nhảy giữa những mảnh giấy chúc mừng" height={1254} src="/assets/auth/penguin-register-success.png" unoptimized width={1254} />
        <div className="auth-registration-success-copy">
          <span>Tài khoản đã sẵn sàng</span>
          <h1>Đăng ký thành công!</h1>
          <p>Đang đưa bạn tới bước xác minh email...</p>
        </div>
      </div>
    </section> : null}
    <section className={`auth-card ${admin ? "auth-card-admin" : ""} ${learnerAuth ? "auth-card-login-scene" : ""} ${registering ? "auth-card-register-scene" : ""} ${forgotPassword ? "auth-card-forgot-scene" : ""}`.trim()}>
    {!learnerAuth ? <div className="auth-brand"><BrandMark priority /><BrandWordmark /></div> : null}
    {!learnerAuth ? <div className="auth-icon"><Icon size={24} /></div> : null}
    <div className="auth-heading"><span>{admin ? "Himi Chinese Console" : "Tài khoản Himi Chinese"}</span><h1>{title}</h1><p>{description}</p></div>
    {visibleError && errorMessages[visibleError] ? <p className={notice ? "auth-notice" : "auth-error"} role="status">{errorMessages[visibleError]}</p> : null}
    {sent ? <p className="auth-notice" role="status">Nếu email khớp với một tài khoản, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra cả thư rác.</p> : null}
    <form action={action} className="auth-form" method="post" onSubmit={handleRegisterSubmit}>
      {!forgotPassword ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      {admin ? <input name="mode" type="hidden" value="admin" /> : null}
      {registering ? <label><span>Họ và tên</span><span className="auth-input-shell"><UserRound aria-hidden="true" size={18} /><input autoComplete="name" maxLength={120} minLength={2} name="displayName" placeholder="Nhập họ và tên của bạn" required type="text" /></span></label> : null}
      <label><span>Email</span><span className="auth-input-shell"><Mail aria-hidden="true" size={18} /><input autoCapitalize="none" autoComplete="email" inputMode="email" maxLength={255} name="email" placeholder={learnerAuth ? "Nhập email của bạn" : undefined} required type="email" /></span></label>
      {!forgotPassword ? <label><span>Mật khẩu</span><span className="auth-input-shell"><LockKeyhole aria-hidden="true" size={18} /><input autoComplete={registering ? "new-password" : "current-password"} maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="password" onBlur={handlePasswordBlur} onFocus={() => setPasswordActive(true)} placeholder={learnerAuth ? "Nhập mật khẩu của bạn" : undefined} required type="password" /></span></label> : null}
      {registering ? <label><span>Nhập lại mật khẩu</span><span className="auth-input-shell"><LockKeyhole aria-hidden="true" size={18} /><input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" onBlur={handlePasswordBlur} onFocus={() => setPasswordActive(true)} placeholder="Nhập lại mật khẩu" required type="password" /></span></label> : null}
      <button className="button button-primary button-full" disabled={registerState === "submitting"} type="submit"><span>{registerState === "submitting" ? "Đang tạo tài khoản..." : registering ? "Tạo tài khoản" : forgotPassword ? "Gửi liên kết đặt lại" : "Đăng nhập"}</span>{learnerAuth ? <ArrowRight aria-hidden="true" size={18} /> : null}</button>
    </form>
    <div className="auth-switch">
      {admin
        ? <><Link href="/login">Đăng nhập người học</Link><span>·</span><Link href="/">Về trang chủ</Link></>
        : registering
          ? <p>Đã có tài khoản? <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Đăng nhập</Link></p>
          : forgotPassword
            ? <p><Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Quay lại đăng nhập</Link></p>
          : <div><p><Link href="/forgot-password">Quên mật khẩu?</Link></p><p>Chưa có tài khoản? <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`}>Đăng ký ngay</Link></p></div>}
    </div>
  </section></main>;
}
