import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy, hh:mm a");
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${num}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "success",
    CLOSED: "secondary",
    PENDING: "warning",
    COMPLETED: "success",
    OVERDUE: "destructive",
    IN_PROGRESS: "info",
    PAID: "success",
    PARTIAL: "warning",
    CONVICTED: "destructive",
    ACQUITTED: "success",
    NEW: "info",
    CONVERTED: "success",
    LOST: "destructive",
    CONFIRMED: "success",
    CANCELLED: "destructive",
    SCHEDULED: "info",
    ADJOURNED: "warning",
    GRANTED: "success",
    REJECTED: "destructive",
    APPROVED: "success",
  };
  return map[status] ?? "secondary";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateDaysDiff(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const PRACTICE_AREAS = [
  "Criminal Law",
  "Civil Law",
  "Family & Matrimonial Law",
  "Property Disputes",
  "Cheque Bounce / NI Act",
  "Bail & Anticipatory Bail",
  "Corporate & Commercial Disputes",
  "Consumer Cases",
  "Labour & Employment",
  "Banking & Financial Disputes",
  "Cyber Crime",
  "Constitutional Matters",
  "High Court Matters",
  "Supreme Court Matters",
  "District Court Matters",
];

export const COURT_LIST = [
  "Supreme Court of India",
  "High Court",
  "District Court",
  "Sessions Court",
  "Chief Judicial Magistrate Court",
  "Judicial Magistrate Court",
  "Family Court",
  "Consumer Court",
  "Labour Court",
  "Debt Recovery Tribunal",
  "National Company Law Tribunal",
  "Income Tax Appellate Tribunal",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
];
