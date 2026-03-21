'use strict';
// Генератор расширенных тестовых данных
const fs = require('fs');
const path = require('path');

const lines = [];
const add = (s) => lines.push(s);

// ── helpers ──────────────────────────────────────────────────────────────────
let idCounter = 1;
const uid = (prefix) => `${prefix}${String(idCounter++).padStart(3,'0')}`;

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function round2(n) { return Math.round(n * 100) / 100; }
function getK2Rate(series, days) {
  if (series === 'F1') return 0;
  // Оптима.F2 rates for simplicity
  const rates = {F2:[0.74,1.479,2.219,2.959,3.699],F4:[1.00,2.00,3.00,4.00,5.00],F5:[1.30,2.60,3.90,5.20,6.50],F6:[2.50,5.00,7.50,10.00,12.50]};
  const r = rates[series] || rates.F2;
  const i = days<30?0:days<60?1:days<90?2:days<120?3:4;
  return r[i];
}
function calcK1(od, rate, days, date) {
  const vat = date >= '2026-01-01' ? 0.16 : 0.12;
  const net = round2(od * rate / 365 * days);
  return { net, gross: round2(net * (1+vat)) };
}
function calcK2(docSum, series, days, date) {
  if (series === 'F1') return { net: 0, gross: 0 };
  const vat = date >= '2026-01-01' ? 0.16 : 0.12;
  const rate = getK2Rate(series, days);
  const net = round2(docSum * rate / 100);
  return { net, gross: round2(net * (1+vat)) };
}
function calcVOP(docSum, finSum, k1net, k2net) {
  return round2(docSum - finSum - k1net - k2net);
}
function q(s) { return s == null ? 'NULL' : `'${String(s).replace(/'/g,"''")}'`; }

// ── CLIENTS ──────────────────────────────────────────────────────────────────
const clients = [
  // existing
  {id:'cl01',name:'ТОО «Гранат»',           bin:'041200045678',status:'active',manager:'А.Муратов'},
  {id:'cl02',name:'ТОО «Aurora»',            bin:'041500012345',status:'active',manager:'А.Муратов'},
  {id:'cl03',name:'ТОО «КомпИнвестСтр»',    bin:'041800067890',status:'active',manager:'Б.Ержанов'},
  {id:'cl04',name:'ТОО «PolAtyrau»',         bin:'041000098765',status:'active',manager:'А.Муратов'},
  {id:'cl05',name:'ТОО «МонтСтройСп»',      bin:'041700034521',status:'active',manager:'Б.Ержанов'},
  {id:'cl06',name:'ТОО «KeyPartGr»',         bin:'041300056789',status:'active',manager:'А.Муратов'},
  // new
  {id:'cl07',name:'ТОО «Контроль-Сервис ЛТД»', bin:'050740011234',status:'active',manager:'А.Муратов'},
  {id:'cl08',name:'ТОО «АлматыТехСерв»',    bin:'061200023456',status:'active',manager:'Б.Ержанов'},
  {id:'cl09',name:'ТОО «КазМет»',           bin:'070340034567',status:'active',manager:'А.Муратов'},
  {id:'cl10',name:'ТОО «НурСтрой»',         bin:'080450045678',status:'active',manager:'Б.Ержанов'},
  {id:'cl11',name:'ТОО «ТехноПром»',        bin:'090560056789',status:'active',manager:'А.Муратов'},
  {id:'cl12',name:'АО «СтройИнвест»',       bin:'100670067890',status:'active',manager:'Б.Ержанов'},
  {id:'cl13',name:'ТОО «МегаТрейд»',        bin:'110780078901',status:'active',manager:'А.Муратов'},
  {id:'cl14',name:'ТОО «ЭнергоСистемы»',    bin:'120890089012',status:'active',manager:'Б.Ержанов'},
  {id:'cl15',name:'ТОО «АстанаМет»',        bin:'130900090123',status:'active',manager:'А.Муратов'},
  {id:'cl16',name:'ТОО «КазГазСервис»',     bin:'141010101234',status:'active',manager:'Б.Ержанов'},
  {id:'cl17',name:'ТОО «ЮжнефтеСтрой»',    bin:'151120112345',status:'active',manager:'А.Муратов'},
  {id:'cl18',name:'ТОО «АтырауСервис»',     bin:'161230123456',status:'active',manager:'Б.Ержанов'},
  {id:'cl19',name:'ТОО «КарагандаМонтаж»',  bin:'171340134567',status:'active',manager:'А.Муратов'},
  {id:'cl20',name:'ТОО «КаспийСервис»',     bin:'181450145678',status:'active',manager:'Б.Ержанов'},
  {id:'cl21',name:'ТОО «Евразия Транс»',    bin:'191560156789',status:'active',manager:'А.Муратов'},
  {id:'cl22',name:'ТОО «ПромКомплект»',     bin:'201670167890',status:'active',manager:'Б.Ержанов'},
  {id:'cl23',name:'ТОО «КазДорСтрой»',      bin:'211780178901',status:'active',manager:'А.Муратов'},
  {id:'cl24',name:'ТОО «ШымкентСтрой»',     bin:'221890189012',status:'active',manager:'Б.Ержанов'},
  {id:'cl25',name:'ТОО «АктауПорт»',        bin:'231900190123',status:'active',manager:'А.Муратов'},
  {id:'cl26',name:'ТОО «NordProm»',          bin:'242010201234',status:'active',manager:'Б.Ержанов'},
  {id:'cl27',name:'ТОО «СтройГрупп»',       bin:'252120212345',status:'on_review',manager:'А.Муратов'},
  {id:'cl28',name:'ТОО «ИнтерМонтаж»',      bin:'262230223456',status:'active',manager:'Б.Ержанов'},
  {id:'cl29',name:'ТОО «Восток Строй»',      bin:'272340234567',status:'active',manager:'А.Муратов'},
  {id:'cl30',name:'ТОО «КазЭнергоМонтаж»',  bin:'282450245678',status:'active',manager:'Б.Ержанов'},
  {id:'cl31',name:'ТОО «ГорнякСервис»',     bin:'292560256789',status:'active',manager:'А.Муратов'},
  {id:'cl32',name:'ТОО «ПрестижСтрой»',     bin:'302670267890',status:'frozen', manager:'Б.Ержанов'},
];

