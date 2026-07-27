export interface FactilizaLookupResult {
  success: boolean;
  documentNumber: string;
  name: string; // nombres or razón social
  lastName?: string; // apellido paterno + materno if DNI
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  ubigeo?: string;
}

export class FactilizaService {
  private get token(): string {
    const envToken = process.env.FACTILIZA_TOKEN;
    if (!envToken) {
      console.error('[FactilizaService] ERROR CRITICO: FACTILIZA_TOKEN no está definido en el archivo .env');
      return '';
    }
    return `Bearer ${envToken}`;
  }

  async lookupDocument(type: 'DNI' | 'RUC', number: string): Promise<FactilizaLookupResult> {
    const url = type === 'DNI'
      ? `https://api.factiliza.com/v1/dni/info/${number}`
      : `https://api.factiliza.com/v1/ruc/info/${number}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { success: false, documentNumber: number, name: '' };
      }

      const body = await response.json();
      if (!body || !body.success || !body.data) {
        return { success: false, documentNumber: number, name: '' };
      }

      const data = body.data;

      if (type === 'DNI') {
        const apellidoPaterno = data.apellido_paterno || '';
        const apellidoMaterno = data.apellido_materno || '';
        const lastName = `${apellidoPaterno} ${apellidoMaterno}`.trim();

        return {
          success: true,
          documentNumber: data.numero,
          name: data.nombres || '',
          lastName: lastName,
          address: data.direccion || '',
          department: data.departamento || '',
          province: data.provincia || '',
          district: data.distrito || '',
          ubigeo: data.ubigeo_sunat || '',
        };
      } else {
        return {
          success: true,
          documentNumber: data.numero,
          name: data.nombre_o_razon_social || '',
          lastName: '',
          address: data.direccion || '',
          department: data.departamento || '',
          province: data.provincia || '',
          district: data.distrito || '',
          ubigeo: data.ubigeo_sunat || '',
        };
      }
    } catch (error) {
      return { success: false, documentNumber: number, name: '' };
    }
  }
}
