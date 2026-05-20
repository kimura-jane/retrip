/**
 * Supabase DB スキーマと対応する TypeScript 型定義。
 *
 * 通常は `supabase gen types typescript` で自動生成するが、
 * 本プロジェクトはスマホ完結開発のため CLI が使えず、手書きで管理する。
 *
 * SQL マイグレーション（supabase/migrations/*.sql）を変更したら、
 * このファイルも必ず同期して更新すること。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ===========================================
// Enum 型
// ===========================================

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type TourType = "day_trip" | "overnight";

export type TourStatus =
  | "draft"
  | "recruiting"
  | "closed"
  | "completed"
  | "cancelled";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "attended"
  | "no_show";

export type ChatRoomType = "tour" | "lounge";

export type ChatMemberRole = "member" | "admin";

// ===========================================
// 集合場所（meeting_points jsonb の構造）
// ===========================================

export interface MeetingPoint {
  id: string;
  name: string;
  time: string; // "HH:mm" 形式
  lat?: number;
  lng?: number;
  note?: string;
}

// ===========================================
// Database 型本体
// ===========================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string;
          birth_date: string; // ISO date 'YYYY-MM-DD'
          gender: Gender;
          bio: string | null;
          avatar_url: string | null;
          id_document_url: string | null;
          id_verified: boolean;
          id_verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          birth_date: string;
          gender: Gender;
          bio?: string | null;
          avatar_url?: string | null;
          id_document_url?: string | null;
          id_verified?: boolean;
          id_verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          birth_date?: string;
          gender?: Gender;
          bio?: string | null;
          avatar_url?: string | null;
          id_document_url?: string | null;
          id_verified?: boolean;
          id_verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      tours: {
        Row: {
          id: string;
          title: string;
          description: string;
          tour_type: TourType;
          destination: string;
          departure_date: string;
          return_date: string;
          meeting_points: MeetingPoint[];
          price: number;
          capacity_total: number;
          capacity_male: number | null;
          capacity_female: number | null;
          age_range_min: number | null;
          age_range_max: number | null;
          theme_tags: string[];
          status: TourStatus;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          tour_type: TourType;
          destination: string;
          departure_date: string;
          return_date: string;
          meeting_points?: MeetingPoint[];
          price: number;
          capacity_total: number;
          capacity_male?: number | null;
          capacity_female?: number | null;
          age_range_min?: number | null;
          age_range_max?: number | null;
          theme_tags?: string[];
          status?: TourStatus;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          tour_type?: TourType;
          destination?: string;
          departure_date?: string;
          return_date?: string;
          meeting_points?: MeetingPoint[];
          price?: number;
          capacity_total?: number;
          capacity_male?: number | null;
          capacity_female?: number | null;
          age_range_min?: number | null;
          age_range_max?: number | null;
          theme_tags?: string[];
          status?: TourStatus;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      bookings: {
        Row: {
          id: string;
          tour_id: string;
          user_id: string;
          meeting_point_id: string;
          status: BookingStatus;
          stripe_payment_intent_id: string | null;
          amount_paid: number;
          booked_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          user_id: string;
          meeting_point_id: string;
          status?: BookingStatus;
          stripe_payment_intent_id?: string | null;
          amount_paid: number;
          booked_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          user_id?: string;
          meeting_point_id?: string;
          status?: BookingStatus;
          stripe_payment_intent_id?: string | null;
          amount_paid?: number;
          booked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_tour_id_fkey";
            columns: ["tour_id"];
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      chat_rooms: {
        Row: {
          id: string;
          room_type: ChatRoomType;
          tour_id: string | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_type: ChatRoomType;
          tour_id?: string | null;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_type?: ChatRoomType;
          tour_id?: string | null;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_rooms_tour_id_fkey";
            columns: ["tour_id"];
            referencedRelation: "tours";
            referencedColumns: ["id"];
          }
        ];
      };

      chat_members: {
        Row: {
          room_id: string;
          user_id: string;
          role: ChatMemberRole;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          room_id: string;
          user_id: string;
          role?: ChatMemberRole;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          role?: ChatMemberRole;
          joined_at?: string;
          left_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_members_room_id_fkey";
            columns: ["room_id"];
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      albums: {
        Row: {
          id: string;
          tour_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "albums_tour_id_fkey";
            columns: ["tour_id"];
            referencedRelation: "tours";
            referencedColumns: ["id"];
          }
        ];
      };

      album_photos: {
        Row: {
          id: string;
          album_id: string;
          user_id: string;
          image_url: string;
          caption: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          album_id: string;
          user_id: string;
          image_url: string;
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          album_id?: string;
          user_id?: string;
          image_url?: string;
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "album_photos_album_id_fkey";
            columns: ["album_id"];
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "album_photos_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      payments: {
        Row: {
          id: string;
          booking_id: string;
          stripe_event_id: string;
          event_type: string;
          amount: number;
          status: string;
          raw_payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          stripe_event_id: string;
          event_type: string;
          amount: number;
          status: string;
          raw_payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          stripe_event_id?: string;
          event_type?: string;
          amount?: number;
          status?: string;
          raw_payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };

      admin_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_type: string;
          target_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_type: string;
          target_id: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      gender: Gender;
      tour_type: TourType;
      tour_status: TourStatus;
      booking_status: BookingStatus;
      chat_room_type: ChatRoomType;
      chat_member_role: ChatMemberRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ===========================================
// 便利な型エイリアス（アプリ全体で使う）
// ===========================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// よく使うエイリアス
export type User = Tables<"users">;
export type Tour = Tables<"tours">;
export type Booking = Tables<"bookings">;
export type ChatRoom = Tables<"chat_rooms">;
export type ChatMember = Tables<"chat_members">;
export type Message = Tables<"messages">;
export type Album = Tables<"albums">;
export type AlbumPhoto = Tables<"album_photos">;
export type Payment = Tables<"payments">;
export type AdminLog = Tables<"admin_logs">;