// ── DEBTORS ───────────────────────────────────────────────────────────────────
const debtors = [
  {id:'db01',name:'АО «ТНК «Казхром»',              bin:'050140006508',rating:'A',limit:500000000,ind:'Горная добыча'},
  {id:'db02',name:'АО «ССГПО»',                     bin:'050240013956',rating:'A',limit:300000000,ind:'Горно-обогатительный'},
  {id:'db03',name:'ТОО «Arise Kazakhstan»',          bin:'180640010765',rating:'A',limit:200000000,ind:'Горная добыча'},
  {id:'db04',name:'ТОО «TENOIL»',                   bin:'970840000778',rating:'B',limit:150000000,ind:'Нефть и газ'},
  {id:'db05',name:'АО «КазТрансОйл»',               bin:'050340001234',rating:'A',limit:500000000,ind:'Трубопроводный транспорт'},
  {id:'db06',name:'АО «Каражанбас мунай»',           bin:'050540009876',rating:'B',limit:200000000,ind:'Нефтедобыча'},
  {id:'db07',name:'АО «НК «КТЖ»',                  bin:'050440007654',rating:'A',limit:1000000000,ind:'Железнодорожный транспорт'},
  {id:'db08',name:'АО «ЕЭК»',                       bin:'050640003456',rating:'B',limit:100000000,ind:'Электроэнергетика'},
  {id:'db09',name:'АО «Казатомпром»',               bin:'040540003006',rating:'A',limit:800000000,ind:'Атомная промышленность'},
  {id:'db10',name:'АО «КазМунайГаз»',              bin:'030540002774',rating:'A',limit:2000000000,ind:'Нефть и газ'},
  {id:'db11',name:'ТОО «Тенгизшевройл»',           bin:'961240000521',rating:'A',limit:1000000000,ind:'Нефтедобыча'},
  {id:'db12',name:'АО «КазТрансГаз»',              bin:'050640000621',rating:'A',limit:600000000,ind:'Транспортировка газа'},
  {id:'db13',name:'АО «КЕГОК»',                    bin:'050440000849',rating:'A',limit:500000000,ind:'Электроэнергетика'},
  {id:'db14',name:'АО «Богатырь Комир»',           bin:'050240001867',rating:'B',limit:200000000,ind:'Угольная промышленность'},
  {id:'db15',name:'АО «Балхашмысь»',              bin:'040540002134',rating:'B',limit:250000000,ind:'Металлургия'},
  {id:'db16',name:'ТОО «Карагандацемент»',         bin:'061240018765',rating:'B',limit:80000000,ind:'Строительные материалы'},
  {id:'db17',name:'АО «КазАгро»',                  bin:'060740003217',rating:'B',limit:150000000,ind:'Сельское хозяйство'},
  {id:'db18',name:'АО «Казтелеком»',               bin:'980940000421',rating:'A',limit:400000000,ind:'Телекоммуникации'},
  {id:'db19',name:'АО «Казпочта»',                 bin:'960140000912',rating:'B',limit:100000000,ind:'Почтовые услуги'},
  {id:'db20',name:'АО «ҚазМедицина»',              bin:'070740011234',rating:'B',limit:60000000,ind:'Здравоохранение'},
  {id:'db21',name:'ТОО «Шеврон Мунайгаз»',        bin:'960540002156',rating:'A',limit:800000000,ind:'Нефтедобыча'},
  {id:'db22',name:'АО «Казахстан Инжиниринг»',    bin:'030840001765',rating:'B',limit:200000000,ind:'Машиностроение'},
  {id:'db23',name:'ТОО «Актобемунайгаз»',         bin:'960240001543',rating:'B',limit:300000000,ind:'Нефтедобыча'},
  {id:'db24',name:'АО «СНПС-Актобемунайгаз»',     bin:'001040000986',rating:'B',limit:350000000,ind:'Нефтедобыча'},
  {id:'db25',name:'ТОО «Казфосфат»',              bin:'050440003892',rating:'B',limit:180000000,ind:'Химическая промышленность'},
  {id:'db26',name:'АО «Казхимволокно»',           bin:'960540001234',rating:'C',limit:50000000,ind:'Химическая промышленность'},
  {id:'db27',name:'ТОО «ЕвроХим Удобрения»',      bin:'071240023456',rating:'B',limit:200000000,ind:'Химическая промышленность'},
  {id:'db28',name:'ТОО «АрселорМиттал Темиртау»', bin:'960540000987',rating:'A',limit:700000000,ind:'Металлургия'},
  {id:'db29',name:'АО «Казцинк»',                 bin:'960540001654',rating:'A',limit:400000000,ind:'Цветная металлургия'},
  {id:'db30',name:'ТОО «Алтын-Дала»',             bin:'081140034567',rating:'B',limit:80000000,ind:'Строительство'},
  {id:'db31',name:'АО «КазСтройСервис»',          bin:'050740004521',rating:'B',limit:120000000,ind:'Строительство'},
  {id:'db32',name:'ТОО «Строй-Плюс»',             bin:'091240045678',rating:'C',limit:40000000,ind:'Строительство'},
  {id:'db33',name:'АО «Алтыналмас»',              bin:'050540007891',rating:'A',limit:300000000,ind:'Добыча золота'},
  {id:'db34',name:'ТОО «Казахтелемонтаж»',        bin:'060840056789',rating:'B',limit:70000000,ind:'Телекоммуникации'},
  {id:'db35',name:'АО «Самрук-Энерго»',           bin:'060740002218',rating:'A',limit:600000000,ind:'Электроэнергетика'},
  {id:'db36',name:'ТОО «Ecoil»',                  bin:'070940067890',rating:'B',limit:90000000,ind:'Нефтесервис'},
  {id:'db37',name:'АО «МангыстауМунайГаз»',       bin:'960240000765',rating:'B',limit:400000000,ind:'Нефтедобыча'},
  {id:'db38',name:'ТОО «ПНХЗ»',                   bin:'960540000543',rating:'B',limit:250000000,ind:'Нефтепереработка'},
  {id:'db39',name:'АО «BI Group»',                bin:'040440002978',rating:'A',limit:500000000,ind:'Строительство'},
  {id:'db40',name:'АО «КазФарм»',                 bin:'080740078901',rating:'B',limit:60000000,ind:'Фармацевтика'},
  {id:'db41',name:'АО «Казахстан Кагазы»',        bin:'030540001123',rating:'C',limit:30000000,ind:'Бумажная промышленность'},
  {id:'db42',name:'ТОО «АтырауНефтеМаш»',         bin:'961040001876',rating:'B',limit:120000000,ind:'Машиностроение'},
  {id:'db43',name:'АО «НурЭнерго»',              bin:'050740005432',rating:'B',limit:80000000,ind:'Электроэнергетика'},
  {id:'db44',name:'АО «Казпочта Инвест»',         bin:'060940089012',rating:'B',limit:70000000,ind:'Инвестиции'},
  {id:'db45',name:'ТОО «Мегастрой-Астана»',       bin:'071040090123',rating:'B',limit:100000000,ind:'Строительство'},
  {id:'db46',name:'АО «Казахстан Темир Жолы»',    bin:'030940002345',rating:'A',limit:800000000,ind:'Железнодорожный транспорт'},
  {id:'db47',name:'ТОО «КазАвтоДор»',             bin:'090140101234',rating:'B',limit:200000000,ind:'Дорожное строительство'},
  {id:'db48',name:'АО «КазАзот»',                 bin:'960540000432',rating:'B',limit:150000000,ind:'Химическая промышленность'},
  {id:'db49',name:'ТОО «АктобеТрансСервис»',      bin:'100240112345',rating:'B',limit:90000000,ind:'Транспорт'},
  {id:'db50',name:'АО «РД «КМГ»',                bin:'030640001987',rating:'A',limit:500000000,ind:'Нефтедобыча'},
  {id:'db51',name:'ТОО «ЕвразияМет»',             bin:'110340123456',rating:'B',limit:130000000,ind:'Металлоторговля'},
  {id:'db52',name:'АО «КазНИИ»',                  bin:'050540008765',rating:'B',limit:50000000,ind:'Наука и технологии'},
  {id:'db53',name:'ТОО «Airba Digital»',          bin:'120440134567',rating:'B',limit:60000000,ind:'IT'},
  {id:'db54',name:'АО «Эйр Астана»',              bin:'020540001234',rating:'B',limit:300000000,ind:'Авиация'},
  {id:'db55',name:'ТОО «ТулпарТалком»',           bin:'130540145678',rating:'B',limit:80000000,ind:'Телекоммуникации'},
  {id:'db56',name:'АО «Казатомпром-SaUran»',      bin:'050740009234',rating:'A',limit:200000000,ind:'Атомная промышленность'},
  {id:'db57',name:'ТОО «Агромаш Холдинг»',        bin:'140640156789',rating:'C',limit:40000000,ind:'Сельское хозяйство'},
];

