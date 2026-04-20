import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { settingsAPI } from '@/lib/api';

interface SystemSettings {
  app_name: string;
  logo: string | null;
  favicon: string | null;
}

interface SystemSettingsContextType {
  systemSettings: SystemSettings;
  loading: boolean;
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  systemSettings: {
    app_name: 'Easy Exam Gen',
    logo: null,
    favicon: null,
  },
  loading: true,
});

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider = ({ children }: SystemSettingsProviderProps) => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    app_name: 'Easy Exam Gen',
    logo: null,
    favicon: null,
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch once on mount (page refresh)
    if (!hasFetched) {
      fetchSystemSettings();
      setHasFetched(true);
    }
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const data = await settingsAPI.getSystem();
      const settings = {
        app_name: data.app_name || 'Easy Exam Gen',
        logo: data.logo || null,
        favicon: data.favicon || null,
      };
      
      setSystemSettings(settings);
      
      // Update favicon if available
      if (data.favicon) {
        updateFavicon(data.favicon);
      }
      
      // Update document title
      if (data.app_name) {
        document.title = `${data.app_name} - Mock Test Platform`;
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFavicon = (base64: string) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = base64;
    document.head.appendChild(link);
  };

  return (
    <SystemSettingsContext.Provider value={{ systemSettings, loading }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

