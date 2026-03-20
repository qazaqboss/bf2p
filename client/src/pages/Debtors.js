import { api } from '../api.js';
import { fmt, ratingTag, debounce } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, watch } = Vue;
    const rows = ref([]);
    const loading = ref(true);
    const search = ref('');
    const showModal = ref(false);
    const form = ref({ name: '', bin: '', rating: 'B', credit_limit: '', industry: '', notification_signed: false });
    const msg = ref('');

    const load = async () => {
      loading.value = true;
      try { rows.value = await api.debtors(search.value ? { search: search.value } : {}); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const submit = async () => {
      try {
        await api.createDebtor({ ...form.value, credit_limit: parseFloat(form.value.credit_limit) || 0, notification_signed: form.value.notification_signed ? 1 : 0 });
        showModal.value = false;
        form.value = { name: '', bin: '', rating: 'B', credit_limit: '', industry: '', notification_signed: false };
        await load();
      } catch (e) { msg.value = e.message; }
    };

    onMounted(load);
    watch(search, debounce(load, 300));

    return { rows, loading, search, showModal, form, msg, submit, fmt, ratingTag };
  },
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h1 style="font-size:22px;font-weight:700;color:#111827">Дебиторы</h1>
        <button class="btn btn-primary" @click="showModal=true">+ Добавить дебитора</button>
      </div>

      <input class="inp" v-model="search" placeholder="Поиск по названию или БИН..." style="max-width:360px;margin-bottom:16px">

      <div class="card" style="overflow:hidden">
        <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>
        <table v-else style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th">Название</th><th class="th">БИН</th>
            <th class="th">Рейтинг</th><th class="th">Кред. лимит</th>
            <th class="th">Отрасль</th><th class="th">Уведомление</th>
          </tr></thead>
          <tbody>
            <tr v-for="d in rows" :key="d.id">
              <td class="td" style="font-weight:600">{{d.name}}</td>
              <td class="td" style="font-family:monospace;font-size:13px">{{d.bin}}</td>
              <td class="td"><span :class="'tag ' + ratingTag(d.rating)">{{d.rating}}</span></td>
              <td class="td" style="text-align:right">{{fmt(d.credit_limit, true)}}</td>
              <td class="td">{{d.industry || '—'}}</td>
              <td class="td"><span :class="'tag ' + (d.notification_signed ? 'tag-green' : 'tag-gray')">{{d.notification_signed ? 'Подписано' : 'Нет'}}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
        <div class="modal" style="max-width:480px">
          <div style="padding:20px;border-bottom:1px solid #e5e7eb">
            <h3 style="font-size:16px;font-weight:700">Новый дебитор</h3>
          </div>
          <div style="padding:20px">
            <div v-if="msg" class="alert alert-error">{{msg}}</div>
            <div class="form-grid form-grid-2">
              <div style="grid-column:1/-1">
                <label class="lbl">Название *</label>
                <input class="inp" v-model="form.name">
              </div>
              <div>
                <label class="lbl">БИН *</label>
                <input class="inp" v-model="form.bin" maxlength="12">
              </div>
              <div>
                <label class="lbl">Рейтинг</label>
                <select class="sel" v-model="form.rating">
                  <option>A</option><option>B</option><option>C</option><option>D</option>
                </select>
              </div>
              <div>
                <label class="lbl">Кредитный лимит, ₸</label>
                <input type="number" class="inp" v-model="form.credit_limit">
              </div>
              <div>
                <label class="lbl">Отрасль</label>
                <input class="inp" v-model="form.industry">
              </div>
              <div style="grid-column:1/-1">
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer">
                  <input type="checkbox" v-model="form.notification_signed">
                  Уведомление об уступке подписано
                </label>
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