// ── TARIFF mapping per client ─────────────────────────────────────────────────
const clientTariff = {
  cl01:'tp08',cl02:'tp18',cl03:'tp02',cl04:'tp09',cl05:'tp05',cl06:'tp06',
  cl07:'tp07',cl08:'tp04',cl09:'tp01',cl10:'tp08',cl11:'tp02',cl12:'tp11',
  cl13:'tp14',cl14:'tp05',cl15:'tp06',cl16:'tp12',cl17:'tp03',cl18:'tp08',
  cl19:'tp02',cl20:'tp04',cl21:'tp06',cl22:'tp13',cl23:'tp05',cl24:'tp19',
  cl25:'tp08',cl26:'tp07',cl27:'tp02',cl28:'tp15',cl29:'tp05',cl30:'tp03',
  cl31:'tp17',cl32:'tp16',
};
// tariff series for K2 calc
const tariffSeries = {
  tp01:'F2',tp02:'F2',tp03:'F2',tp04:'F2',tp05:'F2',tp06:'F2',tp07:'F2',
  tp08:'F2',tp09:'F2',tp10:'F2',tp11:'F1',tp12:'F1',tp13:'F1',tp14:'F1',
  tp15:'F1',tp16:'F1',tp17:'F1',tp18:'F1',tp19:'F1',tp20:'F4',tp21:'F5',tp22:'F6',
};
// tariff K1 rates
const tariffK1 = {
  tp01:0.066,tp02:0.060,tp03:0.066,tp04:0.066,tp05:0.060,tp06:0.055,tp07:0.050,
  tp08:0.055,tp09:0.078,tp10:0.127,tp11:0.117,tp12:0.133,tp13:0.080,tp14:0.067,
  tp15:0.0934,tp16:0.107,tp17:0.100,tp18:0.083,tp19:0.0917,tp20:0.133,tp21:0.100,tp22:0.100,
};

