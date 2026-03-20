-- F2-тарифы
INSERT OR IGNORE INTO tariff_plans
  (id,name,series,k1_rate,k2_rate_0_30,k2_rate_30_60,k2_rate_60_90,k2_rate_90_120,k2_rate_120plus,k3_rate_22_90)
VALUES
  ('tp01','Премиум.F2','F2',0.066,1.52,3.04,4.56,6.08,9.70,0.05),
  ('tp02','Классик.F2','F2',0.060,1.30,2.60,3.90,5.20,6.60,0.02),
  ('tp03','Ультра.F2','F2',0.066,1.02,2.04,3.06,4.08,5.10,0.035),
  ('tp04','Комфорт.F2','F2',0.066,0.888,1.775,2.663,3.551,4.438,0.045),
  ('tp05','Бизнес.F2','F2',0.060,0.814,1.627,2.441,3.255,4.068,0.035),
  ('tp06','Corp.F2','F2',0.055,0.65,1.30,1.95,2.60,3.25,0.025),
  ('tp07','VIP.F2','F2',0.050,0.49,0.99,1.75,2.99,5.99,0.02),
  ('tp08','Оптима.F2','F2',0.055,0.74,1.479,2.219,2.959,3.699,0.025),
  ('tp09','Тандем.F2','F2',0.078,1.67,3.34,5.01,6.68,10.65,0.05),
  ('tp10','Active.F2','F2',0.127,NULL,NULL,NULL,NULL,NULL,NULL);

-- F1-тарифы
INSERT OR IGNORE INTO tariff_plans (id,name,series,k1_rate) VALUES
  ('tp11','Премиум.F1','F1',0.117),
  ('tp12','Smart.F1','F1',0.133),
  ('tp13','Регресс.F1','F1',0.080),
  ('tp14','VIP.F1','F1',0.067),
  ('tp15','Комфорт.F1','F1',0.0934),
  ('tp16','Престиж.F1','F1',0.107),
  ('tp17','Регресс.Ультра.F1','F1',0.100),
  ('tp18','Active.F1','F1',0.083),
  ('tp19','Выгодный.F1','F1',0.0917);

-- F4, F5, F6
INSERT OR IGNORE INTO tariff_plans
  (id,name,series,k1_rate,k2_rate_0_30,k2_rate_30_60,k2_rate_60_90,k2_rate_90_120,k2_rate_120plus)
VALUES
  ('tp20','Премиум.F4','F4',0.133,1.00,2.00,3.00,4.00,5.00),
  ('tp21','Премиум.F5','F5',0.100,1.30,2.60,3.90,5.20,6.50),
  ('tp22','Премиум.F6','F6',0.100,2.50,5.00,7.50,10.00,12.50);

-- Пользователи (пароль: password)
INSERT OR IGNORE INTO users(id,email,name,password,role) VALUES
  ('usr_admin','admin@swiss.kz','Администратор','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin'),
  ('usr_mgr','manager@swiss.kz','А.Муратов','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','manager');

-- Клиенты
INSERT OR IGNORE INTO clients(id,name,bin,status,manager) VALUES
  ('cl01','ТОО «Гранат»','041200045678','active','А.Муратов'),
  ('cl02','ТОО «Aurora»','041500012345','active','А.Муратов'),
  ('cl03','ТОО «КомпИнвестСтр»','041800067890','active','Б.Ержанов'),
  ('cl04','ТОО «PolAtyrau»','041000098765','active','А.Муратов'),
  ('cl05','ТОО «МонтСтройСп»','041700034521','active','Б.Ержанов'),
  ('cl06','ТОО «KeyPartGr»','041300056789','active','А.Муратов');

-- Дебиторы
INSERT OR IGNORE INTO debtors(id,name,bin,rating,credit_limit,notification_signed,industry) VALUES
  ('db01','АО «ТНК «Казхром»','050140006508','A',500000000,1,'Горная добыча'),
  ('db02','АО «ССГПО»','050240013956','A',300000000,1,'Горно-обогатительный'),
  ('db03','ТОО «Arise Kazakhstan»','180640010765','A',200000000,1,'Горная добыча'),
  ('db04','ТОО «TENOIL»','970840000778','B',150000000,1,'Нефть и газ'),
  ('db05','АО «КазТрансОйл»','050340001234','A',500000000,1,'Трубопроводный транспорт'),
  ('db06','АО «Каражанбас мунай»','050540009876','B',200000000,1,'Нефтедобыча'),
  ('db07','АО «НК «КТЖ»','050440007654','A',1000000000,1,'Железнодорожный транспорт'),
  ('db08','АО «ЕЭК»','050640003456','B',100000000,1,'Электроэнергетика');

-- Генеральные договоры
INSERT OR IGNORE INTO agreements(id,client_id,number,date_signed,tariff_plan_id,default_discount) VALUES
  ('ag01','cl01','ГД №26/11/2024-0010 от 26.11.2024','2024-11-26','tp08',0.90),
  ('ag02','cl02','ГД №03/04/2025-0017 от 03.04.2025','2025-04-03','tp18',0.80),
  ('ag03','cl04','ГД №19/03/2025-0015 от 19.03.2025','2025-03-19','tp09',0.90);

-- Демо-финансирование
INSERT OR IGNORE INTO financings(
  id,number,client_id,debtor_id,agreement_id,tariff_plan_id,
  notice_number,avr_number,avr_date,installment_days,
  document_sum,discount,financing_sum,date_financing,planned_repayment,
  factoring_type,current_od,k1_accrued_net,k2_accrued_net,status
) VALUES (
  'fin_demo_01','F-0001','cl01','db01','ag01','tp08',
  'Уведомление №12 от 24.02.2026','№0015 от 24.02.2026',
  '2026-02-24',30,
  7381904.01,0.85,6274618.0,
  '2026-02-24','2026-03-26',
  'with_notice',6274618.0,0,0,'open'
);

-- Ещё несколько демо-финансирований
INSERT OR IGNORE INTO financings(
  id,number,client_id,debtor_id,agreement_id,tariff_plan_id,
  avr_number,avr_date,installment_days,
  document_sum,discount,financing_sum,date_financing,planned_repayment,
  factoring_type,current_od,k1_accrued_net,k2_accrued_net,status
) VALUES
  ('fin_demo_02','F-0002','cl02','db02','ag02','tp18',
   '№AVR-0022 от 15.01.2026','2026-01-15',60,
   12500000,0.80,10000000,
   '2026-01-16','2026-03-16',
   'with_notice',10000000,0,0,'overdue'),
  ('fin_demo_03','F-0003','cl04','db05','ag03','tp09',
   '№AVR-0033 от 10.03.2026','2026-03-10',45,
   5000000,0.90,4500000,
   '2026-03-10','2026-04-24',
   'with_notice',4500000,0,0,'open'),
  ('fin_demo_04','F-0004','cl03','db03',NULL,'tp02',
   '№AVR-0044 от 01.12.2025','2025-12-01',90,
   8000000,0.85,6800000,
   '2025-12-02','2026-03-02',
   'with_notice',0,320000,150000,'closed');
