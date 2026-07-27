import { SystemSetting } from '../entities/SystemSetting';

export interface ISystemSettingRepository {
  getAll(): Promise<SystemSetting[]>;
  getByKey(key: string): Promise<SystemSetting | null>;
  update(key: string, value: string): Promise<SystemSetting>;
}