// ── OUTPUT CLIENTS ────────────────────────────────────────────────────────────
add('-- КЛИЕНТЫ');
add(`INSERT OR IGNORE INTO clients(id,name,bin,status,manager) VALUES`);
add(clients.map(c =>
  `  (${q(c.id)},${q(c.name)},${q(c.bin)},${q(c.status)},${q(c.manager)})`
).join(',\n') + ';');
add('');

// ── OUTPUT DEBTORS ────────────────────────────────────────────────────────────
add('-- ДЕБИТОРЫ');
add(`INSERT OR IGNORE INTO debtors(id,name,bin,rating,credit_limit,notification_signed,industry) VALUES`);
add(debtors.map(d =>
  `  (${q(d.id)},${q(d.name)},${q(d.bin)},${q(d.rating)},${d.limit},1,${q(d.ind)})`
).join(',\n') + ';');
add('');

// ── AGREEMENTS ────────────────────────────────────────────────────────────────
add('-- ГЕНЕРАЛЬНЫЕ ДОГОВОРЫ');
const agreements = [];
const agDiscounts = [0.75,0.80,0.85,0.90,0.92,0.95];
clients.forEach((c, i) => {
  const agId = `ag${String(i+1).padStart(2,'0')}`;
  const year = i < 6 ? 2024 : 2025;
  const month = String((i % 12) + 1).padStart(2,'0');
  const day = String(((i * 7) % 28) + 1).padStart(2,'0');
  const date = `${year}-${month}-${day}`;
  const disc = agDiscounts[i % agDiscounts.length];
  const num = `ГД №${date.replace(/-/g,'/')}-${String(i+1).padStart(4,'0')} от ${day}.${month}.${year}`;
  agreements.push({id:agId, clientId:c.id, num, date, tariff:clientTariff[c.id], disc});
});
add(`INSERT OR IGNORE INTO agreements(id,client_id,number,date_signed,tariff_plan_id,default_discount) VALUES`);
add(agreements.map(a =>
  `  (${q(a.id)},${q(a.clientId)},${q(a.num)},${q(a.date)},${q(a.tariff)},${a.disc})`
).join(',\n') + ';');
add('');

