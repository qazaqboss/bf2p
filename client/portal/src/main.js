import { api } from './api.js';
import Dashboard from './pages/Dashboard.js';
import MyFinancings from './pages/MyFinancings.js';
import FinancingDetail from './pages/FinancingDetail.js';
import NewRequest from './pages/NewRequest.js';
import HowItWorks from './pages/HowItWorks.js';

const { createApp, ref, computed, onMounted, shallowRef } = Vue;

// Demo accounts table (shown on login screen)
const DEMO_ACCOUNTS = [
  { name: 'ТОО «Гранат»', email: 'granit@swiss.kz' },
  { name: 'ТОО «Aurora»', email: 'aurora@swiss.kz' },
  { name: 'ТОО «КомпИнвестСтр»', email: 'kompinvest@swiss.kz' },
  { name: 'ТОО «Контроль-Сервис»', email: 'kontrol@swiss.kz' },
  { name: 'ТОО «КазМет»', email: 'kazmet@swiss.kz' },
];

const NAV = [
  { id: 'dashboard',   label: 'Главная',          icon: '🏠' },
  { id: 'financings',  label: 'Мои финансирования', icon: '📋' },
  { id: 'request',     label: 'Подать заявку',      icon: '➕' },
  { id: 'howto',       label: 'Как это работает',   icon: '❓' },
];

