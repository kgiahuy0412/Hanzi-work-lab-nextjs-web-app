import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Bell, BellRing, Check, CheckCheck, CircleAlert, Crown } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  openNotificationAction,
} from "@/app/notifications/actions";
import { LearnerPageHeader } from "@/components/learner-page-header";
import { getCurrentUser } from "@/lib/auth-session";
import { getUnreadNotificationCount, getUserNotifications } from "@/lib/notification-service";

export const metadata: Metadata = { title: "Thông báo" };

const successMessages = {
  read: "Đã đánh dấu thông báo là đã đọc.",
  all_read: "Đã đọc toàn bộ thông báo.",
} as const;

const errorMessages = {
  invalid_input: "Thông báo chưa hợp lệ. Hãy tải lại trang.",
  not_found: "Không tìm thấy thông báo này trong tài khoản của bạn.",
} as const;

function formatCreatedAt(value: Date): string {
  return value.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "vip_request_approved") return <Crown size={20} />;
  if (type === "vip_request_rejected") return <CircleAlert size={20} />;
  return <Bell size={20} />;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: keyof typeof errorMessages;
    success?: keyof typeof successMessages;
  }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) redirect("/login?returnTo=%2Fnotifications");
  const [items, unreadCount] = await Promise.all([
    getUserNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return <main className="notifications-page">
    <div className="section-shell notifications-page-inner">
      <LearnerPageHeader
        aside={<div className="notifications-header-aside"><BellRing size={29} /><strong>{unreadCount}</strong><span>chưa đọc</span></div>}
        description="Theo dõi thay đổi quan trọng của tài khoản, quyền VIP và nhịp học tại một nơi."
        eyebrow="Cập nhật dành cho bạn"
        eyebrowIcon={Bell}
        meta={<><span><BellRing size={16} /><strong>{items.length}</strong> thông báo gần nhất</span><span><CheckCheck size={16} /><strong>{unreadCount}</strong> cần xem</span></>}
        title="Thông báo"
      />

      {params.success && successMessages[params.success] ? <p className="notification-message success" role="status"><Check size={16} />{successMessages[params.success]}</p> : null}
      {params.error && errorMessages[params.error] ? <p className="notification-message error" role="alert"><CircleAlert size={16} />{errorMessages[params.error]}</p> : null}

      <section className="notification-feed" aria-label="Danh sách thông báo">
        <div className="notification-feed-heading">
          <div><span>Hộp thư của bạn</span><h2>Mới nhất</h2></div>
          {unreadCount > 0 ? <form action={markAllNotificationsReadAction}><button type="submit"><CheckCheck size={15} /> Đánh dấu tất cả đã đọc</button></form> : <span className="notification-all-read"><Check size={14} /> Bạn đã xem hết</span>}
        </div>

        {items.length ? <div className="notification-list">{items.map((item) => <article className={`notification-item ${item.readAt ? "is-read" : "is-unread"}`} key={item.id}>
          <span className={`notification-item-icon ${item.type}`}><NotificationIcon type={item.type} /></span>
          <form action={openNotificationAction} className="notification-open-form">
            <input name="notificationId" type="hidden" value={item.id} />
            <button className="notification-open" type="submit">
              <span className="notification-item-title">{item.title}{item.readAt ? null : <i aria-label="Chưa đọc" />}</span>
              <span className="notification-item-message">{item.message}</span>
              <small>{formatCreatedAt(item.createdAt)}</small>
            </button>
          </form>
          <div className="notification-item-actions">
            <form action={openNotificationAction}>
              <input name="notificationId" type="hidden" value={item.id} />
              <button aria-label={`Mở ${item.title}`} title="Mở nội dung" type="submit"><ArrowUpRight size={17} /></button>
            </form>
            {!item.readAt ? <form action={markNotificationReadAction}>
              <input name="notificationId" type="hidden" value={item.id} />
              <button aria-label={`Đánh dấu ${item.title} đã đọc`} title="Đánh dấu đã đọc" type="submit"><Check size={17} /></button>
            </form> : null}
          </div>
        </article>)}</div> : <div className="notification-empty">
          <span><Bell size={24} /></span>
          <h2>Chưa có thông báo nào</h2>
          <p>Khi quyền VIP hoặc tài khoản có thay đổi, cập nhật sẽ xuất hiện tại đây.</p>
          <Link href="/courses">Tiếp tục học <ArrowUpRight size={15} /></Link>
        </div>}
      </section>
    </div>
  </main>;
}