// ── FINANCINGS ────────────────────────────────────────────────────────────────
// Define 152 financings (F-0005..F-0156); F-0001..F-0004 are existing demos
const financingDefs = [
  // [clientId, debtorId, avrDate, installDays, docSum, discount, status, extraDaysPaidDown]
  // 'extraDaysPaidDown' = days already elapsed (for k1 calc on open deals)
  // Dec 2024 — mostly closed
  ['cl01','db01','2024-12-01',30, 26481997,0.90,'closed'],
  ['cl01','db02','2024-12-05',60, 18500000,0.90,'closed'],
  ['cl02','db04','2024-12-08',30, 9200000, 0.80,'closed'],
  ['cl03','db03','2024-12-10',45, 14300000,0.85,'closed'],
  ['cl04','db05','2024-12-12',60, 35000000,0.90,'closed'],
  ['cl05','db01','2024-12-15',30, 8700000, 0.85,'closed'],
  ['cl06','db07','2024-12-17',90, 55000000,0.75,'closed'],
  ['cl07','db09','2024-12-18',30, 12000000,0.85,'closed'],
  ['cl08','db11','2024-12-20',60, 22000000,0.80,'closed'],
  ['cl09','db28','2024-12-22',30, 16500000,0.85,'closed'],
  ['cl10','db13','2024-12-23',45, 9800000, 0.90,'closed'],
  ['cl11','db14','2024-12-26',30, 7200000, 0.85,'closed'],
  ['cl01','db03','2024-12-28',60, 31000000,0.90,'closed'],
  ['cl04','db07','2024-12-30',30, 19000000,0.90,'closed'],
  ['cl05','db02','2024-12-31',45, 11500000,0.85,'closed'],
  // Jan 2025
  ['cl06','db01','2025-01-03',30, 24000000,0.90,'closed'],
  ['cl07','db10','2025-01-05',60, 48000000,0.85,'closed'],
  ['cl08','db12','2025-01-07',30, 13500000,0.80,'closed'],
  ['cl09','db29','2025-01-09',45, 27000000,0.85,'closed'],
  ['cl10','db13','2025-01-12',30, 8500000, 0.90,'closed'],
  ['cl01','db01','2025-01-15',60, 33000000,0.90,'closed'],
  ['cl02','db07','2025-01-17',30, 15000000,0.80,'closed'],
  ['cl03','db05','2025-01-19',45, 19500000,0.85,'closed'],
  ['cl04','db06','2025-01-21',30, 10200000,0.90,'closed'],
  ['cl12','db31','2025-01-22',60, 6800000, 0.85,'closed'],
  ['cl13','db19','2025-01-25',30, 4500000, 0.80,'closed'],
  ['cl14','db13','2025-01-27',45, 21000000,0.85,'closed'],
  ['cl15','db15','2025-01-29',30, 12300000,0.90,'closed'],
  ['cl05','db02','2025-01-31',60, 28000000,0.85,'closed'],
  // Feb 2025
  ['cl01','db02','2025-02-03',30, 22000000,0.90,'closed'],
  ['cl06','db07','2025-02-05',90, 67000000,0.75,'closed'],
  ['cl07','db09','2025-02-07',30, 15500000,0.85,'closed'],
  ['cl16','db18','2025-02-10',60, 9300000, 0.80,'closed'],
  ['cl17','db23','2025-02-12',45, 18700000,0.85,'closed'],
  ['cl18','db06','2025-02-14',30, 11200000,0.90,'closed'],
  ['cl19','db14','2025-02-17',60, 14800000,0.85,'closed'],
  ['cl20','db16','2025-02-19',30, 7600000, 0.90,'closed'],
  ['cl03','db03','2025-02-21',45, 25000000,0.85,'closed'],
  ['cl04','db05','2025-02-24',30, 32000000,0.90,'closed'],
  // Mar 2025
  ['cl01','db01','2025-03-01',60, 28500000,0.90,'closed'],
  ['cl08','db11','2025-03-03',30, 17000000,0.80,'closed'],
  ['cl09','db28','2025-03-05',45, 24000000,0.85,'closed'],
  ['cl21','db21','2025-03-07',30, 42000000,0.80,'closed'],
  ['cl22','db22','2025-03-10',60, 8900000, 0.85,'closed'],
  ['cl23','db47','2025-03-12',30, 13400000,0.90,'closed'],
  ['cl10','db13','2025-03-15',45, 11000000,0.90,'closed'],
  ['cl02','db04','2025-03-17',30, 6700000, 0.80,'closed'],
  ['cl05','db01','2025-03-20',60, 31500000,0.85,'closed'],
  ['cl06','db07','2025-03-25',30, 20000000,0.90,'closed'],
  // Apr 2025
  ['cl11','db14','2025-04-01',30, 9200000, 0.85,'closed'],
  ['cl12','db31','2025-04-03',60, 7800000, 0.85,'closed'],
  ['cl01','db02','2025-04-07',45, 35000000,0.90,'closed'],
  ['cl04','db05','2025-04-09',30, 27000000,0.90,'closed'],
  ['cl24','db32','2025-04-12',60, 5500000, 0.85,'closed'],
  ['cl25','db37','2025-04-14',30, 19800000,0.90,'closed'],
  ['cl07','db10','2025-04-16',45, 52000000,0.85,'closed'],
  ['cl08','db12','2025-04-18',30, 16200000,0.80,'closed'],
  ['cl03','db06','2025-04-21',60, 22500000,0.85,'closed'],
  ['cl09','db29','2025-04-24',30, 31000000,0.85,'closed'],
  // May 2025
  ['cl26','db33','2025-05-01',30, 14500000,0.90,'closed'],
  ['cl01','db03','2025-05-05',60, 38000000,0.90,'closed'],
  ['cl05','db02','2025-05-08',30, 24000000,0.85,'closed'],
  ['cl06','db01','2025-05-12',45, 29000000,0.90,'closed'],
  ['cl10','db13','2025-05-15',30, 12500000,0.90,'closed'],
  ['cl14','db35','2025-05-18',60, 43000000,0.85,'closed'],
  ['cl15','db15','2025-05-21',30, 18000000,0.90,'closed'],
  ['cl17','db23','2025-05-24',45, 22000000,0.85,'closed'],
  ['cl02','db07','2025-05-27',30, 11000000,0.80,'closed'],
  // Jun 2025
  ['cl04','db06','2025-06-01',30, 15800000,0.90,'closed'],
  ['cl07','db09','2025-06-04',60, 61000000,0.85,'closed'],
  ['cl01','db01','2025-06-07',45, 44000000,0.90,'closed'],
  ['cl19','db14','2025-06-10',30, 16500000,0.85,'closed'],
  ['cl20','db17','2025-06-13',60, 9700000, 0.90,'closed'],
  ['cl27','db30','2025-06-16',30, 8200000, 0.85,'closed'],
  ['cl08','db11','2025-06-19',30, 19500000,0.80,'closed'],
  // Jul 2025 — mix of closed and overdue
  ['cl09','db28','2025-07-01',30, 26000000,0.85,'overdue'],
  ['cl03','db05','2025-07-04',60, 34000000,0.85,'overdue'],
  ['cl05','db02','2025-07-07',45, 18700000,0.85,'overdue'],
  ['cl06','db07','2025-07-10',30, 41000000,0.90,'overdue'],
  ['cl01','db02','2025-07-14',60, 29000000,0.90,'overdue'],
  ['cl10','db13','2025-07-17',90, 15000000,0.90,'overdue'],
  ['cl11','db14','2025-07-21',30, 8400000, 0.85,'default'],
  ['cl12','db31','2025-07-24',60, 6900000, 0.85,'default'],
  // Aug 2025
  ['cl13','db19','2025-08-01',30, 5200000, 0.80,'default'],
  ['cl02','db04','2025-08-05',45, 12000000,0.80,'overdue'],
  ['cl04','db05','2025-08-09',30, 38500000,0.90,'overdue'],
  ['cl07','db10','2025-08-12',60, 70000000,0.85,'overdue'],
  ['cl14','db35','2025-08-15',30, 48000000,0.85,'overdue'],
  ['cl15','db15','2025-08-18',45, 21000000,0.90,'overdue'],
  ['cl17','db37','2025-08-21',30, 17300000,0.85,'overdue'],
  // Sep 2025
  ['cl01','db01','2025-09-01',30, 32000000,0.90,'open'],
  ['cl08','db12','2025-09-04',60, 23500000,0.80,'open'],
  ['cl09','db29','2025-09-07',30, 28000000,0.85,'open'],
  ['cl21','db21','2025-09-10',45, 55000000,0.80,'open'],
  ['cl18','db06','2025-09-13',30, 14200000,0.90,'open'],
  ['cl22','db22','2025-09-16',60, 10500000,0.85,'open'],
  ['cl23','db47','2025-09-19',30, 19000000,0.90,'open'],
  ['cl06','db07','2025-09-22',30, 45000000,0.90,'open'],
  ['cl03','db03','2025-09-25',45, 27500000,0.85,'open'],
  // Oct 2025
  ['cl01','db03','2025-10-01',30, 36000000,0.90,'open'],
  ['cl04','db07','2025-10-05',60, 48000000,0.90,'open'],
  ['cl05','db01','2025-10-08',30, 22000000,0.85,'open'],
  ['cl07','db09','2025-10-11',45, 68000000,0.85,'open'],
  ['cl10','db13','2025-10-14',30, 13500000,0.90,'open'],
  ['cl14','db13','2025-10-17',60, 52000000,0.85,'open'],
  ['cl15','db15','2025-10-20',30, 24000000,0.90,'open'],
  ['cl24','db39','2025-10-23',45, 7100000, 0.85,'open'],
  ['cl25','db42','2025-10-26',30, 16800000,0.90,'open'],
  // Nov 2025
  ['cl01','db02','2025-11-01',30, 41000000,0.90,'open'],
  ['cl02','db07','2025-11-04',60, 18000000,0.80,'open'],
  ['cl06','db01','2025-11-07',30, 33000000,0.90,'open'],
  ['cl08','db11','2025-11-10',45, 27000000,0.80,'open'],
  ['cl09','db28','2025-11-13',30, 34500000,0.85,'open'],
  ['cl17','db23','2025-11-16',60, 25000000,0.85,'open'],
  ['cl19','db14','2025-11-19',30, 11800000,0.85,'open'],
  ['cl26','db33','2025-11-22',45, 19500000,0.90,'open'],
  ['cl28','db45','2025-11-25',30, 8700000, 0.85,'open'],
  ['cl29','db30','2025-11-28',60, 15000000,0.90,'open'],
  // Dec 2025
  ['cl01','db01','2025-12-01',30, 47000000,0.90,'open'],
  ['cl03','db05','2025-12-04',45, 31000000,0.85,'open'],
  ['cl04','db06','2025-12-07',30, 22500000,0.90,'open'],
  ['cl07','db10','2025-12-10',60, 82000000,0.85,'open'],
  ['cl10','db35','2025-12-13',30, 17000000,0.90,'open'],
  ['cl11','db14','2025-12-16',45, 9500000, 0.85,'open'],
  ['cl21','db21','2025-12-19',30, 58000000,0.80,'open'],
  ['cl30','db43','2025-12-22',60, 13200000,0.85,'open'],
  // Jan 2026
  ['cl01','db02','2026-01-05',30, 39000000,0.90,'open'],
  ['cl05','db01','2026-01-08',60, 26000000,0.85,'open'],
  ['cl06','db07','2026-01-11',30, 51000000,0.90,'open'],
  ['cl08','db12','2026-01-14',45, 29500000,0.80,'open'],
  ['cl09','db29','2026-01-17',30, 37000000,0.85,'open'],
  ['cl14','db35','2026-01-20',60, 63000000,0.85,'open'],
  ['cl15','db15','2026-01-23',30, 26500000,0.90,'open'],
  ['cl18','db06','2026-01-26',45, 14800000,0.90,'open'],
  ['cl22','db22','2026-01-29',30, 11200000,0.85,'open'],
  // Feb 2026
  ['cl01','db01','2026-02-02',30, 43000000,0.90,'open'],
  ['cl04','db05','2026-02-06',60, 55000000,0.90,'open'],
  ['cl07','db09','2026-02-09',30, 75000000,0.85,'open'],
  ['cl10','db13','2026-02-12',45, 18500000,0.90,'open'],
  ['cl23','db47','2026-02-15',30, 22000000,0.90,'open'],
  ['cl25','db37','2026-02-18',60, 20000000,0.90,'open'],
  ['cl31','db56','2026-02-21',30, 6500000, 0.85,'open'],
  // Mar 2026 — newest (open)
  ['cl01','db03','2026-03-01',30, 36000000,0.90,'open'],
  ['cl06','db01','2026-03-05',60, 48500000,0.90,'open'],
  ['cl03','db06','2026-03-10',30, 17800000,0.85,'draft'],
  ['cl09','db29','2026-03-12',45, 29000000,0.85,'draft'],
  ['cl14','db13','2026-03-14',30, 41000000,0.85,'draft'],
  ['cl21','db21','2026-03-18',60, 63000000,0.80,'draft'],
];

