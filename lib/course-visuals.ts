export type CourseVisual = {
  src: string;
  alt: string;
  position: string;
};

const courseVisuals: Record<string, CourseVisual> = {
  "van-phong-hanh-chinh": {
    src: "/assets/courses/office-administration.webp",
    alt: "Bàn làm việc hành chính với lịch và hồ sơ được sắp xếp gọn gàng",
    position: "center",
  },
  "nha-may-san-xuat": {
    src: "/assets/courses/factory-production.webp",
    alt: "Nhân sự nhà máy kiểm tra máy móc trong ca sản xuất",
    position: "center",
  },
  "kho-van-logistics": {
    src: "/assets/courses/warehouse-logistics.webp",
    alt: "Nhân sự kho quét kiện hàng trong khu vực logistics",
    position: "center",
  },
  "ban-hang-cham-soc-khach-hang": {
    src: "/assets/courses/sales-customer-care.webp",
    alt: "Hai chuyên viên cùng trao đổi mẫu sản phẩm với khách hàng",
    position: "center",
  },
  "nha-hang-dich-vu": {
    src: "/assets/courses/restaurant-service.webp",
    alt: "Nhân viên nhà hàng chuẩn bị bàn trước giờ phục vụ",
    position: "center",
  },
  "thuong-mai-dien-tu": {
    src: "/assets/courses/ecommerce-operations.webp",
    alt: "Bàn vận hành thương mại điện tử với kiện hàng và máy in nhãn",
    position: "center",
  },
  "giao-tiep-cong-so": {
    src: "/assets/courses/workplace-communication.webp",
    alt: "Nhóm đồng nghiệp trao đổi nhanh trong một buổi họp công việc",
    position: "center",
  },
};

export function getCourseVisual(slug: string): CourseVisual {
  return courseVisuals[slug] ?? courseVisuals["giao-tiep-cong-so"];
}
