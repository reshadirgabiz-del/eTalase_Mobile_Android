import { ProfileView } from '@/components/profile/ProfileView';
import { useProfile } from '@/features/profile/useProfile';

export default function ProfileScreen() {
  const profile = useProfile();

  return (
    <ProfileView
      store={profile.store}
      userName={profile.userName}
      userEmail={profile.userEmail}
      onSwitchStore={profile.switchStore}
      onOpenStorefront={profile.openStorefront}
      onOpenCredits={profile.openCredits}
      onOpenPlan={profile.openPlan}
      onOpenAccountSettings={profile.openAccountSettings}
      onSavePreferences={profile.savePreferences}
      onEnableDevice={profile.enableDevice}
      onLogout={profile.logout}
    />
  );
}