add('-- ФИНАНСИРОВАНИЯ');

// Build financing SQL rows
const finRows = [];
let finNum = 5; // start from F-0005

for (const def of financingDefs) {
  const [clId, dbId, avrDate, instDays, docSum, disc, status] = def;
  const tpId = clientTariff[clId];
  const series = tariffSeries[tpId];
  const k1rate = tariffK1[tpId];
  const finSum = round2(docSum * disc);
  const plannedRep = addDays(avrDate, instDays);
  const dateFinancing = status === 'draft' ? null : addDays(avrDate, 1);
  const agIdx = clients.findIndex(c => c.id === clId);
  const agId = `ag${String(agIdx + 1).padStart(2,'0')}`;

  // For closed: calc commissions
  let currentOD = finSum;
  let k1net = 0, k2net = 0, vop = null, closedAt = null, daysOverdue = 0;
  let st = status;

  if (status === 'closed') {
    const days = instDays + Math.floor(Math.random() * 10); // paid ~at due date
    const calcDate = addDays(avrDate, days + 1);
    const k1 = calcK1(finSum, k1rate, days, calcDate);
    const k2 = calcK2(docSum, series, days, calcDate);
    k1net = k1.net;
    k2net = k2.net;
    vop = calcVOP(docSum, finSum, k1net, k2net);
    currentOD = 0;
    closedAt = calcDate;
    daysOverdue = 0;
  } else if (status === 'overdue') {
    // planned_repayment is in the past, some K1/K2 accrued
    const daysElapsed = Math.floor((new Date('2026-03-21') - new Date(dateFinancing)) / 86400000);
    const k1 = calcK1(finSum, k1rate, daysElapsed, '2026-03-21');
    const k2 = calcK2(docSum, series, Math.min(daysElapsed, 120), '2026-03-21');
    k1net = round2(k1.net * 0.6); // partial commission already paid
    k2net = round2(k2.net * 0.5);
    currentOD = finSum; // still full OD
    daysOverdue = Math.max(0, Math.floor((new Date('2026-03-21') - new Date(plannedRep)) / 86400000));
    st = 'overdue';
  } else if (status === 'default') {
    const daysElapsed = Math.floor((new Date('2026-03-21') - new Date(dateFinancing)) / 86400000);
    const k1 = calcK1(finSum, k1rate, daysElapsed, '2026-03-21');
    const k2 = calcK2(docSum, series, 120, '2026-03-21');
    k1net = round2(k1.net * 0.4);
    k2net = round2(k2.net * 0.3);
    currentOD = finSum;
    daysOverdue = Math.max(0, Math.floor((new Date('2026-03-21') - new Date(plannedRep)) / 86400000));
    st = 'default';
  } else if (status === 'open') {
    const daysElapsed = dateFinancing ? Math.floor((new Date('2026-03-21') - new Date(dateFinancing)) / 86400000) : 0;
    const k1 = calcK1(finSum, k1rate, daysElapsed, '2026-03-21');
    const k2 = calcK2(docSum, series, Math.min(daysElapsed, 120), '2026-03-21');
    k1net = k1.net;
    k2net = k2.net;
    currentOD = finSum; // most are still full OD (no payments yet)
    daysOverdue = 0;
  }

  const id = `fin${String(finNum).padStart(3,'0')}`;
  const number = `F-${String(finNum).padStart(4,'0')}`;
  const noticeNum = st !== 'draft' ? `Уведомление №${finNum} от ${avrDate.split('-').reverse().join('.')}` : null;
  const avrNum = `АВР №${finNum}-${avrDate.split('-')[0]}`;

  const facType = (series === 'F1') ? 'without_notice' : 'with_notice';

  finRows.push(
    `  (${q(id)},${q(number)},${q(clId)},${q(dbId)},${q(agId)},${q(tpId)},`+
    `${q(noticeNum)},${q(avrNum)},${q(avrDate)},${instDays},`+
    `${docSum},${disc},${finSum},${q(dateFinancing)},${q(plannedRep)},`+
    `${q(facType)},${currentOD},${round2(k1net)},${round2(k2net)},${daysOverdue},`+
    `${q(st)},${vop !== null ? vop : 'NULL'},${q(closedAt)})`
  );
  finNum++;
}

