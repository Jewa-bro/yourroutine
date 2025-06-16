CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- user_id에 인덱스를 생성하여 특정 사용자의 알림을 빠르게 조회할 수 있도록 합니다.
CREATE INDEX ON public.notifications (user_id);

-- notifications 테이블에 RLS(Row Level Security)를 활성화합니다.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 정보만 조회할 수 있도록 정책을 생성합니다.
CREATE POLICY "Allow individual read access"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 알림 정보를 '읽음'으로 수정할 수 있도록 정책을 생성합니다.
CREATE POLICY "Allow individual update"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id); 