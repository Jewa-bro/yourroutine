import { supabase } from '../lib/supabaseClient'; // supabase 클라이언트를 직접 사용하기 위해 추가

// VAPID 공개 키를 Uint8Array로 변환하는 함수
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 서비스 워커를 등록하고 푸시 구독을 설정하는 메인 함수
export async function subscribeToPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);

      // 푸시 구독 상태 확인
      let subscription = await registration.pushManager.getSubscription();

      if (subscription === null) {
        // 구독이 없는 경우 새로 생성
        console.log('No subscription found, creating new one.');
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        console.log('VAPID Public Key available:', !!vapidPublicKey);
        console.log('Environment check:', {
          supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          vapidKey: !!vapidPublicKey
        });
        
        if (!vapidPublicKey) {
            console.error('VITE_VAPID_PUBLIC_KEY is not set in environment variables');
            throw new Error('VAPID 공개 키가 설정되지 않았습니다.');
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        console.log('New push subscription:', subscription);
      } else {
        console.log('Existing subscription found:', subscription);
      }

      if (subscription) {
        console.log("Sending subscription to Edge Function...");
        
        // 현재 세션에서 인증 토큰 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error("User is not authenticated. Cannot save push subscription.");
          return;
        }

        const response = await supabase.functions.invoke('upsert-push-subscription', {
          body: { subscription },
        });

        if (response.error) {
          throw response.error;
        }

        console.log('Subscription successfully sent to server:', response.data);
      }
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  } else {
    console.warn('Push notifications are not supported by this browser.');
  }
}

// 알림 권한을 요청하는 함수
export function requestNotificationPermission() {
  return new Promise((resolve, reject) => {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported by this browser.');
      return resolve(false);
    }

    const handlePermission = (permission: NotificationPermission) => {
      if (permission === 'granted') {
        console.log('Notification permission is granted.');
        resolve(true);
      } else {
        // 사용자가 명시적으로 거부했거나 아직 선택하지 않은 경우.
        // 거부한 경우 다시 묻지 않는 것이 UX에 좋음.
        console.log('Notification permission was not granted. Current status:', permission);
        resolve(false);
      }
    };

    const currentPermission = Notification.permission;

    if (currentPermission === 'granted') {
      handlePermission('granted');
    } else if (currentPermission === 'denied') {
      // 이미 거부된 상태이므로, 다시 요청하지 않고 즉시 종료.
      handlePermission('denied');
    } else {
      // 'default' 상태일 때만 권한 요청 팝업을 사용자에게 보여줍니다.
      Notification.requestPermission().then(handlePermission).catch(err => {
        console.error("Error requesting notification permission", err);
        reject(err);
      });
    }
  });
} 