add(`INSERT OR IGNORE INTO financings(`+
  `id,number,client_id,debtor_id,agreement_id,tariff_plan_id,`+
  `notice_number,avr_number,avr_date,installment_days,`+
  `document_sum,discount,financing_sum,date_financing,planned_repayment,`+
  `factoring_type,current_od,k1_accrued_net,k2_accrued_net,days_overdue,status,vop,closed_at) VALUES`);
add(finRows.join(',\n') + ';');
add('');

// ── OPERATIONS for closed financings ────────────────────────────────────────
add('-- ОПЕРАЦИИ ПО ФИНАНСИРОВАНИЯМ (закрытые)');
const opRows = [];
finNum = 5;
financingDefs.forEach((def, i) => {
  const [clId, dbId, avrDate, instDays, docSum, disc, status] = def;
  const tpId = clientTariff[clId];
  const series = tariffSeries[tpId];
  const k1rate = tariffK1[tpId];
  const finSum = round2(docSum * disc);
  const dateFinancing = addDays(avrDate, 1);
  const id = `fin${String(finNum + i).padStart(3,'0')}`;

  if (status === 'closed') {
    const days = instDays + Math.floor(Math.random() * 10);
    const calcDate = addDays(avrDate, days + 1);
    const k1 = calcK1(finSum, k1rate, days, calcDate);
    const k2 = calcK2(docSum, series, days, calcDate);
    const k1paid = k1.gross;
    const k2paid = k2.gross;
    const totalComm = round2(k1paid + k2paid);
    const payment = round2(finSum + totalComm);
    // Issue operation
    opRows.push(`  (${q('op_iss_'+id)},${q(id)},${q(dateFinancing)},'issue',${finSum},0,0,0,${finSum},'factor',NULL)`);
    // Full repayment
    opRows.push(`  (${q('op_rep_'+id)},${q(id)},${q(calcDate)},'full_repayment',${payment},${round2(k1paid)},${round2(k2paid)},${finSum},0,'debtor',NULL)`);
  }
});
add(`INSERT OR IGNORE INTO financing_operations`+
  `(id,financing_id,operation_date,type,amount,k1_paid,k2_paid,od_paid,od_after,source,note) VALUES`);
