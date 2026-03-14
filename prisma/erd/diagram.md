```mermaid
erDiagram

        asaas_webhook_status {
            pending pending
processing processing
processed processed
failed failed
        }
    


        idempotency_status {
            started started
completed completed
failed failed
        }
    


        outbox_status {
            pending pending
published published
failed failed
        }
    


        order_print_job_status {
            claimed claimed
printed printed
failed failed
        }
    


        order_status {
            pending pending
in_progress in_progress
ready ready
cancelled cancelled
        }
    


        order_payment_status {
            pending pending
completed completed
paid paid
canceled canceled
expired expired
processing processing
refunded refunded
rejected rejected
failed failed
unknown unknown
        }
    


        payment_method {
            pix pix
cash cash
apple_pay apple_pay
google_pay google_pay
debit_card debit_card
samsung_pay samsung_pay
credit_card credit_card
bank_transfer bank_transfer
other other
paypal paypal
unknown unknown
        }
    


        asaas_account_type {
            standard standard
white_label white_label
        }
    


        account_approval_status {
            pending pending
awaiting_approval awaiting_approval
approved approved
rejected rejected
unknown unknown
        }
    


        financial_onboarding_status {
            draft draft
provisioning provisioning
account_created account_created
awaiting_documents awaiting_documents
awaiting_review awaiting_review
approved approved
rejected rejected
blocked blocked
failed failed
commercial_info_expired commercial_info_expired
        }
    


        financial_webhook_status {
            pending pending
configured configured
failed failed
disabled disabled
        }
    


        settlement_strategy {
            split_automatico split_automatico
transferencia_posterior transferencia_posterior
        }
    


        fee_value_type {
            fixed fixed
percentage percentage
        }
    


        financial_ledger_entry_type {
            charge_created charge_created
charge_paid charge_paid
payment_received payment_received
provider_fee provider_fee
platform_fee platform_fee
payout_scheduled payout_scheduled
payout_completed payout_completed
payout_failed payout_failed
refund refund
adjustment adjustment
reconciliation reconciliation
        }
    


        financial_entry_direction {
            credit credit
debit debit
        }
    


        payout_transfer_status {
            scheduled scheduled
processing processing
completed completed
failed failed
canceled canceled
        }
    


        financial_reconciliation_status {
            pending pending
matched matched
mismatched mismatched
ignored ignored
failed failed
        }
    


        financial_document_upload_status {
            stored stored
uploaded uploaded
failed failed
        }
    


        backoffice_user_role {
            admin admin
operator operator
        }
    


        restaurant_lifecycle_status {
            active active
inactive inactive
cancelled cancelled
        }
    
  "tenants" {
    String id "🗝️"
    String slug 
    String name 
    Boolean is_active 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "user_profiles" {
    String id "🗝️"
    String supabase_user_id 
    String email 
    String full_name 
    DateTime birth_date 
    String document 
    String role 
    String job_title 
    String department 
    String cheffia_id 
    String avatar_url "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "internal_users" {
    String id "🗝️"
    String supabase_user_id 
    String email 
    String full_name 
    BackofficeUserRole role 
    Boolean is_active 
    DateTime last_login_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurants" {
    String id "🗝️"
    String tenant_id 
    String supabase_user_id "❓"
    String name 
    String address "❓"
    String phone_number "❓"
    String email "❓"
    String owner_full_name "❓"
    String document "❓"
    String person_type "❓"
    String company_type "❓"
    DateTime birth_date "❓"
    String postal_code "❓"
    String address_number "❓"
    String province "❓"
    String complement "❓"
    String city "❓"
    String state "❓"
    String verification_code "❓"
    Boolean email_verified 
    RestaurantLifecycleStatus lifecycle_status 
    DateTime lifecycle_status_changed_at "❓"
    DateTime register_date 
    DateTime financial_onboarding_started_at "❓"
    DateTime financial_onboarding_completed_at "❓"
    String provider_avatar_url "❓"
    String restaurant_menu_id "❓"
    String restaurant_kitchen_id "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "menus" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "menu_categories" {
    String id "🗝️"
    String tenant_id 
    String menu_id 
    String name 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "menu_items" {
    String id "🗝️"
    String tenant_id 
    String menu_id 
    String category_id "❓"
    String name 
    String description 
    String ingredients 
    Decimal price 
    String media_id "❓"
    String media_url "❓"
    String media_imgix_url "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "customer_orders" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    DateTime order_date 
    String table_number 
    Int order_number 
    Decimal total_to_pay 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "customer_order_items" {
    String id "🗝️"
    String tenant_id 
    String customer_order_id 
    String menu_item_id 
    Int order_number 
    String name 
    OrderStatus order_status 
    Decimal price 
    String table_number 
    Int quantity 
    String comments 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "customer_order_payment_details" {
    String id "🗝️"
    String tenant_id 
    String customer_order_id 
    String financial_account_id "❓"
    String transaction_id "❓"
    String provider_customer_id "❓"
    String payer_name "❓"
    String payer_phone_number "❓"
    String payer_email "❓"
    String payer_document "❓"
    String provider_payment_id "❓"
    String billing_type "❓"
    OrderPaymentStatus status 
    PaymentMethod method 
    Decimal amount "❓"
    Decimal gross_amount "❓"
    Decimal net_amount "❓"
    Decimal platform_fee_amount "❓"
    Decimal provider_fee_amount "❓"
    String pix_qr_code "❓"
    String pix_copy_paste "❓"
    String external_reference "❓"
    String provider_raw_status "❓"
    String provider 
    DateTime payment_date "❓"
    DateTime last_provider_sync_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurant_payments" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String customer_order_id 
    String financial_account_id "❓"
    DateTime payment_date "❓"
    Decimal amount 
    Decimal gross_amount "❓"
    Decimal net_amount "❓"
    Decimal platform_fee_amount "❓"
    Decimal provider_fee_amount "❓"
    String transaction_id 
    PaymentMethod method 
    OrderPaymentStatus status 
    SettlementStrategy settlement_strategy "❓"
    String provider_raw_status "❓"
    DateTime available_at "❓"
    String provider 
    Json payment_details "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurant_financial_accounts" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String provider 
    String asaas_account_id "❓"
    String asaas_wallet_id "❓"
    String asaas_api_key_encrypted "❓"
    String asaas_api_key_last4 "❓"
    AsaasAccountType account_type 
    FinancialOnboardingStatus onboarding_status 
    AccountApprovalStatus commercial_info_status 
    AccountApprovalStatus bank_account_status 
    AccountApprovalStatus documentation_status 
    AccountApprovalStatus general_status 
    DateTime commercial_info_expiration_scheduled_at "❓"
    Boolean commercial_info_is_expired 
    FinancialWebhookStatus webhook_status 
    DateTime last_status_sync_at "❓"
    String last_error "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurant_financial_onboarding_documents" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String financial_account_id 
    String provider_document_group_id 
    String type 
    String title 
    String description "❓"
    String responsible_name "❓"
    String responsible_type "❓"
    AccountApprovalStatus status 
    String onboarding_url "❓"
    Json reject_reasons "❓"
    DateTime last_synced_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurant_financial_onboarding_document_uploads" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String financial_account_id 
    String onboarding_document_id 
    String provider_document_group_id 
    String provider_document_file_id "❓"
    String upload_type 
    String file_name 
    String storage_bucket 
    String storage_path 
    String content_type 
    Int file_size_bytes 
    String sha256 "❓"
    FinancialDocumentUploadStatus status 
    Json provider_raw_response "❓"
    String error_message "❓"
    DateTime uploaded_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurant_financial_settlement_rules" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String financial_account_id "❓"
    String provider 
    SettlementStrategy settlement_strategy 
    FeeValueType platform_fee_type 
    Decimal platform_fee_value 
    Int transfer_delay_days 
    Boolean active 
    Json metadata "❓"
    DateTime effective_from 
    DateTime effective_to "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "financial_ledger_entries" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String financial_account_id "❓"
    String customer_order_id "❓"
    String payment_detail_id "❓"
    String payout_transfer_id "❓"
    String provider 
    String provider_reference "❓"
    FinancialLedgerEntryType entry_type 
    FinancialEntryDirection direction 
    Decimal gross_amount 
    Decimal net_amount 
    Decimal fee_amount 
    String currency 
    DateTime occurred_at 
    Json metadata "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "restaurant_payout_transfers" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String financial_account_id "❓"
    String customer_order_id "❓"
    Decimal amount 
    String currency 
    PayoutTransferStatus status 
    String source_wallet_id "❓"
    String destination_wallet_id 
    String provider_transfer_id "❓"
    DateTime scheduled_for 
    DateTime processed_at "❓"
    String last_error "❓"
    Json metadata "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "financial_reconciliation_runs" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id "❓"
    String provider 
    String scope 
    FinancialReconciliationStatus status 
    DateTime started_at 
    DateTime finished_at "❓"
    Json summary "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "financial_reconciliation_items" {
    String id "🗝️"
    String tenant_id 
    String restaurant_id 
    String reconciliation_run_id 
    String financial_account_id "❓"
    String customer_order_id "❓"
    String payment_detail_id "❓"
    String provider_reference "❓"
    FinancialReconciliationStatus status 
    String reason "❓"
    Json internal_snapshot "❓"
    Json provider_snapshot "❓"
    DateTime resolved_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "idempotency_keys" {
    String id "🗝️"
    String tenant_id 
    String method 
    String endpoint 
    String idempotency_key 
    String request_hash "❓"
    IdempotencyStatus status 
    Int response_status_code "❓"
    Json response_body "❓"
    DateTime expires_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "order_print_jobs" {
    String id "🗝️"
    String tenant_id 
    String outbox_event_id 
    String restaurant_id 
    String printer_id 
    OrderPrintJobStatus status 
    Int attempt_count 
    String last_error "❓"
    Json payload_snapshot "❓"
    DateTime claimed_at "❓"
    DateTime printed_at "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "asaas_webhook_events" {
    String id "🗝️"
    String tenant_id 
    String provider 
    String provider_event_id 
    String event_type 
    Json raw_payload 
    Json raw_headers 
    Boolean signature_validated 
    AsaasWebhookStatus status 
    Int processing_attempts 
    DateTime first_received_at 
    DateTime last_received_at 
    DateTime processed_at "❓"
    String last_error "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "outbox_events" {
    String id "🗝️"
    String tenant_id 
    String aggregate_type 
    String aggregate_id 
    String event_type 
    Json payload 
    OutboxStatus status 
    DateTime available_at 
    DateTime published_at "❓"
    Int retry_count 
    String last_error "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  
    "internal_users" |o--|| "BackofficeUserRole" : "enum:role"
    "restaurants" |o--|| "RestaurantLifecycleStatus" : "enum:lifecycle_status"
    "restaurants" }o--|| tenants : "tenant"
    "restaurants" }o--|o user_profiles : "ownerProfile"
    "menus" }o--|| tenants : "tenant"
    "menus" |o--|| restaurants : "restaurant"
    "menu_categories" }o--|| tenants : "tenant"
    "menu_categories" }o--|| menus : "menu"
    "menu_items" }o--|| tenants : "tenant"
    "menu_items" }o--|| menus : "menu"
    "menu_items" }o--|o menu_categories : "category"
    "customer_orders" }o--|| tenants : "tenant"
    "customer_orders" }o--|| restaurants : "restaurant"
    "customer_order_items" |o--|| "OrderStatus" : "enum:order_status"
    "customer_order_items" }o--|| tenants : "tenant"
    "customer_order_items" }o--|| customer_orders : "customerOrder"
    "customer_order_payment_details" |o--|| "OrderPaymentStatus" : "enum:status"
    "customer_order_payment_details" |o--|| "PaymentMethod" : "enum:method"
    "customer_order_payment_details" }o--|| tenants : "tenant"
    "customer_order_payment_details" |o--|| customer_orders : "customerOrder"
    "customer_order_payment_details" }o--|o restaurant_financial_accounts : "financialAccount"
    "restaurant_payments" |o--|| "PaymentMethod" : "enum:method"
    "restaurant_payments" |o--|| "OrderPaymentStatus" : "enum:status"
    "restaurant_payments" |o--|o "SettlementStrategy" : "enum:settlement_strategy"
    "restaurant_payments" }o--|| tenants : "tenant"
    "restaurant_payments" }o--|| restaurants : "restaurant"
    "restaurant_payments" }o--|| customer_orders : "customerOrder"
    "restaurant_payments" }o--|o restaurant_financial_accounts : "financialAccount"
    "restaurant_financial_accounts" |o--|| "AsaasAccountType" : "enum:account_type"
    "restaurant_financial_accounts" |o--|| "FinancialOnboardingStatus" : "enum:onboarding_status"
    "restaurant_financial_accounts" |o--|| "AccountApprovalStatus" : "enum:commercial_info_status"
    "restaurant_financial_accounts" |o--|| "AccountApprovalStatus" : "enum:bank_account_status"
    "restaurant_financial_accounts" |o--|| "AccountApprovalStatus" : "enum:documentation_status"
    "restaurant_financial_accounts" |o--|| "AccountApprovalStatus" : "enum:general_status"
    "restaurant_financial_accounts" |o--|| "FinancialWebhookStatus" : "enum:webhook_status"
    "restaurant_financial_accounts" }o--|| tenants : "tenant"
    "restaurant_financial_accounts" }o--|| restaurants : "restaurant"
    "restaurant_financial_onboarding_documents" |o--|| "AccountApprovalStatus" : "enum:status"
    "restaurant_financial_onboarding_documents" }o--|| tenants : "tenant"
    "restaurant_financial_onboarding_documents" }o--|| restaurants : "restaurant"
    "restaurant_financial_onboarding_documents" }o--|| restaurant_financial_accounts : "financialAccount"
    "restaurant_financial_onboarding_document_uploads" |o--|| "FinancialDocumentUploadStatus" : "enum:status"
    "restaurant_financial_onboarding_document_uploads" }o--|| tenants : "tenant"
    "restaurant_financial_onboarding_document_uploads" }o--|| restaurants : "restaurant"
    "restaurant_financial_onboarding_document_uploads" }o--|| restaurant_financial_accounts : "financialAccount"
    "restaurant_financial_onboarding_document_uploads" }o--|| restaurant_financial_onboarding_documents : "onboardingDocument"
    "restaurant_financial_settlement_rules" |o--|| "SettlementStrategy" : "enum:settlement_strategy"
    "restaurant_financial_settlement_rules" |o--|| "FeeValueType" : "enum:platform_fee_type"
    "restaurant_financial_settlement_rules" }o--|| tenants : "tenant"
    "restaurant_financial_settlement_rules" }o--|| restaurants : "restaurant"
    "restaurant_financial_settlement_rules" }o--|o restaurant_financial_accounts : "financialAccount"
    "financial_ledger_entries" |o--|| "FinancialLedgerEntryType" : "enum:entry_type"
    "financial_ledger_entries" |o--|| "FinancialEntryDirection" : "enum:direction"
    "financial_ledger_entries" }o--|| tenants : "tenant"
    "financial_ledger_entries" }o--|| restaurants : "restaurant"
    "financial_ledger_entries" }o--|o restaurant_financial_accounts : "financialAccount"
    "financial_ledger_entries" }o--|o customer_orders : "customerOrder"
    "financial_ledger_entries" }o--|o customer_order_payment_details : "paymentDetail"
    "financial_ledger_entries" }o--|o restaurant_payout_transfers : "payoutTransfer"
    "restaurant_payout_transfers" |o--|| "PayoutTransferStatus" : "enum:status"
    "restaurant_payout_transfers" }o--|| tenants : "tenant"
    "restaurant_payout_transfers" }o--|| restaurants : "restaurant"
    "restaurant_payout_transfers" }o--|o restaurant_financial_accounts : "financialAccount"
    "restaurant_payout_transfers" }o--|o customer_orders : "customerOrder"
    "financial_reconciliation_runs" |o--|| "FinancialReconciliationStatus" : "enum:status"
    "financial_reconciliation_runs" }o--|| tenants : "tenant"
    "financial_reconciliation_runs" }o--|o restaurants : "restaurant"
    "financial_reconciliation_items" |o--|| "FinancialReconciliationStatus" : "enum:status"
    "financial_reconciliation_items" }o--|| tenants : "tenant"
    "financial_reconciliation_items" }o--|| restaurants : "restaurant"
    "financial_reconciliation_items" }o--|| financial_reconciliation_runs : "reconciliationRun"
    "financial_reconciliation_items" }o--|o restaurant_financial_accounts : "financialAccount"
    "financial_reconciliation_items" }o--|o customer_orders : "customerOrder"
    "financial_reconciliation_items" }o--|o customer_order_payment_details : "paymentDetail"
    "idempotency_keys" |o--|| "IdempotencyStatus" : "enum:status"
    "idempotency_keys" }o--|| tenants : "tenant"
    "order_print_jobs" |o--|| "OrderPrintJobStatus" : "enum:status"
    "order_print_jobs" }o--|| tenants : "tenant"
    "order_print_jobs" }o--|| outbox_events : "outboxEvent"
    "asaas_webhook_events" |o--|| "AsaasWebhookStatus" : "enum:status"
    "asaas_webhook_events" }o--|| tenants : "tenant"
    "outbox_events" |o--|| "OutboxStatus" : "enum:status"
    "outbox_events" }o--|| tenants : "tenant"
```
