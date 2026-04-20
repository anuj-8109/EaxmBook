import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { settingsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { Upload, X, Image as ImageIcon, Globe, FileText } from 'lucide-react';

// Image compression function
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, maxSizeKB = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to get under maxSizeKB
        const tryCompress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;
              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                // Convert blob to base64
                const reader2 = new FileReader();
                reader2.onloadend = () => {
                  resolve(reader2.result as string);
                };
                reader2.onerror = () => {
                  reject(new Error('Failed to convert to base64'));
                };
                reader2.readAsDataURL(blob);
              } else {
                // Reduce quality and try again
                tryCompress(currentQuality - 0.1);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        tryCompress(0.9);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

// Favicon compression (smaller size)
const compressFavicon = (file: File, maxWidth = 32, maxHeight = 32, maxSizeKB = 50): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const tryCompress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;
              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                const reader2 = new FileReader();
                reader2.onloadend = () => {
                  resolve(reader2.result as string);
                };
                reader2.onerror = () => {
                  reject(new Error('Failed to convert to base64'));
                };
                reader2.readAsDataURL(blob);
              } else {
                tryCompress(currentQuality - 0.1);
              }
            },
            'image/png',
            currentQuality
          );
        };

        tryCompress(0.9);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

const System = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemForm, setSystemForm] = useState({
    app_name: 'Easy Exam Gen',
    logo: null as string | null,
    favicon: null as string | null,
  });

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsAPI.getSystem();
      setSystemForm({
        app_name: data.app_name || 'Easy Exam Gen',
        logo: data.logo || null,
        favicon: data.favicon || null,
      });
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
      toast.error(error.message || 'Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (type: 'logo' | 'favicon', file: File | null) => {
    if (!file) return;

    try {
      let compressed: string;
      if (type === 'logo') {
        compressed = await compressImage(file, 800, 800, 200);
      } else {
        compressed = await compressFavicon(file, 32, 32, 50);
      }

      setSystemForm(prev => ({ ...prev, [type]: compressed }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
    } catch (error: any) {
      console.error('Error compressing image:', error);
      toast.error(error.message || 'Failed to process image');
    }
  };

  const convertUrlToBase64 = async (type: 'logo' | 'favicon', url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });

      if (type === 'logo') {
        const compressed = await compressImage(file, 800, 800, 200);
        setSystemForm(prev => ({ ...prev, logo: compressed }));
      } else {
        const compressed = await compressFavicon(file, 32, 32, 50);
        setSystemForm(prev => ({ ...prev, favicon: compressed }));
      }

      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} converted successfully`);
    } catch (error: any) {
      console.error('Error converting URL:', error);
      toast.error('Failed to load image. Please check the URL or upload a new image.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateSystem(systemForm);
      toast.success('System settings updated successfully');

      // Update favicon in document
      if (systemForm.favicon) {
        updateFavicon(systemForm.favicon);
      }

      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating system settings:', error);
      toast.error(error.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
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

  const removeImage = (type: 'logo' | 'favicon') => {
    setSystemForm(prev => ({ ...prev, [type]: null }));
    if (type === 'favicon') {
      // Reset to default favicon
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = '/favicon.svg';
      document.head.appendChild(link);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">


        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Configure your application's branding and identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              {/* App Name */}
              <div className="space-y-2">
                <Label htmlFor="app_name">Application Name</Label>
                <Input
                  id="app_name"
                  value={systemForm.app_name}
                  onChange={(e) => setSystemForm(prev => ({ ...prev, app_name: e.target.value }))}
                  placeholder="Easy Exam Gen"
                />
                <p className="text-sm text-muted-foreground">
                  Set the name that will be displayed throughout the application
                </p>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                {systemForm.logo && (
                  <div className="relative inline-block mb-3">
                    <img
                      src={systemForm.logo}
                      alt="Logo preview"
                      className="h-32 w-auto rounded-lg border border-border object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage('logo')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('logo', file);
                      }}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex gap-2">
                      <Input
                        id="logo-url"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const url = (e.target as HTMLInputElement).value;
                            if (url) convertUrlToBase64('logo', url);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = document.getElementById('logo-url') as HTMLInputElement;
                          if (input.value) convertUrlToBase64('logo', input.value);
                        }}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your application logo (recommended: 800x800px, max 200KB)
                </p>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label>Favicon</Label>
                {systemForm.favicon && (
                  <div className="relative inline-block mb-3">
                    <img
                      src={systemForm.favicon}
                      alt="Favicon preview"
                      className="h-16 w-16 rounded border border-border object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage('favicon')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      id="favicon-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('favicon', file);
                      }}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex gap-2">
                      <Input
                        id="favicon-url"
                        type="url"
                        placeholder="https://example.com/favicon.png"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const url = (e.target as HTMLInputElement).value;
                            if (url) convertUrlToBase64('favicon', url);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = document.getElementById('favicon-url') as HTMLInputElement;
                          if (input.value) convertUrlToBase64('favicon', input.value);
                        }}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your favicon (recommended: 32x32px, max 50KB, PNG format)
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={saving} size="lg">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default System;

