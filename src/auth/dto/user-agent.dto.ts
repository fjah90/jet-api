// src/auth/dto/user-agent.dto.ts
export function getClientSource(userAgent: string): string {
    if (!userAgent) {
      return 'unknown';
    }
  
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'mobile_app';
    } else if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
      return 'web';
    } else {
      return 'unknown';
    }
  }