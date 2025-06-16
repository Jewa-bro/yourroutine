CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- user_id에 인덱스 생성하여 조회 성능 향상
CREATE INDEX ON public.push_subscriptions (user_id);

-- push_subscriptions 테이블에 대한 RLS(Row Level Security) 활성화
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독 정보만 조회, 수정, 삭제할 수 있도록 정책 생성
CREATE POLICY "Allow individual access"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id); 