add(opRows.join(',\n') + ';');
add('');

// ── PAYMENTS (платёжные поручения) ───────────────────────────────────────────
add('-- ПЛАТЁЖНЫЕ ПОРУЧЕНИЯ');
const pmtRows = [];
// Outgoing payments (выдача финансирований)
const outDates = ['2024-12-01','2025-01-05','2025-02-03','2025-03-01','2025-04-01','2025-05-01','2025-06-01','2025-07-01','2025-09-01','2025-10-01','2025-11-01','2025-12-01','2026-01-05','2026-02-02','2026-03-01'];
outDates.forEach((d, i) => {
  const amt = [6274618,10000000,4500000,19000000,24000000,18000000,32000000,14000000,27500000,36000000,22000000,47000000,39000000,43000000,36000000][i];
  pmtRows.push(`  (${q('pmt_out_'+String(i+1).padStart(3,'0'))},${q(d)},'outgoing','financing_issue',${amt},'executed',${q('Выдача финансирования F-'+String(i+5).padStart(4,'0'))})`);
});
// Incoming payments (гашения)
const inDates = ['2025-01-31','2025-02-28','2025-03-31','2025-04-30','2025-05-31','2025-06-30','2025-07-31','2025-08-31','2025-09-30','2025-10-31','2025-11-30','2025-12-31','2026-01-31','2026-02-28'];
inDates.forEach((d, i) => {
  const amt = [28000000,12500000,21000000,38000000,26000000,15000000,44000000,19000000,32000000,51000000,28000000,47000000,41000000,37000000][i];
  pmtRows.push(`  (${q('pmt_in_'+String(i+1).padStart(3,'0'))},${q(d)},'incoming','debtor_payment',${amt},'executed',${q('Гашение по договору факторинга от дебитора')})`);
});
add(`INSERT OR IGNORE INTO payments(id,payment_date,direction,payment_type,amount,status,purpose) VALUES`);
add(pmtRows.join(',\n') + ';');
add('');

// ── COMMISSION PERIODS ────────────────────────────────────────────────────────
add('-- ПЕРИОДЫ НАЧИСЛЕНИЯ КОМИССИЙ (последние 6 месяцев)');
const commRows = [];
const activeFinIds = ['fin_demo_01','fin_demo_02'];
// Add a few commission periods for active financings
const months = ['2025-10-31','2025-11-30','2025-12-31','2026-01-31','2026-02-28','2026-03-21'];
months.forEach((m, mi) => {
  const od = 6274618;
  const k1net = round2(od * 0.055 / 365 * 30);
  const vat = m >= '2026-01-01' ? 0.16 : 0.12;
  const k1vat = round2(k1net * vat);
  const k1gross = round2(k1net + k1vat);
  const k2net = mi === 0 ? round2(26481997 * 0.74/100) : 0;
  const k2gross = round2(k2net * (1+vat));
  commRows.push(`  (${q('cp_demo01_'+mi)},'fin_demo_01',${q(m)},30,${od},${k1net},${k1vat},${k1gross},${k2net},${round2(k2net*vat)},${k2gross},${vat},${round2(k1gross+k2gross)},${mi*30})`);
});
add(`INSERT OR IGNORE INTO commission_periods`+
  `(id,financing_id,period_date,days,od_amount,k1_net,k1_vat,k1_gross,k2_net,k2_vat,k2_gross,vat_rate,total_gross,cumulative_days) VALUES`);
add(commRows.join(',\n') + ';');
add('');

add('-- Seed v2.0 complete');

// Write output
const output = lines.join('\n');
const outPath = path.join(__dirname, 'seed_extended.sql');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`✅ Generated ${outPath}`);
console.log(`   Clients: ${clients.length}`);
console.log(`   Debtors: ${debtors.length}`);
console.log(`   Financings: ${financingDefs.length} new + 4 existing = ${financingDefs.length+4} total`);
