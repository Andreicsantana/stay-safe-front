import { useState, useCallback, useEffect } from "react";
import { storage } from "./services/storage";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ProfileSelectScreen from "./screens/ProfileSelectScreen";
import CreateProfileScreen from "./screens/CreateProfileScreen";
import DependentScreen from "./screens/DependentScreen";
import CarerScreen from "./screens/CarerScreen";

const SESSION_KEY = "staysafe_session";

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export default function App() {
  const [appState, setAppState] = useState(() => {
    const saved = storage.get(SESSION_KEY);
    if (!saved) return { screen: "login", notice: "" };
    if (isTokenExpired(saved.token)) {
      storage.remove(SESSION_KEY);
      return {
        screen: "login",
        notice: "Sua sessão expirou. Faça login novamente para continuar.",
      };
    }
    return { screen: "app", ...saved };
  });

  useEffect(() => {
    const handlePopState = () => {
      setAppState((prev) => {
        if (prev.screen === "register") return { screen: "login", notice: "" };
        if (prev.screen === "create_profile" && prev.profiles?.length > 0) {
          return { ...prev, screen: "select_profile" };
        }
        return prev;
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = (data) => {
    if (!data.profiles || data.profiles.length === 0) {
      setAppState({
        screen: "create_profile",
        accountToken: data.accountToken,
        user: data.user,
        profiles: [],
        notice: "",
      });
    } else {
      setAppState({
        screen: "select_profile",
        accountToken: data.accountToken,
        user: data.user,
        profiles: data.profiles,
        notice: "",
      });
    }
  };

  const handleGoToRegister = () => {
    window.history.pushState({ screen: "register" }, "");
    setAppState({ screen: "register", notice: "" });
  };

  const handleRegisterSuccess = () => {
    setAppState({ screen: "login", notice: "" });
  };

  const handleProfileCreated = (newProfile) => {
    const updatedProfiles = [...(appState.profiles || []), newProfile];
    setAppState((prev) => ({
      ...prev,
      screen: "select_profile",
      profiles: updatedProfiles,
    }));
  };

  const handleGoToCreateProfile = () => {
    window.history.pushState({ screen: "create_profile" }, "");
    setAppState((prev) => ({ ...prev, screen: "create_profile" }));
  };

  const handleProfileSelected = (profile, authData) => {
    const session = {
      token: authData.accessToken,
      refreshToken: authData.refreshToken,
      accountToken: appState.accountToken || authData.accessToken,
      profile,
      user: appState.user,
      profiles: appState.profiles,
      dependents: authData.dependents || [],
    };
    storage.set(SESSION_KEY, session);
    setAppState((prev) => ({
      ...prev,
      screen: "app",
      ...session,
    }));
  };

  const handleBackToProfiles = () => {
    if (!appState.user || !appState.profiles) {
      storage.remove(SESSION_KEY);
      setAppState({ screen: "login", notice: "" });
      return;
    }
    setAppState((prev) => ({
      ...prev,
      screen: "select_profile",
    }));
  };

  const handleLogout = useCallback(() => {
    storage.remove(SESSION_KEY);
    setAppState({ screen: "login", notice: "" });
  }, []);

  const handleSessionExpired = useCallback(() => {
    storage.remove(SESSION_KEY);
    setAppState({
      screen: "login",
      notice: "Sua sessão expirou. Faça login novamente para continuar.",
    });
  }, []);

  if (appState.screen === "register") {
    return (
      <RegisterScreen
        onSuccess={handleRegisterSuccess}
        onBack={() => setAppState({ screen: "login", notice: "" })}
      />
    );
  }

  if (appState.screen === "login") {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={handleGoToRegister}
        notice={appState.notice}
      />
    );
  }

  if (appState.screen === "create_profile") {
    return (
      <CreateProfileScreen
        user={appState.user}
        accountToken={appState.accountToken}
        onCreated={handleProfileCreated}
        onLogout={handleLogout}
      />
    );
  }

  if (appState.screen === "select_profile") {
    return (
      <ProfileSelectScreen
        user={appState.user}
        accountToken={appState.accountToken}
        profiles={appState.profiles}
        onSelect={handleProfileSelected}
        onCreateProfile={handleGoToCreateProfile}
        onLogout={handleLogout}
      />
    );
  }

  if (appState.profile?.role === "dependent") {
    return (
      <DependentScreen
        session={{ token: appState.token, profile: appState.profile }}
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  return (
    <CarerScreen
      session={{
        token: appState.token,
        profile: appState.profile,
        user: appState.user,
      }}
      onLogout={handleLogout}
      onBackToProfiles={handleBackToProfiles}
      onSessionExpired={handleSessionExpired}
    />
  );
}
