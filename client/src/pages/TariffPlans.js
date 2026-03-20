import { api } from '../api.js';
import { fmtPct } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, computed } = Vue;
    const tariffs = ref([]);
    const loading = ref(true);
    const seriesFilter = ref('');

    onMounted(async () => {
      try { tariffs.value = await api.tariffs(); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });

    const filtered = computed(() =>
      seriesFilter.value ? tariffs.value.filter(t => t.series === seriesFilter.value) : tariffs.value
    );

    const seriesColors = { F1:'tag-blue', F2:'tag-violet', F3:'tag-green', F4:'tag-amber', F5:'tag-red', F6:'tag-gray' };

    return { filtered, loading, seriesFilter, fmtPct, seriesColors };
  },
  template: `
    <div>
      <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:20px">Тарифные планы</h1>

      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button v-for="s in ['','F1','F2','F4','F5','F6']" :key="s"
                @click="seriesFilter=s"
                :class="seriesFilter===s ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'">
          {{s || 'Все'}}
        </button>
      </div>

      <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>

      <div class="card" style="overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th">Название</th>
            <th class="th">Серия</th>
            <th class="th">K1% год</th>
            <th class="th">K2: 0-30 дн</th>
            <th class="th">K2: 30-60</th>
            <th class="th">K2: 60-90</th>
            <th class="th">K2: 90-120</th>
            <th class="th">K2: 120+</th>
            <th class="th">K3: 22-90</th>
          </tr></thead>
          <tbody>
            <tr v-for="t in filtered" :key="t.id">
              <td class="td" style="font-weight:600">{{t.name}}</td>
              <td class="td"><span :class="'tag ' + seriesColors[t.series]">{{t.series}}</span></td>
              <td class="td" style="text-align:right;font-weight:700;color:#15803d">{{(t.k1_rate*100).toFixed(3)}}%</td>
              <td class="td" style="text-align:right">{{t.k2_rate_0_30 != null ? t.k2_rate_0_30.toFixed(3)+'%' : '—'}}</td>
              <td class="td" style="text-align:right">{{t.k2_rate_30_60 != null ? t.k2_rate_30_60.toFixed(3)+'%' : '—'}}</td>
              <td class="td" style="text-align:right">{{t.k2_rate_60_90 != null ? t.k2_rate_60_90.toFixed(3)+'%' : '—'}}</td>
              <td class="td" style="text-align:right">{{t.k2_rate_90_120 != null ? t.k2_rate_90_120.toFixed(3)+'%' : '—'}}</td>
              <td class="td" style="text-align:right">{{t.k2_rate_120plus != null ? t.k2_rate_120plus.toFixed(3)+'%' : '—'}}</td>
              <td class="td" style="text-align:right">{{t.k3_rate_22_90 > 0 ? t.k3_rate_22_90.toFixed(3)+'%' : '—'}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
};