const App = {
  setup() {
    const authed = ref(!!localStorage.getItem('cl_token'));
    const sidebarOpen = ref(false);
    const page = ref('dashboard');
    const detailId = ref(null);
    const user = ref(null);
    const clientProfile = ref(null);

    // Login form
    const loginEmail = ref('granit@swiss.kz');
    const loginPassword = ref('password');
    const loginError = ref('');
    const loginLoading = ref(false);

    const login = async () => {
      loginError.value = '';
      loginLoading.value = true;
      try {
        const r = await api.login(loginEmail.value, loginPassword.value);
        if (r.user.role !== 'client' && r.user.role !== 'admin') {
          loginError.value = 'Этот портал только для клиентов';
          return;
        }
        localStorage.setItem('cl_token', r.token);
        authed.value = true;
        user.value = r.user;
        try { clientProfile.value = await api.profile(); } catch {}
      } catch (e) {
        loginError.value = e.message || 'Неверный логин или пароль';
      } finally {
        loginLoading.value = false;
      }
    };

    const logout = () => {
      localStorage.removeItem('cl_token');
      authed.value = false;
      user.value = null;
      clientProfile.value = null;
      page.value = 'dashboard';
    };

    const navigate = (id) => {
      page.value = id;
      detailId.value = null;
      sidebarOpen.value = false;
    };

    const openDetail = (id) => {
      detailId.value = id;
      page.value = 'detail';
      sidebarOpen.value = false;
    };

    const backToList = () => {
      detailId.value = null;
      page.value = 'financings';
    };

    onMounted(async () => {
      if (authed.value) {
        try {
          user.value = await api.me();
          clientProfile.value = await api.profile();
        } catch { logout(); }
      }
    });

    const clientName = computed(() => clientProfile.value?.client?.name || user.value?.name || 'Клиент');
    const clientInitial = computed(() => {
      const n = clientProfile.value?.client?.name || user.value?.name || 'К';
      return n[0].toUpperCase();
    });

    return {
      authed, sidebarOpen, page, detailId, user, clientProfile, clientName, clientInitial,
      loginEmail, loginPassword, loginError, loginLoading,
      login, logout, navigate, openDetail, backToList,
      NAV, DEMO_ACCOUNTS,
      Dashboard, MyFinancings, FinancingDetail, NewRequest, HowItWorks,
    };
  },
  template: `
    <!-- Login -->
    <div v-if="!authed" style="min-height:100vh;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 50%,#e0f2fe 100%);display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:900px;width:100%;align-items:center">
        <!-- Left: branding -->
        <div style="padding:20px">
          <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:32px">
            <div style="width:52px;height:52px;background:linear-gradient(135deg,#1d4ed8,#2563eb);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;box-shadow:0 8px 24px rgba(37,99,235,.3)">SF</div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#0f172a">Swiss Factoring</div>
              <div style="font-size:13px;color:#64748b">Кабинет клиента</div>
            </div>
          </div>
          <h1 style="font-size:32px;font-weight:900;color:#0f172a;line-height:1.2;margin-bottom:16px">
            Управляйте факторингом<br>в одном месте
          </h1>
          <p style="font-size:15px;color:#64748b;line-height:1.7;margin-bottom:32px">
            Отслеживайте активные финансирования, подавайте заявки, следите за комиссиями и получайте уведомления о платежах.
          </p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div v-for="f in ['📋 Все ваши финансирования в реальном времени','➕ Подача заявки онлайн за 5 минут','💰 История платежей и комиссий','❓ Подробный справочник по факторингу']" :key="f" style="display:flex;align-items:center;gap:10px;font-size:14px;color:#374151">
              <span style="color:#22c55e;font-weight:700">✓</span> {{f}}
            </div>
          </div>
        </div>

        <!-- Right: login form -->
        <div style="background:#fff;border-radius:20px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,.1)">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:8px">Войти в кабинет</h2>
          <p style="font-size:13px;color:#64748b;margin-bottom:24px">Введите ваш email и пароль</p>

          <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Email</label>
            <select v-model="loginEmail" style="width:100%;padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none;background:#fff;cursor:pointer;margin-bottom:6px">
              <option v-for="a in DEMO_ACCOUNTS" :key="a.email" :value="a.email">{{a.name}} ({{a.email}})</option>
            </select>
            <input v-model="loginEmail" type="email" @keyup.enter="login"
              style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;outline:none;color:#64748b"
              placeholder="или введите вручную"/>
          </div>

          <div style="margin-bottom:24px">
            <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Пароль</label>
            <input v-model="loginPassword" type="password" @keyup.enter="login"
              style="width:100%;padding:11px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none"
              placeholder="••••••••"/>
          </div>

          <div v-if="loginError" style="padding:10px 14px;background:#fee2e2;border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:16px">{{loginError}}</div>

          <button @click="login" :disabled="loginLoading"
            style="width:100%;padding:13px;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,.3);transition:opacity .15s"
            :style="{opacity: loginLoading ? .7 : 1}">
            {{loginLoading ? 'Входим...' : 'Войти'}}
          </button>

          <div style="margin-top:20px;padding:14px;background:#f8fafc;border-radius:10px;font-size:12px;color:#64748b">
            <strong style="color:#374151">Тестовый пароль для всех аккаунтов:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px">password</code>
          </div>
        </div>
      </div>
    </div>

    <!-- App -->
    <div v-else style="display:flex;min-height:100vh">
      <!-- Overlay -->
      <div :class="['sidebar-overlay', sidebarOpen ? 'open' : '']" @click="sidebarOpen=false"></div>

      <!-- Sidebar -->
      <nav :class="['cl-sidebar', sidebarOpen ? 'is-open' : '']">
        <!-- Logo -->
        <div class="cl-logo-bar">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:15px;flex-shrink:0">SF</div>
            <div>
              <div style="color:#0f172a;font-weight:800;font-size:15px">Swiss Factoring</div>
              <div style="color:#94a3b8;font-size:11px">Кабинет клиента</div>
            </div>
          </div>
        </div>

        <!-- Client info -->
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0">{{clientInitial}}</div>
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{clientName}}</div>
              <div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{user?.email || ''}}</div>
            </div>
          </div>
        </div>

        <!-- Nav -->
        <div style="flex:1;padding:12px 0">
          <div class="cl-nav-section">Меню</div>
          <button v-for="n in NAV" :key="n.id"
            :class="['cl-nav-link', page===n.id ? 'active' : '']"
            @click="navigate(n.id)">
            <span class="ni">{{n.icon}}</span>
            {{n.label}}
            <span v-if="n.id==='request'" style="margin-left:auto;background:#2563eb;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">NEW</span>
          </button>
        </div>

        <!-- Bottom -->
        <div style="padding:16px 20px;border-top:1px solid #f1f5f9">
          <div v-if="clientProfile?.agreement" style="padding:12px;background:#f0f6ff;border-radius:10px;margin-bottom:12px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8">Договор</div>
            <div style="font-size:13px;font-weight:700;color:#2563eb;margin-top:2px">{{clientProfile.agreement.number}}</div>
            <div style="font-size:11px;color:#64748b;margin-top:1px">{{clientProfile.agreement.tariff_name}}</div>
          </div>
          <button @click="logout" style="width:100%;padding:9px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s">
            Выйти
          </button>
        </div>
      </nav>

      <!-- Spacer -->
      <div style="width:270px;min-width:270px;flex-shrink:0" class="sidebar-spacer"></div>

      <!-- Main -->
      <div style="flex:1;min-width:0;display:flex;flex-direction:column">
        <!-- Mobile topbar -->
        <div class="mob-topbar">
          <button style="background:none;border:none;cursor:pointer;font-size:22px;color:#374151" @click="sidebarOpen=true">☰</button>
          <span style="color:#0f172a;font-weight:700;font-size:15px">Swiss Factoring</span>
        </div>

        <main style="flex:1;padding:32px;max-width:1200px;width:100%">
          <!-- Pages -->
          <component v-if="page==='dashboard'" :is="Dashboard" />
          <component v-else-if="page==='financings'" :is="MyFinancings" @detail="openDetail" />
          <component v-else-if="page==='detail' && detailId" :is="FinancingDetail" :fin-id="detailId" @back="backToList" />
          <component v-else-if="page==='request'" :is="NewRequest" />
          <component v-else-if="page==='howto'" :is="HowItWorks" />
        </main>
      </div>
    </div>
  `
};

createApp(App).mount('#cl-app');
