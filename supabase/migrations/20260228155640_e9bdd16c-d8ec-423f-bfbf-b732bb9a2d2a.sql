
CREATE OR REPLACE FUNCTION public.update_budget_spent_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle status change to approved/paid (add to spent)
  IF (TG_OP = 'UPDATE' AND NEW.budget_id IS NOT NULL AND NEW.status IN ('approved', 'paid') AND OLD.status NOT IN ('approved', 'paid')) THEN
    UPDATE public.budgets SET spent_amount = spent_amount + NEW.amount, updated_at = now() WHERE id = NEW.budget_id;
  END IF;

  -- Handle status change FROM approved/paid back to pending/rejected (subtract from spent)
  IF (TG_OP = 'UPDATE' AND OLD.budget_id IS NOT NULL AND OLD.status IN ('approved', 'paid') AND NEW.status NOT IN ('approved', 'paid')) THEN
    UPDATE public.budgets SET spent_amount = GREATEST(spent_amount - OLD.amount, 0), updated_at = now() WHERE id = OLD.budget_id;
  END IF;

  -- Handle deletion of approved expense
  IF (TG_OP = 'DELETE' AND OLD.budget_id IS NOT NULL AND OLD.status IN ('approved', 'paid')) THEN
    UPDATE public.budgets SET spent_amount = GREATEST(spent_amount - OLD.amount, 0), updated_at = now() WHERE id = OLD.budget_id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_budget_spent
AFTER UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_budget_spent_amount();
