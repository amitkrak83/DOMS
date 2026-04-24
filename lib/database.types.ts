export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          variant_name: string
          bottles_per_case: number
          price_per_case: number
          free_bottles_per_case: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variant_name: string
          bottles_per_case: number
          price_per_case: number
          free_bottles_per_case: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_name?: string
          bottles_per_case?: number
          price_per_case?: number
          free_bottles_per_case?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          status: string
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          status?: string
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          status?: string
          total_amount?: number
          created_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string
          cases: number
          free_bottles: number
          total_bottles: number
          amount: number
          price_per_case_snapshot: number
        }
        Insert: {
          id?: string
          order_id: string
          variant_id: string
          cases: number
          free_bottles: number
          total_bottles: number
          amount: number
          price_per_case_snapshot: number
        }
        Update: {
          id?: string
          order_id?: string
          variant_id?: string
          cases?: number
          free_bottles?: number
          total_bottles?: number
          amount?: number
          price_per_case_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          payment_type: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_type: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_type?: string
          amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
