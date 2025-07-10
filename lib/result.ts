export interface ApiResult<T = any> {
  code: string;
  msg: string;
  data?: T;
}

export class Result {
  /**
   * 成功响应（无数据）
   */
  static success(): ApiResult;
  /**
   * 成功响应（有数据）
   */
  static success<T>(data: T): ApiResult<T>;
  /**
   * 成功响应（自定义消息）
   */
  static success<T>(code: string, data: T, msg: string): ApiResult<T>;
  static success<T>(dataOrCode?: T | string, data?: T, msg?: string): ApiResult<T> {
    if (dataOrCode === undefined) {
      return {
        code: "0",
        msg: "成功"
      };
    }
    
    if (typeof dataOrCode === 'string' && data !== undefined && msg !== undefined) {
      return {
        code: dataOrCode,
        msg,
        data
      };
    }
    
    return {
      code: "0",
      msg: "成功",
      data: dataOrCode as T
    };
  }

  /**
   * 错误响应
   */
  static error(code: string, msg: string): ApiResult {
    return {
      code,
      msg
    };
  }
} 