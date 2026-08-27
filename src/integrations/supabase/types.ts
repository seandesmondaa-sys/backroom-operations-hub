export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      approval_requests: {
        Row: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          created_at: string
          description: string | null
          id: string
          reference_id: string
          requested_by: string
          status: Database["public"]["Enums"]["approval_request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          created_at?: string
          description?: string | null
          id?: string
          reference_id: string
          requested_by: string
          status?: Database["public"]["Enums"]["approval_request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approval_type?: Database["public"]["Enums"]["approval_type"]
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["approval_request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_steps: {
        Row: {
          acted_at: string | null
          approver_id: string
          created_at: string
          id: string
          notes: string | null
          request_id: string
          status: Database["public"]["Enums"]["approval_step_status"]
          step_order: number
        }
        Insert: {
          acted_at?: string | null
          approver_id: string
          created_at?: string
          id?: string
          notes?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["approval_step_status"]
          step_order?: number
        }
        Update: {
          acted_at?: string | null
          approver_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["approval_step_status"]
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_at: string
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          allocated_amount: number
          category: Database["public"]["Enums"]["budget_category"]
          created_at: string
          created_by: string
          department_id: string | null
          fiscal_year: string
          id: string
          name: string
          notes: string | null
          project_id: string | null
          spent_amount: number
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by: string
          department_id?: string | null
          fiscal_year?: string
          id?: string
          name: string
          notes?: string | null
          project_id?: string | null
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by?: string
          department_id?: string | null
          fiscal_year?: string
          id?: string
          name?: string
          notes?: string | null
          project_id?: string | null
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          campaign_type: string | null
          channels: string[] | null
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          spent: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          campaign_type?: string | null
          channels?: string[] | null
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          spent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          campaign_type?: string | null
          channels?: string[] | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          spent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_items: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          contract_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          counterparty: string | null
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          end_date: string | null
          file_path: string | null
          id: string
          parent_contract_id: string | null
          project_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          tags: string[] | null
          template_content: string | null
          title: string
          updated_at: string
          value: number | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          counterparty?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          file_path?: string | null
          id?: string
          parent_contract_id?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tags?: string[] | null
          template_content?: string | null
          title: string
          updated_at?: string
          value?: number | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          counterparty?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          file_path?: string | null
          id?: string
          parent_contract_id?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tags?: string[] | null
          template_content?: string | null
          title?: string
          updated_at?: string
          value?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          parent_document_id: string | null
          project_id: string | null
          tags: string[] | null
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          parent_document_id?: string | null
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          parent_document_id?: string | null
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_id: string | null
          category: Database["public"]["Enums"]["budget_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_attendance: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          notes: string | null
          total_hours: number | null
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          total_hours?: number | null
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          total_hours?: number | null
          user_id?: string
        }
        Relationships: []
      }
      hr_leave_requests: {
        Row: {
          created_at: string
          days_count: number
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_count?: number
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_count?: number
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_confidential: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_confidential?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_confidential?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_performance_logs: {
        Row: {
          created_at: string
          id: string
          improvements: string | null
          logged_by: string
          notes: string | null
          period: string
          rating: number | null
          strengths: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          improvements?: string | null
          logged_by: string
          notes?: string | null
          period: string
          rating?: number | null
          strengths?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          improvements?: string | null
          logged_by?: string
          notes?: string | null
          period?: string
          rating?: number | null
          strengths?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_name: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          paid_date: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          client_name: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          paid_date?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_name?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          paid_date?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          converted_project_id: string | null
          created_at: string
          created_by: string
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          department_id: string | null
          email: string | null
          funding_target: number | null
          id: string
          lead_score: number | null
          name: string
          notes: string | null
          phone: string | null
          readiness_stage: Database["public"]["Enums"]["readiness_stage"] | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by: string
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          department_id?: string | null
          email?: string | null
          funding_target?: number | null
          id?: string
          lead_score?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          readiness_stage?:
            | Database["public"]["Enums"]["readiness_stage"]
            | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          department_id?: string | null
          email?: string | null
          funding_target?: number | null
          id?: string
          lead_score?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          readiness_stage?:
            | Database["public"]["Enums"]["readiness_stage"]
            | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          asset_type: string
          campaign_id: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          asset_type?: string
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          asset_type?: string
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string | null
          entity_type: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_id?: string | null
          entity_type: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          thread_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          thread_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          thread_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      os_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "os_events"
            referencedColumns: ["id"]
          },
        ]
      }
      os_events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_global: boolean
          location: string | null
          project_id: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          end_time: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_global?: boolean
          location?: string | null
          project_id?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_global?: boolean
          location?: string | null
          project_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_events_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      os_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"]
          recurrence_next: string | null
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          recurrence_next?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          recurrence_next?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_readiness: {
        Row: {
          auto_score: number
          created_at: string
          has_feasibility_study: boolean
          has_financial_model: boolean
          has_legal_docs: boolean
          has_regulatory_approvals: boolean
          has_revenue_projections: boolean
          id: string
          manual_override_stage: string | null
          notes: string | null
          project_id: string
          readiness_stage: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_score?: number
          created_at?: string
          has_feasibility_study?: boolean
          has_financial_model?: boolean
          has_legal_docs?: boolean
          has_regulatory_approvals?: boolean
          has_revenue_projections?: boolean
          id?: string
          manual_override_stage?: string | null
          notes?: string | null
          project_id: string
          readiness_stage?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_score?: number
          created_at?: string
          has_feasibility_study?: boolean
          has_financial_model?: boolean
          has_legal_docs?: boolean
          has_regulatory_approvals?: boolean
          has_revenue_projections?: boolean
          id?: string
          manual_override_stage?: string | null
          notes?: string | null
          project_id?: string
          readiness_stage?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      revenue_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          project_id: string | null
          recorded_by: string
          revenue_date: string
          source: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string | null
          recorded_by: string
          revenue_date?: string
          source: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string | null
          recorded_by?: string
          revenue_date?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      thread_participants: {
        Row: {
          id: string
          joined_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_pipelines: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          current_stage: Database["public"]["Enums"]["workflow_stage"]
          description: string | null
          id: string
          lead_id: string | null
          status: Database["public"]["Enums"]["workflow_pipeline_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_stage?: Database["public"]["Enums"]["workflow_stage"]
          description?: string | null
          id?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["workflow_pipeline_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_stage?: Database["public"]["Enums"]["workflow_stage"]
          description?: string | null
          id?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["workflow_pipeline_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_pipelines_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stage_gates: {
        Row: {
          acted_at: string | null
          approver_id: string | null
          created_at: string
          from_stage: Database["public"]["Enums"]["workflow_stage"]
          id: string
          notes: string | null
          pipeline_id: string
          status: Database["public"]["Enums"]["stage_gate_status"]
          to_stage: Database["public"]["Enums"]["workflow_stage"]
        }
        Insert: {
          acted_at?: string | null
          approver_id?: string | null
          created_at?: string
          from_stage: Database["public"]["Enums"]["workflow_stage"]
          id?: string
          notes?: string | null
          pipeline_id: string
          status?: Database["public"]["Enums"]["stage_gate_status"]
          to_stage: Database["public"]["Enums"]["workflow_stage"]
        }
        Update: {
          acted_at?: string | null
          approver_id?: string | null
          created_at?: string
          from_stage?: Database["public"]["Enums"]["workflow_stage"]
          id?: string
          notes?: string | null
          pipeline_id?: string
          status?: Database["public"]["Enums"]["stage_gate_status"]
          to_stage?: Database["public"]["Enums"]["workflow_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stage_gates_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "workflow_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_department: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "department_head"
        | "department_staff"
        | "general_staff"
      approval_request_status:
        | "pending"
        | "in_progress"
        | "approved"
        | "rejected"
        | "cancelled"
      approval_step_status: "pending" | "approved" | "rejected" | "skipped"
      approval_type: "expense" | "leave" | "budget" | "contract" | "document"
      budget_category:
        | "operational"
        | "marketing"
        | "staffing"
        | "legal"
        | "technology"
        | "travel"
        | "other"
      campaign_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      contract_status:
        | "draft"
        | "review"
        | "pending_approval"
        | "active"
        | "expired"
        | "terminated"
      contract_type:
        | "nda"
        | "service_agreement"
        | "investment_agreement"
        | "mou"
        | "consulting"
        | "employment"
        | "other"
      deal_type:
        | "equity"
        | "debt"
        | "mezzanine"
        | "grant"
        | "advisory"
        | "other"
      event_type: "meeting" | "follow_up" | "deadline" | "reminder" | "other"
      expense_status: "pending" | "approved" | "rejected" | "paid"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "converted"
        | "lost"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "annual"
        | "sick"
        | "personal"
        | "maternity"
        | "paternity"
        | "unpaid"
        | "other"
      readiness_stage:
        | "concept"
        | "early_development"
        | "structuring"
        | "investment_ready"
        | "capital_deployment"
      recurrence_type: "none" | "daily" | "weekly" | "biweekly" | "monthly"
      stage_gate_status: "pending" | "approved" | "rejected" | "skipped"
      task_priority: "urgent" | "high" | "medium" | "low"
      task_status: "backlog" | "todo" | "in_progress" | "waiting" | "done"
      workflow_pipeline_status: "active" | "paused" | "completed" | "cancelled"
      workflow_stage: "sales" | "legal" | "finance" | "operations" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "department_head",
        "department_staff",
        "general_staff",
      ],
      approval_request_status: [
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "cancelled",
      ],
      approval_step_status: ["pending", "approved", "rejected", "skipped"],
      approval_type: ["expense", "leave", "budget", "contract", "document"],
      budget_category: [
        "operational",
        "marketing",
        "staffing",
        "legal",
        "technology",
        "travel",
        "other",
      ],
      campaign_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      contract_status: [
        "draft",
        "review",
        "pending_approval",
        "active",
        "expired",
        "terminated",
      ],
      contract_type: [
        "nda",
        "service_agreement",
        "investment_agreement",
        "mou",
        "consulting",
        "employment",
        "other",
      ],
      deal_type: ["equity", "debt", "mezzanine", "grant", "advisory", "other"],
      event_type: ["meeting", "follow_up", "deadline", "reminder", "other"],
      expense_status: ["pending", "approved", "rejected", "paid"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "converted",
        "lost",
      ],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "annual",
        "sick",
        "personal",
        "maternity",
        "paternity",
        "unpaid",
        "other",
      ],
      readiness_stage: [
        "concept",
        "early_development",
        "structuring",
        "investment_ready",
        "capital_deployment",
      ],
      recurrence_type: ["none", "daily", "weekly", "biweekly", "monthly"],
      stage_gate_status: ["pending", "approved", "rejected", "skipped"],
      task_priority: ["urgent", "high", "medium", "low"],
      task_status: ["backlog", "todo", "in_progress", "waiting", "done"],
      workflow_pipeline_status: ["active", "paused", "completed", "cancelled"],
      workflow_stage: ["sales", "legal", "finance", "operations", "completed"],
    },
  },
} as const
