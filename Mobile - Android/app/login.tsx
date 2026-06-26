import { LoginView } from '@/components/auth/LoginView';
import { useMobileLogin } from '@/features/auth/useMobileLogin';

export default function LoginScreen() {
  const login = useMobileLogin();

  return (
    <LoginView
      code={login.code}
      loading={login.loading}
      scannerOpen={login.scannerOpen}
      onCodeChange={login.setCode}
      onSubmitCode={login.submitCode}
      onOpenScanner={login.openScanner}
      onCloseScanner={login.closeScanner}
      onScanQr={login.handleQrData}
    />
  );
}
