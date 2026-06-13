import { useState } from "react";
import { storage } from "./services/storage";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ProfileSelectScreen from "./screens/ProfileSelectScreen";
import CreateProfileScreen from "./screens/CreateProfileScreen";
import DependentScreen from "./screens/DependentScreen";
import CarerScreen from "./screens/CarerScreen";

export default function App() {
  const [appState, setAppState] = useState(() => {
    const saved = storage.get("staysafe_session");
    return saved ? { screen: "app", ...saved } : { screen: "login" };
  });

  function handleLogin(data) {
    // If user has no profiles, go to profile creation
    if (!data.profiles || data.profiles.length === 0) {
      setAppState({ screen: "create_profile", user: data.user, profiles: [] });
    } else {
      setAppState({ screen: "select_profile", user: data.user, profiles: data.profiles });
    }
  }

  function handleGoToRegister() {
    setAppState({ screen: "register" });
  }

  function handleRegisterSuccess() {
    setAppState({ screen: "login" });
  }

  function handleProfileCreated(newProfile) {
    // Add new profile to the list and go to profile selection
    const updatedProfiles = [...(appState.profiles || []), newProfile];
    setAppState(prev => ({
      ...prev,
      screen: "select_profile",
      profiles: updatedProfiles,
    }));
  }

  function handleGoToCreateProfile() {
    setAppState(prev => ({ ...prev, screen: "create_profile" }));
  }

  function handleProfileSelected(profile, authData) {
    const session = {
      token: authData.accessToken,
      refreshToken: authData.refreshToken,
      profile,
      dependents: authData.dependents || [],
    };
    if (profile.role === "dependent") {
      storage.set("staysafe_session", session);
    }
    setAppState({ screen: "app", ...session });
  }

  function handleLogout() {
    storage.remove("staysafe_session");
    setAppState({ screen: "login" });
  }

  if (appState.screen === "register") {
    return (
      <RegisterScreen
        onSuccess={handleRegisterSuccess}
        onBack={() => setAppState({ screen: "login" })}
      />
    );
  }

  if (appState.screen === "login") {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={handleGoToRegister}
      />
    );
  }

  if (appState.screen === "create_profile") {
    return (
      <CreateProfileScreen
        user={appState.user}
        onCreated={handleProfileCreated}
        onLogout={handleLogout}
      />
    );
  }

  if (appState.screen === "select_profile") {
    return (
      <ProfileSelectScreen
        user={appState.user}
        profiles={appState.profiles}
        onSelect={handleProfileSelected}
        onCreateProfile={handleGoToCreateProfile}
      />
    );
  }

  if (appState.profile?.role === "dependent") {
    return (
      <DependentScreen
        session={{ token: appState.token, profile: appState.profile }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CarerScreen
      session={{ token: appState.token, profile: appState.profile }}
      dependents={appState.dependents}
      onLogout={handleLogout}
    />
  );
}
