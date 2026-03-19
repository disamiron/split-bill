// Telegram WebApp global type declaration
interface Window {
  Telegram?: {
    WebApp: {
      initData: string;
      initDataUnsafe: {
        user?: {
          id: number;
          username?: string;
          first_name: string;
          last_name?: string;
          photo_url?: string;
        };
      };
      ready: () => void;
      expand: () => void;
      close: () => void;
    };
  };
}
