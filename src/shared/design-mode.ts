export type GetStyleInfo = (resolved: any) => {
  className: string;
  styles: Record<string, string> | null;
};

export function initDesignMode(getStyleInfo: GetStyleInfo) {
  return function reselect() {
    // 最低限：何もしない関数
  };
}