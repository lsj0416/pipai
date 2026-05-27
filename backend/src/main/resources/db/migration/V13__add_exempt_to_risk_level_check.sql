-- risk_checklist_items_level_check에 EXEMPT 추가
ALTER TABLE risk_checklist_items
  DROP CONSTRAINT IF EXISTS risk_checklist_items_level_check;

ALTER TABLE risk_checklist_items
  ADD CONSTRAINT risk_checklist_items_level_check
  CHECK (level IN ('IMMEDIATE', 'CHECK_NEEDED', 'GOOD', 'EXEMPT'));
