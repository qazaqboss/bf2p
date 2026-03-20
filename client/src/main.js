import { api } from './api.js';
import Sidebar from './components/Sidebar.js';
import Dashboard from './pages/Dashboard.js';
import Svod from './pages/Svod.js';
import Financings from './pages/Financings.js';
import FinancingDetail from './pages/FinancingDetail.js';
import NewFinancing from './pages/NewFinancing.js';
import Clients from './pages/Clients.js';
import Debtors from './pages/Debtors.js';
import TariffPlans from './pages/TariffPlans.js';
import Analytics from './pages/Analytics.js';
import Payments from './pages/Payments.js';

const { createApp, ref, computed } = Vue;

const LoginPage = {
  emits: ['loggedIn'],
  setup(props, { emit }) {
    const email = ref('admin@swiss.kz');
    const password = ref('password');
    const error = ref('');
    const loading = ref(false);

    const login = async () => {
      loading.value = true; error.value = '';
      try {
        const r = await api.login(email.value, password.value);
        localStorage.setItem('sf_token', r.token);
        emit('loggedIn', r.user);
      } catch (e) { error.value = e.message; }
      finally { loading.value = false; }
    };

    return { email, password, error, loading, login };
  },
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)">
      <div style="background:#fff;border-radius:20px;padding:40px;width:380px;box-shadow:0 25px 60px rgba(0,0,0,.3)">
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-.03em">Swiss Factoring</div>
          <div style="font-size:14px;color:#94a3b8;margin-top:4px">Platform v2.0</div>
        </div>

        <div v-if="error" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:14px;margin-bottom:16px">
          {{error}}
        </div>

        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Email</label>
          <input class="inp" type="email" v-model="email" @keyup.enter="login" style="font-size:15px">
        </div>

        <div style="margin-bottom:24px">
          <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Пароль</label>
          <input class="inp" type="password" v-model="password" @keyup.enter="login" style="font-size:15px">
        </div>

        <button @click="login" :disabled="loading"
                style="width:100%;background:#2563eb;color:#fff;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;transition:background .15s"
                :style="{background: loading ? '#93c5fd' : '#2563eb'}">
          <span v-if="loading">Вход...</span>
          <span v-else>Войти в систему</span>
        </button>

        <div style="margin-top:20px;text-align:center;font-size:12px;color:#94a3b8">
          Демо: admin@swiss.kz / password
        </div>
      </div>
    </div>
  `
};

const App = {
  components: { LoginPage, Sidebar, Dashboard, Svod, Financings, FinancingDetail, NewFinancing, Clients, Debtors, TariffPlans, Analytics, Payments },
  setup() {
    const user = ref(null);
    const page = ref('dashboard');
    const pageParam = ref(null);

    // Check token on load
    const token = localStorage.getItem('sf_token');
    if (token) {
      api.me().then(u => { user.value = u; }).catch(() => localStorage.removeItem('sf_token'));
    }

    const navigate = (p, param = null) => {
      page.value = p;
      pageParam.value = param;
      window.scrollTo(0, 0);
    };

    const logout = () => {
      localStorage.removeItem('sf_token');
      user.value = null;
      page.value = 'dashboard';
    };

    return { user, page, pageParam, navigate, logout };
  },
  template: `
    <login-page v-if="!user" @logged-in="user=$event; page='dashboard'" />

    <div v-else style="display:flex;min-height:100vh">
      <sidebar :page="page" :user="user" @navigate="navigate" @logout="logout" />

      <main style="flex:1;overflow-y:auto;padding:28px;max-width:100%;background:#f8fafc">
        <dashboard         v-if="page==='dashboard'"         @navigate="navigate" />
        <svod              v-else-if="page==='svod'"         @navigate="navigate" />
        <financings        v-else-if="page==='financings'"   @navigate="navigate" />
        <new-financing     v-else-if="page==='new-financing'" @navigate="navigate" />
        <financing-detail  v-else-if="page==='financing-detail'" :id="pageParam" @navigate="navigate" />
        <clients           v-else-if="page==='clients'"      @navigate="navigate" />
        <debtors           v-else-if="page==='debtors'"      @navigate="navigate" />
        <tariff-plans      v-else-if="page==='tariffs'"      @navigate="navigate" />
        <analytics         v-else-if="page==='analytics'"    @navigate="navigate" />
        <payments          v-else-if="page==='payments'"     @navigate="navigate" />
      </main>
    </div>
  `
};

createApp(App).mount('#app');
