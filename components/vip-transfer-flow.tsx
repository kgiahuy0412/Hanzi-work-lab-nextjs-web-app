"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Landmark,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  ScanLine,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

type PaymentStatus = "expired" | "failed" | "manual_review" | "paid" | "pending" | "refunded";

type SepayPaymentOrder = {
  id: string;
  planId: string;
  planName: string;
  amountVnd: number;
  referenceCode: string;
  status: PaymentStatus;
  qrImageUrl: string;
  bankAccount: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  paidAt: string | null;
  expiresAt: string;
};

type VipTransferFlowProps = {
  buttonText: string;
  durationLabel: string;
  featured: boolean;
  isPendingPlan: boolean;
  planCode: string;
  planId: string;
  planName: string;
  priceLabel: string;
};

const paymentErrorMessages: Record<string, string> = {
  invalid_input: "Gói VIP chưa hợp lệ. Hãy tải lại trang và thử lại.",
  payment_configuration_invalid: "Kênh thanh toán đang được cấu hình. Vui lòng quay lại sau.",
  vip_plan_inactive: "Gói này vừa ngừng nhận thanh toán.",
  vip_request_ineligible: "Tài khoản hiện chưa đủ điều kiện mua VIP.",
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export function VipTransferFlow({
  buttonText,
  durationLabel,
  featured,
  isPendingPlan,
  planCode,
  planId,
  planName,
  priceLabel,
}: VipTransferFlowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<SepayPaymentOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const pollingOrderId = order?.status === "pending" ? order.id : null;

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/sepay/orders", {
        body: JSON.stringify({ planId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = await response.json() as { error?: string; order?: SepayPaymentOrder };
      if (!response.ok || !body.order) {
        throw new Error(paymentErrorMessages[body.error ?? ""] ?? "Không thể tạo mã thanh toán. Vui lòng thử lại.");
      }
      setOrder(body.order);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tạo mã thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const openTransfer = () => {
    setOpen(true);
    if (!order || order.status === "expired" || order.status === "failed") void createOrder();
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !pollingOrderId) return;
    let cancelled = false;
    let timeoutId: number | undefined;
    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/sepay/orders/${pollingOrderId}`, { cache: "no-store" });
        const body = await response.json() as { order?: SepayPaymentOrder };
        if (cancelled) return;
        if (!response.ok || !body.order) {
          if (response.status === 401) setError("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để xem trạng thái thanh toán.");
          else timeoutId = window.setTimeout(poll, 4_000);
          return;
        }
        setOrder(body.order);
        if (body.order.status === "paid") {
          router.refresh();
          return;
        }
        if (body.order.status === "pending") timeoutId = window.setTimeout(poll, 2_500);
      } catch {
        if (!cancelled) timeoutId = window.setTimeout(poll, 4_000);
      }
    };
    timeoutId = window.setTimeout(poll, 1_500);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [open, pollingOrderId, router]);

  const closeTransfer = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const restartPayment = () => {
    setOrder(null);
    void createOrder();
  };

  return <>
    <div className="vip-plan-request-form">
      <button
        className={`button button-full ${featured ? "button-light" : "button-primary"}`}
        disabled={isPendingPlan}
        onClick={openTransfer}
        ref={triggerRef}
        type="button"
      >
        <Send aria-hidden="true" size={15} />{buttonText}
      </button>
    </div>

    {open ? createPortal(<div className="vip-dialog-backdrop" onMouseDown={(event) => {
      if (event.currentTarget === event.target) closeTransfer();
    }}>
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="vip-transfer-dialog"
        role="dialog"
      >
        <button aria-label="Đóng thanh toán" autoFocus className="vip-dialog-close" onClick={closeTransfer} type="button"><X size={18} /></button>

        {order?.status === "paid" ? <div className="vip-transfer-success">
          <span className="vip-success-icon"><CheckCircle2 aria-hidden="true" size={31} /></span>
          <span className="vip-success-eyebrow">SePay đã xác nhận</span>
          <h2 id={titleId}>Thanh toán thành công</h2>
          <p id={descriptionId}>Gói {order.planName} đã được kích hoạt tự động trên tài khoản này. Bạn có thể bắt đầu học ngay.</p>
          <div className="vip-success-status is-paid"><CheckCircle2 aria-hidden="true" size={17} /><span>Trạng thái giao dịch</span><strong>Đã thanh toán</strong></div>
          <button className="button button-primary button-full" onClick={closeTransfer} type="button">Bắt đầu học VIP</button>
        </div> : <>
          <header className="vip-dialog-heading">
            <span className="vip-dialog-icon"><Landmark aria-hidden="true" size={22} /></span>
            <div>
              <span>Thanh toán tự động qua SePay</span>
              <h2 id={titleId}>Quét QR chuyển khoản</h2>
              <p id={descriptionId}>SePay sẽ tự động đối soát và kích hoạt VIP khi ngân hàng báo giao dịch thành công.</p>
            </div>
          </header>

          <div className="vip-transfer-summary">
            <div><span>Gói đã chọn</span><strong>{order?.planName ?? planName}</strong><small>{durationLabel}</small></div>
            <div><span>Số tiền cần chuyển</span><strong>{order ? formatPrice(order.amountVnd) : priceLabel}</strong><small>Thanh toán một lần</small></div>
          </div>

          {loading ? <div className="vip-payment-loading" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="is-spinning" size={28} />
            <strong>Đang tạo mã thanh toán…</strong>
            <span>Hệ thống đang giữ đúng gói và số tiền cho bạn.</span>
          </div> : error ? <div className="vip-payment-problem" role="alert">
            <AlertCircle aria-hidden="true" size={22} />
            <div><strong>Chưa thể mở thanh toán</strong><p>{error}</p></div>
            <button className="button button-secondary" onClick={() => void createOrder()} type="button"><RefreshCw size={15} />Thử lại</button>
          </div> : order?.status === "manual_review" ? <div className="vip-payment-problem" role="status">
            <ShieldCheck aria-hidden="true" size={22} />
            <div><strong>Giao dịch đang được đối soát</strong><p>SePay đã ghi nhận giao dịch nhưng số tiền hoặc thời gian chưa khớp đơn. Hãy giữ lại biên lai; quản trị viên sẽ kiểm tra.</p></div>
          </div> : order?.status === "expired" ? <div className="vip-payment-problem" role="status">
            <Clock3 aria-hidden="true" size={22} />
            <div><strong>Mã thanh toán đã hết hạn</strong><p>Tạo mã mới trước khi chuyển khoản để hệ thống đối soát chính xác.</p></div>
            <button className="button button-secondary" onClick={restartPayment} type="button"><RefreshCw size={15} />Tạo mã mới</button>
          </div> : order?.status === "failed" || order?.status === "refunded" ? <div className="vip-payment-problem" role="status">
            <AlertCircle aria-hidden="true" size={22} />
            <div><strong>{order.status === "refunded" ? "Giao dịch đã hoàn tiền" : "Thanh toán chưa hoàn tất"}</strong><p>Vui lòng kiểm tra thông báo tài khoản hoặc liên hệ quản trị viên nếu bạn đã chuyển khoản.</p></div>
            {order.status === "failed" ? <button className="button button-secondary" onClick={restartPayment} type="button"><RefreshCw size={15} />Tạo mã mới</button> : null}
          </div> : order ? <>
            <div className="vip-payment-qr-layout">
              <div className="vip-payment-qr">
                <Image
                  alt={`Mã QR thanh toán ${order.planName} qua ${order.bankAccount.bankCode}`}
                  height={320}
                  priority
                  src={order.qrImageUrl}
                  unoptimized
                  width={320}
                />
                <span><ScanLine aria-hidden="true" size={15} />Quét bằng ứng dụng ngân hàng</span>
              </div>
              <div className="vip-transfer-account">
                <div><span>Ngân hàng</span><strong>{order.bankAccount.bankCode}</strong></div>
                <div><span>Số tài khoản</span><strong>{order.bankAccount.accountNumber}</strong></div>
                <div><span>Chủ tài khoản</span><strong>{order.bankAccount.accountName}</strong></div>
              </div>
            </div>

            <div className="vip-transfer-reference">
              <ReceiptText aria-hidden="true" size={18} />
              <div><span>Nội dung chuyển khoản bắt buộc</span><strong>{order.referenceCode}</strong></div>
            </div>

            <ol className="vip-transfer-steps">
              <li><span>1</span><div>Quét QR hoặc chuyển đúng tài khoản, số tiền hiển thị.</div></li>
              <li><span>2</span><div>Giữ nguyên nội dung <strong>{order.referenceCode}</strong> để SePay nhận đúng đơn.</div></li>
              <li><span>3</span><div>Giữ cửa sổ này mở; trạng thái sẽ tự cập nhật sau khi ngân hàng phản hồi.</div></li>
            </ol>

            <div className="vip-transfer-actions">
              <button className="button button-secondary" onClick={closeTransfer} type="button">Thanh toán sau</button>
              <div className="vip-payment-waiting" aria-live="polite"><LoaderCircle aria-hidden="true" className="is-spinning" size={16} /><span>Đang chờ SePay xác nhận</span></div>
            </div>
          </> : null}

          <span className="vip-payment-plan-code">Mã gói: {planCode.toUpperCase()}</span>
        </>}
      </section>
    </div>, document.body) : null}
  </>;
}
