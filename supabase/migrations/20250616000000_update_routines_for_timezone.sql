-- routines 테이블의 기존 time 컬럼들을 timestamptz로 변경하고, last_notified_at 컬럼을 추가합니다.

ALTER TABLE public.routines
  DROP COLUMN IF EXISTS start_time,
  ADD COLUMN start_time TIMESTAMPTZ,
  DROP COLUMN IF EXISTS end_time,
  ADD COLUMN end_time TIMESTAMPTZ;

-- 알림 추적을 위한 새로운 테이블을 생성합니다.
CREATE TABLE public.routine_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('start', 'end'))
);

CREATE INDEX ON public.routine_notifications (routine_id);
CREATE INDEX ON public.routine_notifications (user_id);

ALTER TABLE public.routine_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual access for own routines"
ON public.routine_notifications
FOR SELECT
USING (auth.uid() = user_id); 