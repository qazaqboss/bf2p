import { api } from '../api.js';
import { debounce } from '../utils.js';

export default {
  emits: ['navigate'],
  setup(props, { emit }) {
    const { ref, onMounted, watch } = Vue;
    const rows = ref([]);
    const loading = ref(true);
    const search = ref('');
    const showModal = ref(false);
    const form = ref({ name: '', bin: '', legal_form: 'ТОО', status: 'active', manager: '', phone: '', email: '' });
    const msg = ref('');

    const load = async () => {
      loading.value = true;
      try {
        const q = {};
        if (search.value) q.search = search.value;
        rows.value = await api.clients(q);
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const submit = async () => {
      try {
        await api.createClient(form.value);
        showModal.value = false;
        form.value = { name: '', bin: '', legal_form: 'ТОО', status: 'active', manager: '', phone: '', email: '' };
        await load();
      } catch (e) { msg.value = e.message; }
    };

    const dl = debounce(load, 300);
    onMounted(load);
    watch(search, dl);

    const statusColors = { active: 'tag-green', on_review: 'tag-amber', frozen: 'tag-red', closed: 'tag-gray' };
    const statusNames = { active: 'Активный', on_review: 'На проверке', frozen: 'Заморожен', closed: 'Закрыт' };

    return { rows, loading, search, showModal, form, msg, submit, statusColors, statusNames };
  },
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h1 style="font-size:22px;font-weight:700;color:#111827">Клиенты (поставщики)</h1>
        <button class="btn btn-primary" @click="showModal=true">+ Добавить клиента</button>
      </div>

      <input class="inp" v-model="search" placeholder="Поиск по названию или БИН..." style="max-width:360px;margin-bottom:16px">

      <div class="card" style="overflow:hidden">
        <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>
        <div v-else-if="!rows.length" style="text-align:center;padding:40px;color:#6b7280">Клиенты не найдены</div>
        <table v-else style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th">Название</th><th class="th">БИН</th>
            <th class="th">Форма</th><th class="th">Менеджер</th>
            <th class="th">Телефон</th><th class="th">Статус</th>
          </tr></thead>
          <tbody>
            <tr v-for="c in rows" :key="c.id">
              <td class="td" style="font-weight:600">{{c.name}}</td>
              <td class="td" style="font-family:monospace;font-size:13px">{{c.bin}}</td>
              <td class="td">{{c.legal_form}}</td>
              <td class="td">{{c.manager || '—'}}</td>
              <td class="td">{{c.phone || '—'}}</td>
              <td class="td"><span :class="'tag ' + statusColors[c.status]">{{statusNames[c.status]}}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
        <div class="modal" style="max-width:500px">
          <div style="padding:20px;border-bottom:1px solid #e5e7eb">
            <h3 style="font-size:16px;font-weight:700">Новый клиент</h3>
          </div>
          <div style="padding:20px">
            <div v-if="msg" class="alert alert-error">{{msg}}</div>
            <div class="form-grid form-grid-2">
              <div style="grid-column:1/-1">
                <label class="lbl">Название *</label>
                <input class="inp" v-model="form.name" placeholder="ТОО «...»">
              </div>
              <div>
                <label class="lbl">БИН *</label>
                <input class="inp" v-model="form.bin" placeholder="123456789012" maxlength="12">
              </div>
              <div>
                <label class="lbl">Правовая форма</label>
                <select class="sel" v-model="form.legal_form">
                  <option>ТОО</option><option>АО</option><option>ИП</option><option>ГП</option>
                </select>
              </div>
              <div>
                <label class="lbl">Менеджер</label>
                <input class="inp" v-model="form.manager" placeholder="ФИО менеджера">
              </div>
              <div>
                <label class="lbl">Телефон</label>
                <input class="inp" v-model="form.phone" placeholder="+7 ...">
              </div>
              <div style="grid-column:1/-1">
                <label class="lbl">Email</label>
                <input class="inp" v-model="form.email" type="email">
              </div>
            </div>
            <div style="margin-top:16px;display:flex;gap:8px">
              <button class="btn btn-primary" @click="submit">Сохранить</button>
              <button class="btn btn-secondary" @click="showModal=false">Отмена</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
