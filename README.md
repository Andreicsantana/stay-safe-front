# 📱 Front-end — Sistema de Alertas para Dependentes

Interface do sistema de monitoramento e alertas de emergência para cuidadores e dependentes.

O projeto é multiplataforma, composto por:

* Aplicativo mobile desenvolvido com React Native e Expo;
* Interface web desenvolvida com React e Vite;
* Integração com a mesma API REST responsável pela autenticação, gerenciamento de perfis e emissão de alertas.

---

## 📐 Arquitetura Geral

```text
┌─────────────────────────────┐
│     Aplicativo Mobile       │
│   React Native + Expo       │
└──────────────┬──────────────┘
               │
               │ HTTP/HTTPS
               ▼
┌─────────────────────────────┐
│          API REST           │
│      Node.js + Express      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   PostgreSQL (Supabase)     │
└─────────────────────────────┘

┌─────────────────────────────┐
│      Interface Web          │
│        React + Vite         │
└──────────────┬──────────────┘
               │
               └──────► API REST
```

---

## ✨ Funcionalidades

* Autenticação de usuários
* Controle de sessão via JWT
* Emissão de alertas de emergência
* Captura de localização GPS
* Consulta de histórico de alertas
* Reconhecimento e resolução de alertas
* Interface específica para cuidadores e dependentes
* Consumo centralizado da API

---

## 🛠️ Tecnologias

### React

Biblioteca utilizada para construção da interface web.

```jsx
// components/AlertCard.jsx
import { useState } from 'react';

export function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="alert-card">
      <h3>{alert.address || 'Localização desconhecida'}</h3>

      <span className={`badge badge--${alert.status}`}>
        {alert.status}
      </span>

      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Menos detalhes' : 'Ver detalhes'}
      </button>

      {expanded && <p>{alert.notes}</p>}
    </div>
  );
}
```

---

### Vite

Ferramenta utilizada para desenvolvimento e build da aplicação web.

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Visualização local do build
npm run preview
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
```

---

### React Router

Gerenciamento de rotas da aplicação web.

```jsx
// App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AlertDetail } from './pages/AlertDetail';
import { PrivateRoute } from './components/PrivateRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route element={<PrivateRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/alerts/:id"
            element={<AlertDetail />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

```jsx
// components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PrivateRoute() {
  const { token } = useAuth();

  return token
    ? <Outlet />
    : <Navigate to="/login" />;
}
```

---

### React Native + Expo

Framework utilizado para desenvolvimento do aplicativo mobile.

```jsx
// screens/HomeScreen.jsx
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

export function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Sistema de Alertas
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('EmitAlert')
        }
      >
        <Text style={styles.buttonText}>
          🚨 Emitir Alerta
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24
  },

  button: {
    backgroundColor: '#E53E3E',
    padding: 16,
    borderRadius: 8
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
```

```bash
# Expo Go
npx expo start

# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

### Expo Location

Biblioteca utilizada para obtenção da localização GPS do dispositivo.

```jsx
import * as Location from 'expo-location';

const emitAlert = async () => {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    alert('Permissão de localização negada.');
    return;
  }

  const location =
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

  await fetch('/api/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    })
  });
};
```

---

### Comunicação com a API

Toda comunicação com o back-end é realizada através do `fetch`.

```js
// lib/api.js
const BASE_URL =
  import.meta.env.VITE_API_URL;

export const api = {
  async get(path, token) {
    const res = await fetch(
      `${BASE_URL}${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  },

  async post(path, body, token) {
    const res = await fetch(
      `${BASE_URL}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            Authorization: `Bearer ${token}`
          })
        },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  }
};
```

---

## 🔐 Variáveis de Ambiente

### Web

```env
VITE_API_URL=https://sua-api.onrender.com
```

### Mobile

```env
EXPO_PUBLIC_API_URL=https://sua-api.onrender.com
```

---

## 🚀 Como Executar

### Web

```bash
npm install

cp .env.example .env

npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

### Mobile

```bash
npm install

cp .env.example .env

npx expo start
```

Após iniciar o Expo, escaneie o QR Code utilizando o aplicativo Expo Go.

---

## ☁️ Deploy

### Vercel (Web)

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Características:

* Deploy automático via GitHub
* Configuração de variáveis de ambiente pelo painel
* Hospedagem estática da aplicação web

---

## 👥 Perfis de Usuário

| Perfil    | Responsabilidades                              |
| --------- | ---------------------------------------------- |
| carer     | Receber, reconhecer e resolver alertas         |
| dependent | Emitir alertas e consultar o próprio histórico |

---

## 📁 Estrutura do Projeto

### Web

```text
front/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── index.html
└── vite.config.js
```

### Mobile

```text
mobile/
├── app/
│   ├── (tabs)/
│   └── alert/
├── components/
├── hooks/
├── lib/
├── .env.example
└── app.json
```
