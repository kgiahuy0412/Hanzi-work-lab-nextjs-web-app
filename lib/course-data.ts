import type { Course } from "./content-types.ts";
import { factoryCourseStats } from "./factory-course-seed.ts";
import { logisticsCourseStats } from "./logistics-course-seed.ts";
import { officeCourseStats } from "./office-course-seed.ts";
import { salesCourseStats } from "./sales-course-seed.ts";

export type { Course } from "./content-types.ts";

export const courses: Course[] = [
  { slug: "van-phong-hanh-chinh", category: "Văn phòng", title: "Văn phòng & hành chính", chineseTitle: "办公室与行政", hanzi: "办", description: "Giao việc, họp, báo cáo tiến độ và xử lý các công việc hành chính thường ngày.", lessons: officeCourseStats.lessons, minutes: officeCourseStats.minutes, freeLessons: officeCourseStats.freeLessons, level: "Cơ bản", color: "#dcebe2", ink: "#176b5b", availability: "available" },
  { slug: "nha-may-san-xuat", category: "Nhà máy", title: "Nhà máy & sản xuất", chineseTitle: "工厂与生产", hanzi: "产", description: "An toàn đầu ca, vận hành, sản lượng, chất lượng, bàn giao và xử lý bất thường tại xưởng.", lessons: factoryCourseStats.lessons, minutes: factoryCourseStats.minutes, freeLessons: factoryCourseStats.freeLessons, level: "Cơ bản", color: "#e8e2d5", ink: "#685a3e", availability: "available" },
  { slug: "kho-van-logistics", category: "Logistics", title: "Kho vận & logistics", chineseTitle: "仓储与物流", hanzi: "仓", description: "Nhập kho, tồn kho, soạn xuất, giao nhận và xử lý chênh lệch trong chuỗi vận hành kho.", lessons: logisticsCourseStats.lessons, minutes: logisticsCourseStats.minutes, freeLessons: logisticsCourseStats.freeLessons, level: "Cơ bản", color: "#dae8ed", ink: "#356675", availability: "available" },
  { slug: "ban-hang-cham-soc-khach-hang", category: "Kinh doanh", title: "Bán hàng & chăm sóc khách", chineseTitle: "销售与客户服务", hanzi: "客", description: "Tư vấn nhu cầu, báo giá, chốt đơn, theo dõi giao hàng và xử lý phản hồi sau bán.", lessons: salesCourseStats.lessons, minutes: salesCourseStats.minutes, freeLessons: salesCourseStats.freeLessons, level: "Cơ bản", color: "#f0dfd9", ink: "#8b554c", availability: "available" },
  { slug: "nha-hang-dich-vu", category: "Dịch vụ", title: "Nhà hàng & dịch vụ", chineseTitle: "餐饮与服务", hanzi: "餐", description: "Đón khách, gọi món, xử lý yêu cầu và các tình huống phục vụ phổ biến.", lessons: 0, minutes: 0, freeLessons: 0, level: "Kế hoạch", color: "#f2e7cb", ink: "#826124", availability: "coming_soon" },
  { slug: "thuong-mai-dien-tu", category: "Kinh doanh", title: "Thương mại điện tử", chineseTitle: "电子商务", hanzi: "商", description: "Sản phẩm, gian hàng, vận hành đơn và trao đổi với nhà cung cấp Trung Quốc.", lessons: 0, minutes: 0, freeLessons: 0, level: "Kế hoạch", color: "#e3dfef", ink: "#63558c", availability: "coming_soon" },
  { slug: "giao-tiep-cong-so", category: "Nền tảng", title: "Giao tiếp công sở cốt lõi", chineseTitle: "职场基础沟通", hanzi: "职", description: "Các mẫu câu nền tảng có thể áp dụng chéo cho hầu hết môi trường làm việc.", lessons: 0, minutes: 0, freeLessons: 0, level: "Kế hoạch", color: "#dce9dc", ink: "#3f7044", availability: "coming_soon" },
];

export function getCourse(slug: string) { return courses.find((course) => course.slug === slug); }
