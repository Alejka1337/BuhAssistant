/**
 * Таблица НГО (Нормативно Грошової Оцінки) для різних регіонів та типів земель
 * Використовується для розрахунку Єдиного податку для 4 групи
 */

export interface NGOData {
  region: string;
  rillya: number; // Рілля, перелоги
  bagatorichni: number; // Багаторічні насадження
  sinojati: number; // Сіножаті
  pasovyscha: number; // Пасовища
}

export const ngoTable: NGOData[] = [
  { region: 'АР Крим', rillya: 30611.01, bagatorichni: 68814.41, sinojati: 11942.88, pasovyscha: 5043.62 },
  { region: 'Вінницька область', rillya: 31998.83, bagatorichni: 55387.22, sinojati: 3696.60, pasovyscha: 1834.05 },
  { region: 'Волинська область', rillya: 25668.28, bagatorichni: 48673.61, sinojati: 7108.85, pasovyscha: 5272.87 },
  { region: 'Дніпропетровська область', rillya: 35609.06, bagatorichni: 65457.62, sinojati: 9383.69, pasovyscha: 7336.18 },
  { region: 'Донецька область', rillya: 36621.38, bagatorichni: 68814.41, sinojati: 8530.62, pasovyscha: 7106.92 },
  { region: 'Житомирська область', rillya: 25203.32, bagatorichni: 41960.01, sinojati: 5971.44, pasovyscha: 4814.36 },
  { region: 'Закарпатська область', rillya: 32097.71, bagatorichni: 43638.40, sinojati: 7677.57, pasovyscha: 6189.90 },
  { region: 'Запорізька область', rillya: 29409.17, bagatorichni: 48673.61, sinojati: 7108.85, pasovyscha: 5731.39 },
  { region: 'Івано-Франківська область', rillya: 30707.53, bagatorichni: 43638.40, sinojati: 5687.09, pasovyscha: 5272.87 },
  { region: 'Київська область', rillya: 31230.17, bagatorichni: 50352.01, sinojati: 7393.21, pasovyscha: 5272.87 },
  { region: 'Кіровоградська область', rillya: 37536.00, bagatorichni: 78884.81, sinojati: 10236.75, pasovyscha: 7106.92 },
  { region: 'Луганська область', rillya: 31929.38, bagatorichni: 55387.22, sinojati: 9668.04, pasovyscha: 6877.66 },
  { region: 'Львівська область', rillya: 25298.66, bagatorichni: 31889.61, sinojati: 6824.51, pasovyscha: 4814.36 },
  { region: 'Миколаївська область', rillya: 31826.97, bagatorichni: 55387.22, sinojati: 9668.04, pasovyscha: 6877.66 },
  { region: 'Одеська область', rillya: 36510.73, bagatorichni: 73849.61, sinojati: 10521.11, pasovyscha: 8253.20 },
  { region: 'Полтавська область', rillya: 35772.68, bagatorichni: 75528.02, sinojati: 6540.15, pasovyscha: 5043.62 },
  { region: 'Рівненська область', rillya: 25823.66, bagatorichni: 43638.40, sinojati: 5971.44, pasovyscha: 4355.85 },
  { region: 'Сумська область', rillya: 31538.58, bagatorichni: 58744.01, sinojati: 7677.57, pasovyscha: 5502.13 },
  { region: 'Тернопільська область', rillya: 34177.68, bagatorichni: 67136.02, sinojati: 7393.21, pasovyscha: 6648.41 },
  { region: 'Харківська область', rillya: 37946.82, bagatorichni: 78884.81, sinojati: 7393.21, pasovyscha: 7565.43 },
  { region: 'Херсонська область', rillya: 28780.58, bagatorichni: 43638.40, sinojati: 6255.79, pasovyscha: 5043.62 },
  { region: 'Хмельницька область', rillya: 35875.09, bagatorichni: 62100.81, sinojati: 7961.92, pasovyscha: 6189.90 },
  { region: 'Черкаська область', rillya: 39605.38, bagatorichni: 87276.82, sinojati: 9952.40, pasovyscha: 6648.41 },
  { region: 'Чернівецька область', rillya: 39155.72, bagatorichni: 73849.61, sinojati: 6540.15, pasovyscha: 5960.64 },
  { region: 'Чернігівська область', rillya: 28327.39, bagatorichni: 65457.62, sinojati: 10236.75, pasovyscha: 5960.64 },
];

export type LandType = 'rillya' | 'bagatorichni' | 'sinojati' | 'pasovyscha';

export const landTypeLabels: Record<LandType, string> = {
  rillya: 'Рілля, перелоги',
  bagatorichni: 'Багаторічні насадження',
  sinojati: 'Сіножаті',
  pasovyscha: 'Пасовища',
};

// Типи земель з НГО (коли проводилась оцінка)
export interface LandTypeWithRate {
  label: string;
  rate: number; // Ставка в відсотках
}

export const landTypesWithNGO: LandTypeWithRate[] = [
  { label: 'Рілля, сіножаті, пасовища', rate: 0.95 },
  { label: 'Багаторічні насадження', rate: 0.57 },
  { label: 'Землі водного фонду', rate: 2.43 },
  { label: 'Закритий ґрунт', rate: 6.33 },
  { label: 'Рілля/пасовища в гірських/поліських зонах', rate: 0.57 },
  { label: 'Багаторічні в гірських/поліських', rate: 0.19 },
];

// Коефіцієнт індексації на 2025 рік
export const INDEXATION_COEFFICIENT_2025 = 1.12;

// Коефіцієнт за замовчуванням (для розрахунку без НГО)
export const DEFAULT_COEFFICIENT = 0.05;

