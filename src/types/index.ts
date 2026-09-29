export type UserRole = 'ADMIN' | 'RECEPTION' | 'RESTAURANT' | 'SUPERVISOR';

export interface Hotel {
  id: string;
  name: string;
  restaurant_name: string;
  logo_url?: string;
  timezone: string; // 'Asia/Jakarta'
  breakfast_start: string; // '06:00'
  breakfast_end: string; // '10:00'
  allow_checkout_day: boolean;
  allow_partial_redemption: boolean;
  enforce_breakfast_time: boolean;
  allow_manual_search: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  hotel_id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Guest {
  id: string;
  hotel_id: string;
  room_number: string;
  guest_name: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  pax: number;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'CANCELLED';
  external_guest_id?: string;
  external_reservation_id?: string;
  source_system?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCodeData {
  id: string;
  hotel_id: string;
  guest_id: string;
  token: string; // e.g. BF26-8F72K91X
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  created_by?: string;
  created_at: string;
  revoked_at?: string | null;
  revoked_by?: string | null;
}

export interface BreakfastEntitlement {
  id: string;
  hotel_id: string;
  guest_id: string;
  qr_code_id: string;
  breakfast_date: string; // YYYY-MM-DD
  pax_entitlement: number;
  created_at: string;
}

export interface BreakfastUsage {
  id: string;
  hotel_id: string;
  guest_id: string;
  qr_code_id: string;
  breakfast_date: string; // YYYY-MM-DD
  pax: number;
  used_at: string; // ISO timestamp
  used_time_str: string; // HH:mm WIB
  used_by?: string;
  scanner_device_id?: string;
  redemption_method: 'QR_SCAN' | 'MANUAL';
  status: 'USED' | 'VOIDED';
  created_at: string;
}

export interface AuditLog {
  id: string;
  hotel_id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DashboardStats {
  expectedGuests: number;
  expectedPax: number;
  servedGuests: number;
  servedPax: number;
  remainingGuests: number;
  remainingPax: number;
  recentScans: Array<{
    id: string;
    time: string;
    room_number: string;
    guest_name: string;
    pax: number;
    status: 'USED' | 'VOIDED';
    redemption_method: 'QR_SCAN' | 'MANUAL';
  }>;
}

export type QRVerificationStatus = 
  | 'VALID'
  | 'INVALID_QR'
  | 'ALREADY_USED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'BREAKFAST_NOT_OPEN'
  | 'BREAKFAST_CLOSED';

export interface QRVerificationResult {
  status: QRVerificationStatus;
  message?: string;
  guest?: {
    id: string;
    room_number: string;
    guest_name: string;
    pax: number;
    check_in: string;
    check_out: string;
  };
  qr_code?: QRCodeData;
  breakfast_date?: string;
  used_at_str?: string;
  time_info?: {
    current_time: string;
    breakfast_start: string;
    breakfast_end: string;
  };
}
