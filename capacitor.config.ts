import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 출시 방식
 * - 방식 A(원격): server.url 을 DuckDNS/도메인으로 설정 → 웹과 동일하게 동작
 * - 방식 B(번들): server.url 없음 + .env.production 의 REACT_APP_API_BASE_URL
 *
 * allowNavigation: Google/Kakao OAuth가 외부 Chrome으로 새지 않고 WebView 안에서
 * 끝나야 앱 localStorage에 토큰이 저장됩니다.
 */
const REMOTE_APP_URL = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.kaya.yatang',
  appName: '집밥부자',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'jibbabbuja.duckdns.org',
      '*.duckdns.org',
      'accounts.google.com',
      '*.google.com',
      '*.google.co.kr',
      'oauth2.googleapis.com',
      'kauth.kakao.com',
      'kapi.kakao.com',
      '*.kakao.com',
    ],
    ...(REMOTE_APP_URL
      ? {
          url: REMOTE_APP_URL,
          cleartext: REMOTE_APP_URL.startsWith('http://'),
        }
      : {}),
  },
};

export default config;
