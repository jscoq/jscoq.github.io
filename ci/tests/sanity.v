Require Import Lia.

Example silly_presburger_example : forall m n o p,
	m + n <= n + o /\ o + 3 = p + 3 ->
	m <= p.
Proof.
  intros. lia.
Qed.
