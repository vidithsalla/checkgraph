ALTER TYPE "hosted_settlement_state"
RENAME VALUE 'partially_hosted' TO 'partially_reconciled';

ALTER TYPE "event_type"
ADD VALUE IF NOT EXISTS 'hosted_credit_applied_to_check';

ALTER TYPE "exception_type"
ADD VALUE IF NOT EXISTS 'hosted_credit_available_not_applied';
