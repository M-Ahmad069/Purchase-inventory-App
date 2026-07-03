export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MeasurementType = "weight" | "piece";

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          name: string;
          measurement_type: MeasurementType;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          measurement_type: MeasurementType;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          measurement_type?: MeasurementType;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          vendor_id: string;
          item_id: string;
          purchased_at: string;
          quantity_kg: number | null;
          quantity_pieces: number | null;
          cost_price: number;
          retail_price: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          item_id: string;
          purchased_at?: string;
          quantity_kg?: number | null;
          quantity_pieces?: number | null;
          cost_price: number;
          retail_price: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          item_id?: string;
          purchased_at?: string;
          quantity_kg?: number | null;
          quantity_pieces?: number | null;
          cost_price?: number;
          retail_price?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          id: number;
          owner_user_id: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          owner_user_id: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          owner_user_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      measurement_type: MeasurementType;
    };
  };
}

export type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

export type PurchaseWithRelations = Purchase & {
  vendors: Pick<Vendor, "name"> | null;
  items: Pick<Item, "name" | "measurement_type"> | null;
};

export type PurchaseWithVendor = Purchase & {
  vendors: Pick<Vendor, "name"> | null;
};
