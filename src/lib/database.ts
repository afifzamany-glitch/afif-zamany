import { 
  Hotel, 
  UserProfile, 
  Guest, 
  QRCodeData, 
  BreakfastEntitlement, 
  BreakfastUsage, 
  AuditLog, 
  DashboardStats,
  QRVerificationResult
} from '../types';
import { 
  getJakartaDate, 
  getJakartaTime, 
  calculateEntitledDates, 
  checkBreakfastTimeWindow,
  formatDisplayDate
} from './time';

const STORAGE_KEY = 'gt_breakfast_system_db_v1';

export interface DatabaseState {
  hotel: Hotel;
  users: UserProfile[];
  guests: Guest[];
  qrCodes: QRCodeData[];
  entitlements: BreakfastEntitlement[];
  usages: BreakfastUsage[];
  auditLogs: AuditLog[];
  supabaseConfig?: {
    url: string;
    anonKey: string;
    enabled: boolean;
  };
}

// Initial Default State
function getInitialState(): DatabaseState {
  const hotelId = 'gt-hotel-001';
  const today = getJakartaDate(); // 2026-09-29 in Jakarta time

  const hotel: Hotel = {
    id: hotelId,
    name: 'Grand Tjokro Yogyakarta',
    restaurant_name: 'Tjokro Resto',
    logo_url: '/icon.svg',
    timezone: 'Asia/Jakarta',
    breakfast_start: '06:00',
    breakfast_end: '10:00',
    allow_checkout_day: true,
    allow_partial_redemption: false,
    enforce_breakfast_time: true,
    allow_manual_search: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
  };

  const users: UserProfile[] = [
    {
      id: 'usr-admin-1',
      hotel_id: hotelId,
      email: 'admin@grandtjokro.com',
      name: 'Bambang Soediro (General Manager)',
      role: 'ADMIN',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-reception-1',
      hotel_id: hotelId,
      email: 'reception@grandtjokro.com',
      name: 'Rina Kusuma (Front Office)',
      role: 'RECEPTION',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-restaurant-1',
      hotel_id: hotelId,
      email: 'restaurant@grandtjokro.com',
      name: 'Agus Santosa (Head Waiter)',
      role: 'RESTAURANT',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-supervisor-1',
      hotel_id: hotelId,
      email: 'supervisor@grandtjokro.com',
      name: 'Hartono Wijaya (F&B Supervisor)',
      role: 'SUPERVISOR',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  // Pre-seeded guests as specified in prompt:
  // Room 305: Budi Santoso (2 Pax, Stay 29 Sep to 1 Oct) -> Fresh QR
  const guest1: Guest = {
    id: 'gst-305',
    hotel_id: hotelId,
    room_number: '305',
    guest_name: 'Budi Santoso',
    check_in: '2026-09-29',
    check_out: '2026-10-01',
    pax: 2,
    status: 'ACTIVE',
    source_system: 'FRONT_OFFICE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T14:30:00Z',
    updated_at: '2026-09-28T14:30:00Z',
  };

  const qr1: QRCodeData = {
    id: 'qr-305',
    hotel_id: hotelId,
    guest_id: guest1.id,
    token: 'BF26-8F72K91X',
    status: 'ACTIVE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T14:30:00Z',
  };

  // Room 412: Andi Wijaya (1 Pax, Stay 29 Sep to 30 Sep) -> Already used today at 07:45 WIB
  const guest2: Guest = {
    id: 'gst-412',
    hotel_id: hotelId,
    room_number: '412',
    guest_name: 'Andi Wijaya',
    check_in: '2026-09-29',
    check_out: '2026-09-30',
    pax: 1,
    status: 'ACTIVE',
    source_system: 'FRONT_OFFICE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T16:00:00Z',
    updated_at: '2026-09-28T16:00:00Z',
  };

  const qr2: QRCodeData = {
    id: 'qr-412',
    hotel_id: hotelId,
    guest_id: guest2.id,
    token: 'BF26-412AW99',
    status: 'ACTIVE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T16:00:00Z',
  };

  // Room 508: Siti Rahmawati (3 Pax, Stay 28 Sep to 29 Sep)
  const guest3: Guest = {
    id: 'gst-508',
    hotel_id: hotelId,
    room_number: '508',
    guest_name: 'Siti Rahmawati',
    check_in: '2026-09-28',
    check_out: '2026-09-29',
    pax: 3,
    status: 'ACTIVE',
    source_system: 'FRONT_OFFICE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T11:00:00Z',
    updated_at: '2026-09-28T11:00:00Z',
  };

  const qr3: QRCodeData = {
    id: 'qr-508',
    hotel_id: hotelId,
    guest_id: guest3.id,
    token: 'BF26-508SR88',
    status: 'ACTIVE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T11:00:00Z',
  };

  // Room 201: John Miller (2 Pax, Stay 25 Sep to 27 Sep) -> Expired
  const guest4: Guest = {
    id: 'gst-201',
    hotel_id: hotelId,
    room_number: '201',
    guest_name: 'John Miller',
    check_in: '2026-09-25',
    check_out: '2026-09-27',
    pax: 2,
    status: 'CHECKED_OUT',
    source_system: 'ONLINE_OTA',
    created_by: 'usr-reception-1',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-27T12:00:00Z',
  };

  const qr4: QRCodeData = {
    id: 'qr-201',
    hotel_id: hotelId,
    guest_id: guest4.id,
    token: 'BF26-201JM77',
    status: 'EXPIRED',
    created_by: 'usr-reception-1',
    created_at: '2026-09-25T10:00:00Z',
  };

  // Room 114: Dewi Lestari (2 Pax) -> Revoked
  const guest5: Guest = {
    id: 'gst-114',
    hotel_id: hotelId,
    room_number: '114',
    guest_name: 'Dewi Lestari',
    check_in: '2026-09-29',
    check_out: '2026-10-02',
    pax: 2,
    status: 'ACTIVE',
    source_system: 'FRONT_OFFICE',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T09:00:00Z',
    updated_at: '2026-09-28T09:00:00Z',
  };

  const qr5: QRCodeData = {
    id: 'qr-114',
    hotel_id: hotelId,
    guest_id: guest5.id,
    token: 'BF26-114DL66',
    status: 'REVOKED',
    created_by: 'usr-reception-1',
    created_at: '2026-09-28T09:00:00Z',
    revoked_at: '2026-09-28T18:00:00Z',
    revoked_by: 'usr-admin-1',
  };

  const guests = [guest1, guest2, guest3, guest4, guest5];
  const qrCodes = [qr1, qr2, qr3, qr4, qr5];

  // Calculate entitlements for all guests
  const entitlements: BreakfastEntitlement[] = [];
  guests.forEach((g) => {
    const q = qrCodes.find((item) => item.guest_id === g.id);
    if (!q) return;
    const dates = calculateEntitledDates(g.check_in, g.check_out, hotel.allow_checkout_day);
    dates.forEach((d) => {
      entitlements.push({
        id: `ent-${q.id}-${d}`,
        hotel_id: hotelId,
        guest_id: g.id,
        qr_code_id: q.id,
        breakfast_date: d,
        pax_entitlement: g.pax,
        created_at: q.created_at,
      });
    });
  });

  // Sample usage for Room 412 (used earlier today at 07:45 WIB)
  const usages: BreakfastUsage[] = [
    {
      id: 'usg-412-sample',
      hotel_id: hotelId,
      guest_id: guest2.id,
      qr_code_id: qr2.id,
      breakfast_date: today,
      pax: 1,
      used_at: `${today}T07:45:00+07:00`,
      used_time_str: '07:45 WIB',
      used_by: 'Agus Santosa (Head Waiter)',
      scanner_device_id: 'SCANNER-RESTO-01',
      redemption_method: 'QR_SCAN',
      status: 'USED',
      created_at: `${today}T07:45:00+07:00`,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      hotel_id: hotelId,
      user_id: 'usr-reception-1',
      user_name: 'Rina Kusuma',
      action: 'GUEST_CREATED',
      entity: 'guests',
      entity_id: guest1.id,
      metadata: { room: '305', guest: 'Budi Santoso', pax: 2 },
      created_at: '2026-09-28T14:30:00Z',
    },
    {
      id: 'aud-2',
      hotel_id: hotelId,
      user_id: 'usr-reception-1',
      user_name: 'Rina Kusuma',
      action: 'QR_GENERATED',
      entity: 'qr_codes',
      entity_id: qr1.id,
      metadata: { token: qr1.token, room: '305' },
      created_at: '2026-09-28T14:30:05Z',
    },
    {
      id: 'aud-3',
      hotel_id: hotelId,
      user_id: 'usr-admin-1',
      user_name: 'Bambang Soediro',
      action: 'QR_REVOKED',
      entity: 'qr_codes',
      entity_id: qr5.id,
      metadata: { room: '114', guest: 'Dewi Lestari', reason: 'Guest room upgrade' },
      created_at: '2026-09-28T18:00:00Z',
    },
    {
      id: 'aud-4',
      hotel_id: hotelId,
      user_id: 'usr-restaurant-1',
      user_name: 'Agus Santosa',
      action: 'BREAKFAST_REDEEMED',
      entity: 'breakfast_usage',
      entity_id: 'usg-412-sample',
      metadata: { room: '412', guest: 'Andi Wijaya', pax: 1, method: 'QR_SCAN' },
      created_at: `${today}T07:45:00+07:00`,
    },
  ];

  return {
    hotel,
    users,
    guests,
    qrCodes,
    entitlements,
    usages,
    auditLogs,
  };
}

class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load DB from localStorage, using initial seed', e);
    }
    const initial = getInitialState();
    this.save(initial);
    return initial;
  }

  private save(state: DatabaseState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefault() {
    this.state = getInitialState();
    this.save(this.state);
    return this.state;
  }

  // 1. HOTEL SETTINGS
  public getHotel(): Hotel {
    return this.state.hotel;
  }

  public updateHotel(settings: Partial<Hotel>, user?: UserProfile): Hotel {
    this.state.hotel = {
      ...this.state.hotel,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    
    // If allow_checkout_day changed, recalculate entitlements
    if (settings.allow_checkout_day !== undefined) {
      this.recalculateAllEntitlements();
    }

    this.addAuditLog(
      'HOTEL_SETTINGS_UPDATED',
      'hotels',
      this.state.hotel.id,
      settings,
      user
    );

    this.save(this.state);
    return this.state.hotel;
  }

  private recalculateAllEntitlements() {
    const allowCheckout = this.state.hotel.allow_checkout_day;
    const newEntitlements: BreakfastEntitlement[] = [];

    this.state.guests.forEach((g) => {
      const qr = this.state.qrCodes.find((q) => q.guest_id === g.id && q.status !== 'REVOKED');
      if (!qr) return;
      const dates = calculateEntitledDates(g.check_in, g.check_out, allowCheckout);
      dates.forEach((d) => {
        newEntitlements.push({
          id: `ent-${qr.id}-${d}`,
          hotel_id: this.state.hotel.id,
          guest_id: g.id,
          qr_code_id: qr.id,
          breakfast_date: d,
          pax_entitlement: g.pax,
          created_at: qr.created_at,
        });
      });
    });

    this.state.entitlements = newEntitlements;
  }

  // 2. USERS
  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  // 3. GUESTS & QR GENERATION
  public getGuests(): Guest[] {
    return [...this.state.guests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getGuestById(id: string): Guest | undefined {
    return this.state.guests.find((g) => g.id === id);
  }

  public getGuestByRoom(room: string): Guest | undefined {
    return this.state.guests.find(
      (g) => g.room_number.toLowerCase() === room.trim().toLowerCase() && g.status === 'ACTIVE'
    );
  }

  /**
   * Generates secure unique random token
   * Format: BF26-XXXXXXXX (e.g., BF26-8F72K91X)
   */
  public generateSecureToken(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const token = `BF26-${randomPart}`;
    // Verify uniqueness
    if (this.state.qrCodes.some((q) => q.token === token)) {
      return this.generateSecureToken();
    }
    return token;
  }

  public createGuestAndQR(
    guestData: {
      room_number: string;
      guest_name: string;
      check_in: string;
      check_out: string;
      pax: number;
    },
    user?: UserProfile
  ): { guest: Guest; qrCode: QRCodeData; entitlements: BreakfastEntitlement[] } {
    const guestId = `gst-${Date.now()}`;
    const now = new Date().toISOString();

    const guest: Guest = {
      id: guestId,
      hotel_id: this.state.hotel.id,
      room_number: guestData.room_number.trim(),
      guest_name: guestData.guest_name.trim(),
      check_in: guestData.check_in,
      check_out: guestData.check_out,
      pax: Number(guestData.pax),
      status: 'ACTIVE',
      source_system: 'FRONT_OFFICE',
      created_by: user?.id,
      created_at: now,
      updated_at: now,
    };

    const qrId = `qr-${Date.now()}`;
    const token = this.generateSecureToken();

    const qrCode: QRCodeData = {
      id: qrId,
      hotel_id: this.state.hotel.id,
      guest_id: guestId,
      token,
      status: 'ACTIVE',
      created_by: user?.id,
      created_at: now,
    };

    // Calculate Entitlements
    const dates = calculateEntitledDates(
      guest.check_in,
      guest.check_out,
      this.state.hotel.allow_checkout_day
    );

    const newEntitlements: BreakfastEntitlement[] = dates.map((d) => ({
      id: `ent-${qrId}-${d}`,
      hotel_id: this.state.hotel.id,
      guest_id: guestId,
      qr_code_id: qrId,
      breakfast_date: d,
      pax_entitlement: guest.pax,
      created_at: now,
    }));

    this.state.guests.unshift(guest);
    this.state.qrCodes.unshift(qrCode);
    this.state.entitlements.push(...newEntitlements);

    this.addAuditLog(
      'GUEST_CREATED',
      'guests',
      guest.id,
      { room: guest.room_number, guest: guest.guest_name, pax: guest.pax },
      user
    );

    this.addAuditLog(
      'QR_GENERATED',
      'qr_codes',
      qrCode.id,
      { token: qrCode.token, room: guest.room_number },
      user
    );

    this.save(this.state);

    return { guest, qrCode, entitlements: newEntitlements };
  }

  // 4. QR CODES & MANAGEMENT
  public getQRCodes(): QRCodeData[] {
    return this.state.qrCodes;
  }

  public getQRCodeByToken(token: string): QRCodeData | undefined {
    return this.state.qrCodes.find(
      (q) => q.token.trim().toUpperCase() === token.trim().toUpperCase()
    );
  }

  public getQRCodeByGuestId(guestId: string): QRCodeData | undefined {
    return this.state.qrCodes.find((q) => q.guest_id === guestId);
  }

  public revokeQRCode(qrId: string, user?: UserProfile): boolean {
    const qr = this.state.qrCodes.find((q) => q.id === qrId);
    if (!qr) return false;

    qr.status = 'REVOKED';
    qr.revoked_at = new Date().toISOString();
    qr.revoked_by = user?.id;

    const guest = this.getGuestById(qr.guest_id);

    this.addAuditLog(
      'QR_REVOKED',
      'qr_codes',
      qr.id,
      { token: qr.token, room: guest?.room_number, guest: guest?.guest_name },
      user
    );

    this.save(this.state);
    return true;
  }

  // 5. BREAKFAST VERIFICATION (SCAN ENGINE)
  public verifyBreakfastToken(token: string): QRVerificationResult {
    const cleanToken = token.trim().toUpperCase();
    const today = getJakartaDate();
    const currentTime = getJakartaTime();
    const hotel = this.state.hotel;

    // 1. Check if token exists
    const qr = this.getQRCodeByToken(cleanToken);
    if (!qr) {
      return {
        status: 'INVALID_QR',
        message: 'QR Code tidak ditemukan.',
      };
    }

    const guest = this.getGuestById(qr.guest_id);
    if (!guest) {
      return {
        status: 'INVALID_QR',
        message: 'Data tamu tidak ditemukan.',
      };
    }

    // 2. Check if revoked
    if (qr.status === 'REVOKED') {
      return {
        status: 'REVOKED',
        message: 'QR Code telah dibatalkan.',
        guest,
        qr_code: qr,
      };
    }

    // 3. Check breakfast operating hours (if enforce_breakfast_time is ON)
    if (hotel.enforce_breakfast_time) {
      const windowCheck = checkBreakfastTimeWindow(
        currentTime,
        hotel.breakfast_start,
        hotel.breakfast_end
      );

      if (!windowCheck.isWithin) {
        if (windowCheck.reason === 'BEFORE') {
          return {
            status: 'BREAKFAST_NOT_OPEN',
            message: `Breakfast belum dibuka. Mulai: ${hotel.breakfast_start} WIB`,
            guest,
            qr_code: qr,
            time_info: {
              current_time: currentTime,
              breakfast_start: hotel.breakfast_start,
              breakfast_end: hotel.breakfast_end,
            },
          };
        } else {
          return {
            status: 'BREAKFAST_CLOSED',
            message: `Breakfast telah berakhir: ${hotel.breakfast_end} WIB`,
            guest,
            qr_code: qr,
            time_info: {
              current_time: currentTime,
              breakfast_start: hotel.breakfast_start,
              breakfast_end: hotel.breakfast_end,
            },
          };
        }
      }
    }

    // 4. Check if entitled for today (Stay validity)
    const entitledDates = calculateEntitledDates(
      guest.check_in,
      guest.check_out,
      hotel.allow_checkout_day
    );

    if (!entitledDates.includes(today)) {
      return {
        status: 'EXPIRED',
        message: `Breakfast tidak berlaku pada tanggal ini (${formatDisplayDate(today)}). Stay: ${formatDisplayDate(guest.check_in)} - ${formatDisplayDate(guest.check_out)}`,
        guest,
        qr_code: qr,
        breakfast_date: today,
      };
    }

    // 5. Check if already used for today (ONE QR + ONE BREAKFAST DATE = 1 REDEMPTION)
    const existingUsage = this.state.usages.find(
      (u) => u.qr_code_id === qr.id && u.breakfast_date === today && u.status === 'USED'
    );

    if (existingUsage) {
      return {
        status: 'ALREADY_USED',
        message: `Telah digunakan pada ${existingUsage.used_time_str}`,
        guest,
        qr_code: qr,
        breakfast_date: today,
        used_at_str: existingUsage.used_time_str,
      };
    }

    // All clear!
    return {
      status: 'VALID',
      guest,
      qr_code: qr,
      breakfast_date: today,
      time_info: {
        current_time: currentTime,
        breakfast_start: hotel.breakfast_start,
        breakfast_end: hotel.breakfast_end,
      },
    };
  }

  // 6. REDEEM BREAKFAST (ATOMIC TRANSACTION WITH UNIQUE CONSTRAINT)
  public redeemBreakfast(
    qrCodeId: string,
    method: 'QR_SCAN' | 'MANUAL' = 'QR_SCAN',
    user?: UserProfile,
    deviceId: string = 'SCANNER-RESTO'
  ): { success: boolean; usage?: BreakfastUsage; error?: string } {
    const today = getJakartaDate();
    const timeStr = getJakartaTime();
    const qr = this.state.qrCodes.find((q) => q.id === qrCodeId);

    if (!qr) {
      return { success: false, error: 'INVALID_QR' };
    }

    const guest = this.getGuestById(qr.guest_id);
    if (!guest) {
      return { success: false, error: 'GUEST_NOT_FOUND' };
    }

    // CRITICAL POSTGRESQL UNIQUE CONSTRAINT SIMULATION:
    // Check if an existing usage already exists for (qr_code_id, breakfast_date)
    const alreadyUsed = this.state.usages.some(
      (u) => u.qr_code_id === qrCodeId && u.breakfast_date === today && u.status === 'USED'
    );

    if (alreadyUsed) {
      return { 
        success: false, 
        error: 'ALREADY_USED' 
      };
    }

    const usageId = `usg-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const usage: BreakfastUsage = {
      id: usageId,
      hotel_id: this.state.hotel.id,
      guest_id: guest.id,
      qr_code_id: qr.id,
      breakfast_date: today,
      pax: guest.pax,
      used_at: nowIso,
      used_time_str: `${timeStr} WIB`,
      used_by: user ? `${user.name} (${user.role})` : 'Staff',
      scanner_device_id: deviceId,
      redemption_method: method,
      status: 'USED',
      created_at: nowIso,
    };

    this.state.usages.unshift(usage);

    this.addAuditLog(
      'BREAKFAST_REDEEMED',
      'breakfast_usage',
      usage.id,
      {
        room: guest.room_number,
        guest: guest.guest_name,
        pax: guest.pax,
        date: today,
        time: `${timeStr} WIB`,
        method,
      },
      user
    );

    this.save(this.state);

    return { success: true, usage };
  }

  // 7. DASHBOARD METRICS
  public getDashboardStats(targetDate?: string): DashboardStats {
    const date = targetDate || getJakartaDate();

    // Expected for target date:
    // All active guests whose stay includes target date
    const expectedGuestsList = this.state.guests.filter((g) => {
      if (g.status === 'CANCELLED') return false;
      const entitledDates = calculateEntitledDates(
        g.check_in,
        g.check_out,
        this.state.hotel.allow_checkout_day
      );
      return entitledDates.includes(date);
    });

    const expectedGuests = expectedGuestsList.length;
    const expectedPax = expectedGuestsList.reduce((sum, g) => sum + g.pax, 0);

    // Served for target date
    const servedUsageList = this.state.usages.filter(
      (u) => u.breakfast_date === date && u.status === 'USED'
    );

    const servedGuests = servedUsageList.length;
    const servedPax = servedUsageList.reduce((sum, u) => sum + u.pax, 0);

    const remainingGuests = Math.max(0, expectedGuests - servedGuests);
    const remainingPax = Math.max(0, expectedPax - servedPax);

    // Recent scans
    const recentScans = servedUsageList.slice(0, 15).map((u) => {
      const g = this.getGuestById(u.guest_id);
      return {
        id: u.id,
        time: u.used_time_str,
        room_number: g?.room_number || '-',
        guest_name: g?.guest_name || 'Guest',
        pax: u.pax,
        status: u.status,
        redemption_method: u.redemption_method,
      };
    });

    return {
      expectedGuests,
      expectedPax,
      servedGuests,
      servedPax,
      remainingGuests,
      remainingPax,
      recentScans,
    };
  }

  // 8. AUDIT LOGS
  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public addAuditLog(
    action: string,
    entity: string,
    entity_id: string,
    metadata?: Record<string, any>,
    user?: UserProfile
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      hotel_id: this.state.hotel.id,
      user_id: user?.id,
      user_name: user?.name,
      action,
      entity,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
  }

  // 9. SUPABASE SYNC CONFIG
  public getSupabaseConfig() {
    return this.state.supabaseConfig;
  }

  public setSupabaseConfig(config: { url: string; anonKey: string; enabled: boolean }) {
    this.state.supabaseConfig = config;
    this.save(this.state);
  }
}

export const db = new DatabaseManager();
