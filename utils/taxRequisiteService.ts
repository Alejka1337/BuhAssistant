import { API_ENDPOINTS, getHeaders } from '@/constants/api';
import { authenticatedFetch } from './authService';

/**
 * Список територіальних громад, які не повинні відображатися на фронтенді
 * (зайві/дублюючі записи по кожній області)
 */
export const EXCLUDED_DISTRICTS = [
  'IВАНО-ФРАНКIВСЬКА ОБЛАСТЬ/ОБЛАСНИЙ',
  'ВОЛИНСЬКА ОБЛАСТЬ',
  'ВIННИЦЬКА ОБЛАСТЬ',
  'ДНIПРОПЕТРОВСЬКА ОБЛАСТЬ',
  'ДОНЕЦЬКА ОБЛАСТЬ/М.ДОНЕЦЬК',
  'ЖИТОМИРСЬКА ОБЛАСТЬ/М.ЖИТОМИР',
  'Закарпатська область',
  'ЗАПОРIЗЬКА ОБЛАСТЬ/М.ЗАПОРIЖЖЯ',
  'М.КИЇВ',
  'КИЇВСЬКА ОБЛАСТЬ',
  'Обласний бюджет Кіровоградської області',
  'ЛУГАНСЬКА ОБЛАСТЬ/М.ЛУГАНСЬК',
  'ЛЬВIВСЬКА ОБЛАСТЬ/М.ЛЬВIВ',
  'МИКОЛАЇВСЬКА ОБЛАСТЬ/М.МИКОЛАЇВ',
  'Одеська область',
  'ПОЛТАВСЬКА ОБЛАСТЬ/М.ПОЛТАВА',
  'РIВНЕНСЬКА ОБЛАСТЬ/М.РIВНЕ',
  'СУМСЬКА ОБЛАСТЬ/М.СУМИ',
  'ТЕРНОПIЛЬСЬКА ОБЛАСТЬ/М.ТЕРНОПIЛЬ',
  'ХАРКIВСЬКА ОБЛАСТЬ/М.ХАРКIВ',
  'ХЕРСОНСЬКА ОБЛАСТЬ/М.ХЕРСОН',
  'ХМЕЛЬНИЦЬКА ОБЛАСТЬ/М.ХМЕЛЬНИЦЬКИЙ',
  'ЧЕРКАСЬКА ОБЛАСТЬ',
  'ЧЕРНIГIВСЬКА ОБЛАСТЬ/М.ЧЕРНIГIВ'

];

export interface TaxRequisite {
  id: number;
  region: string;
  type: TaxRequisiteType;
  district?: string | null;
  recipient_name: string;
  recipient_code: string;
  bank_name: string;
  iban: string;
  classification_code: string;
  description?: string | null;
  created_at: string;
}

export enum TaxRequisiteType {
  ESV_EMPLOYEES = 'esv_employees',
  ESV_FOP = 'esv_fop',
  PDFO_EMPLOYEES = 'pdfo_employees',
  MILITARY_EMPLOYEES = 'military_employees',
  MILITARY_FOP = 'military_fop',
  SINGLE_TAX_FOP = 'single_tax_fop',
}

export interface TaxRequisiteListResponse {
  items: TaxRequisite[];
  total: number;
  limit: number;
  offset: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  imported_count: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  deleted_count: number;
}

/**
 * Отримати структуру регіонів з містами/селами
 */
export const getRegionsWithDistricts = async (): Promise<Record<string, string[]>> => {
  try {
    const response = await fetch(API_ENDPOINTS.TAX_REQUISITES.REGIONS_WITH_DISTRICTS, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Фільтруємо виключені ТГ з кожного регіону
    const filtered: Record<string, string[]> = {};
    for (const [region, districts] of Object.entries(data)) {
      filtered[region] = (districts as string[]).filter(
        district => !EXCLUDED_DISTRICTS.includes(district)
      );
    }
    
    return filtered;
  } catch (error) {
    console.error('Error fetching regions with districts:', error);
    throw error;
  }
};

/**
 * Отримати список доступних міст/сел
 */
export const getDistricts = async (region?: string): Promise<string[]> => {
  try {
    const params = new URLSearchParams();
    if (region) {
      params.append('region', region);
    }

    const url = params.toString() 
      ? `${API_ENDPOINTS.TAX_REQUISITES.DISTRICTS}?${params}`
      : API_ENDPOINTS.TAX_REQUISITES.DISTRICTS;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

/**
 * Отримати податкові реквізити з фільтрацією
 */
export const getRequisites = async (
  district: string,
  region: string,
  type?: TaxRequisiteType,
  limit: number = 50,
  offset: number = 0
): Promise<TaxRequisiteListResponse> => {
  try {
    const params = new URLSearchParams({
      district,
      region,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(`${API_ENDPOINTS.TAX_REQUISITES.BASE}?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching requisites:', error);
    throw error;
  }
};

/**
 * Завантажити файл з реквізитами ЄСВ (тільки для модераторів/адмінів)
 */
export const uploadEsvFile = async (file: File, region: string): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('region', region);

    const response = await authenticatedFetch(`${API_ENDPOINTS.TAX_REQUISITES.UPLOAD_ESV}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading ESV file:', error);
    throw error;
  }
};

/**
 * Завантажити файл з реквізитами для податків (тільки для модераторів/адмінів)
 */
export const uploadTaxFile = async (file: File, region: string): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('region', region);

    const response = await authenticatedFetch(`${API_ENDPOINTS.TAX_REQUISITES.UPLOAD_TAX}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading tax file:', error);
    throw error;
  }
};

/**
 * Видалити всі реквізити з БД (тільки для адмінів з паролем)
 */
export const deleteAllRequisites = async (password: string): Promise<DeleteResponse> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TAX_REQUISITES.BASE}`, {
      method: 'DELETE',
      headers: {
        ...getHeaders(),
        'X-Admin-Password': password,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting requisites:', error);
    throw error;
  }
};

/**
 * Отримати назву типу податку українською
 */
export const getTaxTypeName = (type: TaxRequisiteType): string => {
  const names: Record<TaxRequisiteType, string> = {
    [TaxRequisiteType.ESV_EMPLOYEES]: 'ЄСВ за працівників',
    [TaxRequisiteType.ESV_FOP]: 'ЄСВ ФОП 2/3 група',
    [TaxRequisiteType.PDFO_EMPLOYEES]: 'ПДФО за працівників',
    [TaxRequisiteType.MILITARY_EMPLOYEES]: 'Військовий збір за працівників',
    [TaxRequisiteType.MILITARY_FOP]: 'Військовий збір ФОП 2 група',
    [TaxRequisiteType.SINGLE_TAX_FOP]: 'Єдиний податок ФОП 2 група',
  };
  return names[type] || type;
};

