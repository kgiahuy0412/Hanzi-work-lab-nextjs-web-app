export type CourseVisual = {
  src: string;
  alt: string;
  position: string;
};

const courseVisuals: Record<string, CourseVisual> = {
  "van-phong-hanh-chinh": {
    src: "/assets/courses/himi-concepts/himi-office-administration.png",
    alt: "Himi sắp xếp lịch làm việc tại bàn hành chính",
    position: "center",
  },
  "nha-may-san-xuat": {
    src: "/assets/courses/himi-concepts/himi-factory-production.png",
    alt: "Himi đội mũ bảo hộ kiểm tra máy móc trong nhà máy",
    position: "center",
  },
  "kho-van-logistics": {
    src: "/assets/courses/himi-concepts/himi-warehouse-logistics.png",
    alt: "Himi quét kiện hàng trên xe đẩy trong kho logistics",
    position: "center",
  },
  "ban-hang-cham-soc-khach-hang": {
    src: "/assets/courses/himi-concepts/himi-sales-customer-care.png",
    alt: "Himi đeo tai nghe và tư vấn bộ mẫu sản phẩm cho khách hàng",
    position: "center",
  },
  "nha-hang-dich-vu": {
    src: "/assets/courses/himi-concepts/himi-restaurant-service.png",
    alt: "Himi phục vụ trà và món hấp trong nhà hàng",
    position: "center",
  },
  "thuong-mai-dien-tu": {
    src: "/assets/courses/himi-concepts/himi-ecommerce-operations.png",
    alt: "Himi vận hành gian hàng trực tuyến và đóng gói đơn hàng",
    position: "center",
  },
  "giao-tiep-cong-so": {
    src: "/assets/courses/himi-concepts/himi-workplace-communication.png",
    alt: "Himi chủ trì cuộc họp và điều phối giao tiếp công sở",
    position: "center",
  },
  "tieng-trung-tan-suat-cao": {
    src: "/assets/courses/himi-concepts/himi-hsk-curriculum-v2.png",
    alt: "Himi học tiếng Trung qua nhiều chủ đề giao tiếp thiết thực",
    position: "center",
  },
};

export function getCourseVisual(slug: string): CourseVisual {
  return courseVisuals[slug] ?? courseVisuals["giao-tiep-cong-so"];
}
