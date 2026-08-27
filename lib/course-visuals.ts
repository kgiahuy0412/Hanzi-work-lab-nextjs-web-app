export type CourseVisual = {
  src: string;
  alt: string;
  position: string;
};

const courseVisuals: Record<string, CourseVisual> = {
  "van-phong-hanh-chinh": {
    src: "/assets/courses/himi-concepts/himi-office-administration.webp",
    alt: "Himi sắp xếp lịch làm việc tại bàn hành chính",
    position: "center",
  },
  "nha-may-san-xuat": {
    src: "/assets/courses/himi-concepts/himi-factory-production.webp",
    alt: "Himi đội mũ bảo hộ kiểm tra máy móc trong nhà máy",
    position: "center",
  },
  "kho-van-logistics": {
    src: "/assets/courses/himi-concepts/himi-warehouse-logistics.webp",
    alt: "Himi quét kiện hàng trên xe đẩy trong kho logistics",
    position: "center",
  },
  "ban-hang-cham-soc-khach-hang": {
    src: "/assets/courses/himi-concepts/himi-sales-customer-care.webp",
    alt: "Himi đeo tai nghe và tư vấn bộ mẫu sản phẩm cho khách hàng",
    position: "center",
  },
  "nha-hang-dich-vu": {
    src: "/assets/courses/himi-concepts/himi-restaurant-service.webp",
    alt: "Himi phục vụ trà và món hấp trong nhà hàng",
    position: "center",
  },
  "thuong-mai-dien-tu": {
    src: "/assets/courses/himi-concepts/himi-ecommerce-operations.webp",
    alt: "Himi vận hành gian hàng trực tuyến và đóng gói đơn hàng",
    position: "center",
  },
  "giao-tiep-cong-so": {
    src: "/assets/courses/himi-concepts/himi-workplace-communication.webp",
    alt: "Himi chủ trì cuộc họp và điều phối giao tiếp công sở",
    position: "center",
  },
};

export function getCourseVisual(slug: string): CourseVisual {
  return courseVisuals[slug] ?? courseVisuals["giao-tiep-cong-so"];
}
