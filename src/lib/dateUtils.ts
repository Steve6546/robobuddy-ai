/**
 * @fileoverview أدوات التاريخ المشتركة - Shared Date Utilities
 * 
 * @description
 * يحتوي على دوال تنسيق التاريخ المستخدمة في المشروع.
 * تم نقلها هنا لتجنب تكرار المنطق (DRY Principle).
 * 
 * @usage
 * ```tsx
 * import { formatRelativeDate } from '@/lib/dateUtils';
 * <span>{formatRelativeDate(conversation.updatedAt)}</span>
 * ```
 * 
 * @future
 * - إضافة دعم للغات متعددة (i18n)
 * - إضافة formatTime للتوقيت الدقيق
 */

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * تنسيق التاريخ بشكل نسبي (منذ X أيام)
 * 
 * @param date - التاريخ للتنسيق
 * @returns نص عربي نسبي (اليوم، أمس، منذ X أيام، أو التاريخ الكامل)
 * 
 * @example
 * ```ts
 * formatRelativeDate(new Date()) // "اليوم"
 * formatRelativeDate(yesterday) // "أمس"
 * formatRelativeDate(lastWeek) // "منذ 5 أيام"
 * formatRelativeDate(oldDate) // "١٤٤٦/٣/١٥"
 * ```
 */
export const formatRelativeDate = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  
  // حساب الفرق بالأيام
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // تنسيق نسبي
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  
  // تاريخ كامل للتواريخ القديمة
  return d.toLocaleDateString('ar-SA');
};

/**
 * تنسيق الوقت
 * 
 * @param date - التاريخ للتنسيق
 * @returns الوقت بتنسيق 12 ساعة
 * 
 * @example
 * ```ts
 * formatTime(new Date()) // "٢:٣٠ م"
 * ```
 */
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('ar-SA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * تنسيق التاريخ والوقت معاً
 * 
 * @param date - التاريخ للتنسيق
 * @returns التاريخ والوقت معاً
 * 
 * @example
 * ```ts
 * formatDateTime(new Date()) // "اليوم ٢:٣٠ م"
 * ```
 */
export const formatDateTime = (date: Date | string): string => {
  return `${formatRelativeDate(date)} ${formatTime(date)}`;
};
