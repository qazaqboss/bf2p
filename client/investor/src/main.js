import { api } from './api.js';
import Overview from './pages/Overview.js';
import Portfolio from './pages/Portfolio.js';
import Returns from './pages/Returns.js';
import Deals from './pages/Deals.js';
import Risk from './pages/Risk.js';

const { createApp, ref, computed, onMounted } = Vue;

const NAV = [
  { id: 'overview',  label: 'Обзор',       icon: '◎' },
  { id: 'portfolio', label: 'Портфель',     icon: '⬡' },
  { id: 'returns',   label: 'Доходность',   icon: '↗' },
  { id: 'deals',     label: 'Сделки',       icon: '≡' },
  { id: 'risk',      label: 'Риски',        icon: '⚠' },
];

const PAGES = { overview: Overview, portfolio: Portfolio, returns: Returns, deals: Deals, risk: Risk };

const App = {
  setup() {
    const token = localStorage.getItem('inv_token');
    const authed = ref(!!token);
    const page = ref('overview');
    const sidebarOpen = ref(false);
    const loginEmail = ref('investor@swiss.kz');
    const loginPassword = ref('');
    const loginError = ref('');
    const loginLoading = ref(false);
    const user = ref(null);

    const currentPage = computed(() => PAGES[page.value] || Overview);

    const login = async () => {
      loginError.value = '';
      loginLoading.value = true;
      try {
        const r = await api.login(loginEmail.value, loginPassword.value);
        localStorage.setItem('inv_token', r.token);
        authed.value = true;
        const me = await api.me();
        user.value = me;
      } catch (e) {
        loginError.value = e.message || 'Неверный логин или пароль';
      } finally {
        loginLoading.value = false;
      }
    };

    const logout = () => {
      localStorage.removeItem('inv_token');
      authed.value = false;
      user.value = null;
    };

    const navigate = (id) => {
      page.value = id;
      sidebarOpen.value = false;
    };

    onMounted(async () => {
      if (authed.value) {
        try { user.value = await api.me(); } catch { logout(); }
      }
    });

    return { authed, page, sidebarOpen, loginEmail, loginPassword, loginError, loginLoading, user, login, logout, navigate, NAV, currentPage };
  },
  template: `
    <!-- Login screen -->
    <div v-if="!authed" style="min-height:100vh;background:linear-gradient(135deg,#0a1628 0%,#0d2444 60%,#1e3a5f 100%);display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:#fff;border-radius:20px;padding:48px 40px;width:100%;max-width:420px;box-shadow:0 25px 60px rgba(0,0,0,.4)">
        <!-- Logo -->
        <div style="text-align:center;margin-bottom:36px">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(135deg,#1d4ed8,#2563eb);border-radius:16px;margin-bottom:16px">
            <span style="color:#fff;font-size:28px;font-weight:900">SF</span>
          </div>
          <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0">Swiss Factoring</h1>
          <p style="color:#64748b;font-size:14px;margin-top:6px">Портал инвестора</p>
        </div>

        <div style="margin-bottom:18px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Email</label>
          <input v-model="loginEmail" type="email" @keyup.enter="login"
            style="width:100%;padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none;transition:border .15s"
            placeholder="investor@swiss.kz"/>
        </div>
        <div style="margin-bottom:24px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Пароль</label>
          <input v-model="loginPassword" type="password" @keyup.enter="login"
            style="width:100%;padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none"
            placeholder="••••••••"/>
        </div>

        <div v-if="loginError" style="margin-bottom:16px;padding:10px 14px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:13px">
          {{loginError}}
        </div>

        <button @click="login" :disabled="loginLoading"
          style="width:100%;padding:13px;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s"
          :style="{opacity: loginLoading ? .7 : 1}">
          {{loginLoading ? 'Входим...' : 'Войти'}}
        </button>

        <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:24px">
          Swiss Factoring Platform © 2026
        </p>
      </div>
    </div>

    <!-- Authenticated layout -->
    <div v-else style="display:flex;min-height:100vh">
      <!-- Overlay -->
      <div :class="['sidebar-overlay', sidebarOpen ? 'open' : '']" @click="sidebarOpen=false"></div>

      <!-- Sidebar -->
      <nav :class="['inv-sidebar', sidebarOpen ? 'is-open' : '']">
        <!-- Logo -->
        <div style="padding:28px 24px 20px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:15px;flex-shrink:0">SF</div>
            <div>
              <div style="color:#fff;font-weight:800;font-size:15px;line-height:1.2">Swiss Factoring</div>
              <div style="color:#64748b;font-size:11px">Инвестор-портал</div>
            </div>
          </div>
        </div>

        <!-- Nav -->
        <div style="flex:1;padding:8px 0">
          <button v-for="n in NAV" :key="n.id"
            :class="['inv-nav-link', page===n.id ? 'active' : '']"
            @click="navigate(n.id)">
            <span style="font-size:18px;width:20px;text-align:center;flex-shrink:0">{{n.icon}}</span>
            {{n.label}}
          </button>
        </div>

        <!-- User footer -->
        <div style="padding:16px 24px;border-top:1px solid rgba(255,255,255,.07)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <div style="width:34px;height:34px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0">
              {{user?.name ? user.name[0].toUpperCase() : 'И'}}
            </div>
            <div style="min-width:0">
              <div style="color:#e2e8f0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{user?.name || 'Инвестор'}}</div>
              <div style="color:#64748b;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{user?.email || ''}}</div>
            </div>
          </div>
          <button @click="logout"
            style="width:100%;padding:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;font-size:13px;cursor:pointer;transition:all .15s">
            Выйти
          </button>
        </div>
      </nav>

      <!-- Sidebar spacer (desktop) -->
      <div style="width:260px;min-width:260px;flex-shrink:0" class="sidebar-spacer"></div>

      <!-- Main -->
      <div style="flex:1;min-width:0;display:flex;flex-direction:column">
        <!-- Mobile topbar -->
        <div class="mob-topbar">
          <button class="hamburger-inv" @click="sidebarOpen=true">☰</button>
          <span style="color:#fff;font-weight:700;font-size:15px">Swiss Factoring</span>
        </div>

        <main style="flex:1;padding:32px;max-width:1200px;width:100%">
          <component :is="currentPage" />
        </main>
      </div>
    </div>
  `
};

createApp(App).mount('#inv-app');
