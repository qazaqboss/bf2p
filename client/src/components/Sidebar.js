export default {
  props: ['page', 'user'],
  emits: ['navigate', 'logout'],
  template: `
    <aside style="width:240px;min-width:240px;background:#0f172a;display:flex;flex-direction:column;height:100vh;position:sticky;top:0;overflow-y:auto">
      <div style="padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,.07)">
        <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:-.02em">Swiss Factoring</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">Platform v2.0</div>
      </div>

      <nav style="padding:12px 8px;flex:1">
        <div style="font-size:10px;font-weight:700;color:#475569;letter-spacing:.08em;text-transform:uppercase;padding:8px 8px 4px">Главное</div>
        <a class="sidebar-link" :class="{active:page==='dashboard'}" @click="$emit('navigate','dashboard')">
          <span>📊</span> Дашборд
        </a>
        <a class="sidebar-link" :class="{active:page==='svod'}" @click="$emit('navigate','svod')">
          <span>📋</span> Свод
        </a>
        <a class="sidebar-link" :class="{active:page==='financings'}" @click="$emit('navigate','financings')">
          <span>💼</span> Финансирования
        </a>
        <a class="sidebar-link" :class="{active:page==='new-financing'}" @click="$emit('navigate','new-financing')">
          <span>➕</span> Новое финансирование
        </a>

        <div style="font-size:10px;font-weight:700;color:#475569;letter-spacing:.08em;text-transform:uppercase;padding:16px 8px 4px">Учёт</div>
        <a class="sidebar-link" :class="{active:page==='payments'}" @click="$emit('navigate','payments')">
          <span>💳</span> Платежи
        </a>
        <a class="sidebar-link" :class="{active:page==='analytics'}" @click="$emit('navigate','analytics')">
          <span>📈</span> Аналитика
        </a>

        <div style="font-size:10px;font-weight:700;color:#475569;letter-spacing:.08em;text-transform:uppercase;padding:16px 8px 4px">Справочники</div>
        <a class="sidebar-link" :class="{active:page==='clients'}" @click="$emit('navigate','clients')">
          <span>🏢</span> Клиенты
        </a>
        <a class="sidebar-link" :class="{active:page==='debtors'}" @click="$emit('navigate','debtors')">
          <span>🏭</span> Дебиторы
        </a>
        <a class="sidebar-link" :class="{active:page==='tariffs'}" @click="$emit('navigate','tariffs')">
          <span>📜</span> Тарифные планы
        </a>
      </nav>

      <div style="padding:12px 8px;border-top:1px solid rgba(255,255,255,.07)">
        <div style="display:flex;align-items:center;gap:10px;padding:8px">
          <div style="width:32px;height:32px;background:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;flex-shrink:0">
            {{user?.name?.[0] || 'U'}}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{user?.name}}</div>
            <div style="font-size:11px;color:#64748b">{{user?.role}}</div>
          </div>
          <button @click="$emit('logout')" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;padding:4px" title="Выйти">↪</button>
        </div>
      </div>
    </aside>
  `
};
