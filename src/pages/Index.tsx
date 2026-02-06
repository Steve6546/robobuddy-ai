/**
 * @fileoverview الصفحة الرئيسية - Main Index Page
 * 
 * @description
 * الصفحة الرئيسية للتطبيق، محمية بحارس المصادقة
 */

import { ChatContainer } from '@/components/chat/ChatContainer';
import { AuthGuard } from '@/components/auth/AuthGuard';

const Index = () => {
  return (
    <AuthGuard>
      <ChatContainer />
    </AuthGuard>
  );
};

export default Index;
