import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { settingsAPI, paymentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { QrCode, CreditCard, Building2, Mail, Shield, Upload, X, Image as ImageIcon, Bot } from 'lucide-react';

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

const defaultForm = {
  smtp: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: 'Easy Exam Gen',
    fromEmail: '',
  },
  google: {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    instructions: '',
  },
  groq: {
    apiKey: '',
    modelName: 'llama-3.3-70b-versatile',
  },
};

type SettingsForm = typeof defaultForm;

const AdminSettings = () => {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [paymentForm, setPaymentForm] = useState({
    upi_id: '',
    upi_name: '',
    qr_code_url: '',
    qr_code_image: '', // Base64 image data
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    account_holder_name: '',
  });
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [settingsData, paymentData] = await Promise.all([
          settingsAPI.get(),
          paymentsAPI.getSettings().catch(() => null),
        ]);

        setForm({
          smtp: { ...defaultForm.smtp, ...(settingsData?.smtp || {}) },
          google: { ...defaultForm.google, ...(settingsData?.google || {}) },
          groq: { ...defaultForm.groq, ...(settingsData?.groq || {}) },
        });

        if (paymentData) {
          setPaymentForm({
            upi_id: paymentData.upi_id || '',
            upi_name: paymentData.upi_name || '',
            qr_code_url: paymentData.qr_code_url || '',
            qr_code_image: paymentData.qr_code_image || '',
            bank_account_number: paymentData.bank_account_number || '',
            bank_ifsc: paymentData.bank_ifsc || '',
            bank_name: paymentData.bank_name || '',
            account_holder_name: paymentData.account_holder_name || '',
          });
          // Set preview from URL or base64
          if (paymentData.qr_code_image) {
            setQrCodePreview(paymentData.qr_code_image);
          } else if (paymentData.qr_code_url) {
            setQrCodePreview(paymentData.qr_code_url);
          }
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (
    section: keyof SettingsForm,
    field: string,
    value: string | number | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({
        smtp: form.smtp,
        google: {
          clientId: form.google.clientId,
          clientSecret: form.google.clientSecret,
        },
        groq: {
          apiKey: form.groq.apiKey,
          modelName: form.groq.modelName,
        },
      });
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingImage(true);
    try {
      // Compress image before converting to base64
      const compressedBase64 = await compressImage(file, 800, 800, 200); // Max 200KB
      setPaymentForm({ ...paymentForm, qr_code_image: compressedBase64, qr_code_url: '' });
      setQrCodePreview(compressedBase64);
      toast.success('Image uploaded and compressed successfully');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to process image');
    } finally {
      setUploadingImage(false);
    }
  };

  const convertUrlToBase64 = async (url: string) => {
    try {
      setUploadingImage(true);

      // Fetch image from URL
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }

      const blob = await response.blob();

      // Validate file type
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      // Convert blob to File object for compression
      const file = new File([blob], 'qr-code.jpg', { type: blob.type || 'image/jpeg' });

      // Compress image before converting to base64
      const compressedBase64 = await compressImage(file, 800, 800, 200); // Max 200KB

      setPaymentForm({
        ...paymentForm,
        qr_code_image: compressedBase64,
        qr_code_url: url // Keep URL for reference
      });
      setQrCodePreview(compressedBase64);
      toast.success('Image converted to base64 and compressed successfully');
    } catch (error: any) {
      console.error('Error converting URL to base64:', error);
      toast.error(error.message || 'Failed to convert image. Please check the URL or upload directly.');
      // Keep the URL in case user wants to try again
      if (url) {
        setQrCodePreview(url);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setPaymentForm({ ...paymentForm, qr_code_image: '', qr_code_url: '' });
    setQrCodePreview('');
    toast.success('Image removed');
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      await paymentsAPI.updateSettings(paymentForm);
      toast.success('Payment settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save payment settings');
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeading
          eyebrow="Configuration"
          title="Platform Settings"
          description="Configure email delivery, Google SSO, and payment methods for donations."
        />

        {loading ? (
          <div className="rounded-[1.5rem] border border-border/70 py-16 text-center">
            <Loader text="Loading settings..." />
          </div>
        ) : (
          <Tabs defaultValue="smtp" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-2xl border border-border/70">
              <TabsTrigger value="smtp" className="rounded-xl text-xs">
                <Mail className="h-4 w-4 mr-2" />
                SMTP Settings
              </TabsTrigger>
              <TabsTrigger value="google" className="rounded-xl text-xs">
                <Shield className="h-4 w-4 mr-2" />
                Google SSO
              </TabsTrigger>
              <TabsTrigger value="payment" className="rounded-xl text-xs">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Settings
              </TabsTrigger>
              <TabsTrigger value="groq" className="rounded-xl text-xs">
                <Bot className="h-4 w-4 mr-2" />
                AI API (Groq)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="smtp" className="space-y-6 mt-6">
              <Card className="rounded-[1.5rem] border border-border/70">
                <CardHeader>
                  <CardTitle>SMTP (Email Delivery)</CardTitle>
                  <CardDescription>
                    Used for OTP login, signup verification, and forgot password emails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={form.smtp.host}
                        onChange={(e) => handleInputChange('smtp', 'host', e.target.value)}
                        placeholder="smtp.yourprovider.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={form.smtp.port}
                        onChange={(e) => handleInputChange('smtp', 'port', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-user">Username</Label>
                      <Input
                        id="smtp-user"
                        value={form.smtp.user}
                        onChange={(e) => handleInputChange('smtp', 'user', e.target.value)}
                        placeholder="no-reply@easyexamgen.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-password">App Password / API Key</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        value={form.smtp.password}
                        onChange={(e) => handleInputChange('smtp', 'password', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-from-name">From Name</Label>
                      <Input
                        id="smtp-from-name"
                        value={form.smtp.fromName}
                        onChange={(e) => handleInputChange('smtp', 'fromName', e.target.value)}
                        placeholder="Easy Exam Gen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-from-email">From Email</Label>
                      <Input
                        id="smtp-from-email"
                        value={form.smtp.fromEmail}
                        onChange={(e) => handleInputChange('smtp', 'fromEmail', e.target.value)}
                        placeholder="alerts@easyexamgen.com"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Secure Connection (SSL/TLS)</p>
                      <p className="text-sm text-muted-foreground">
                        Enable for port 465 or any provider that requires TLS.
                      </p>
                    </div>
                    <Switch
                      checked={form.smtp.secure}
                      onCheckedChange={(checked) => handleInputChange('smtp', 'secure', checked)}
                    />
                  </div>
                  <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-2">
                    <p className="font-semibold">Setup tips:</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>For Gmail, enable 2FA and create an app password.</li>
                      <li>Amazon SES, SendGrid, Mailgun etc. also work—use their SMTP credentials.</li>
                      <li>
                        Make sure the from email matches the verified sender/domain on your provider.
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="rounded-2xl px-5 py-2 text-xs">
                  {saving ? 'Saving...' : 'Save SMTP Settings'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="google" className="space-y-6 mt-6">
              <Card className="rounded-[1.5rem] border border-border/70">
                <CardHeader>
                  <CardTitle>Google Single Sign-On</CardTitle>
                  <CardDescription>
                    Allow learners to login instantly using their Google accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="google-client-id">Client ID</Label>
                      <Input
                        id="google-client-id"
                        value={form.google.clientId}
                        onChange={(e) => handleInputChange('google', 'clientId', e.target.value)}
                        placeholder="xxxxxxxx.apps.googleusercontent.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="google-client-secret">Client Secret</Label>
                      <Input
                        id="google-client-secret"
                        type="password"
                        value={form.google.clientSecret}
                        onChange={(e) => handleInputChange('google', 'clientSecret', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="google-instructions">Setup Notes / Redirect URI</Label>
                    <Textarea
                      id="google-instructions"
                      value={form.google.instructions}
                      onChange={(e) => handleInputChange('google', 'instructions', e.target.value)}
                      placeholder={`Redirect URI: ${window.location.origin}/google-callback\nAllowed origins: ${window.location.origin}`}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Provide guidance for your team (optional). This field is not stored on the server.
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-2">
                    <p className="font-semibold">Google Cloud Console steps:</p>
                    <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                      <li>Create an OAuth 2.0 Client ID (type: Web Application).</li>
                      <li>
                        Add Authorized JavaScript Origin:{' '}
                        <span className="font-medium">{window.location.origin}</span>
                      </li>
                      <li>
                        Add Authorized Redirect URI:{' '}
                        <span className="font-medium">
                          {window.location.origin}/google-callback
                        </span>
                      </li>
                      <li>Copy the Client ID & Secret into this form and save.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="rounded-2xl px-5 py-2 text-xs">
                  {saving ? 'Saving...' : 'Save Google SSO Settings'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6 mt-6">
              <Card className="rounded-[1.5rem] border border-border/70">
                <CardHeader>
                  <CardTitle>Payment & Donation Settings</CardTitle>
                  <CardDescription>
                    Configure UPI, QR codes, and bank details for receiving donations from users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* UPI Settings */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">UPI Payment Details</h3>
                        <p className="text-xs text-muted-foreground">Configure UPI ID for quick payments</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="upi_id">UPI ID</Label>
                        <Input
                          id="upi_id"
                          placeholder="yourname@paytm"
                          value={paymentForm.upi_id}
                          onChange={(e) => setPaymentForm({ ...paymentForm, upi_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="upi_name">UPI Name</Label>
                        <Input
                          id="upi_name"
                          placeholder="Your Name"
                          value={paymentForm.upi_name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, upi_name: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2">
                        <QrCode className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">QR Code</h3>
                        <p className="text-xs text-muted-foreground">Upload QR code image or enter URL</p>
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="qr_code_upload">Upload QR Code Image</Label>
                        <div className="mt-2">
                          <label
                            htmlFor="qr_code_upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {uploadingImage ? (
                                <>
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                  <p className="text-xs text-muted-foreground">Uploading...</p>
                                </>
                              ) : qrCodePreview ? (
                                <>
                                  <ImageIcon className="h-8 w-8 text-primary mb-2" />
                                  <p className="text-xs text-muted-foreground">Click to change image</p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, GIF up to 2MB</p>
                                </>
                              )}
                            </div>
                            <input
                              id="qr_code_upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      </div>

                      {/* OR Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/60"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      {/* URL Input */}
                      <div className="space-y-2">
                        <Label htmlFor="qr_code_url">QR Code Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="qr_code_url"
                            type="url"
                            placeholder="https://example.com/qr-code.png"
                            value={paymentForm.qr_code_url}
                            onChange={(e) => {
                              setPaymentForm({ ...paymentForm, qr_code_url: e.target.value });
                            }}
                            onBlur={(e) => {
                              // When user leaves the field, try to convert if URL is valid
                              if (e.target.value && e.target.value.startsWith('http')) {
                                convertUrlToBase64(e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              // Convert on Enter key
                              if (e.key === 'Enter' && paymentForm.qr_code_url && paymentForm.qr_code_url.startsWith('http')) {
                                e.preventDefault();
                                convertUrlToBase64(paymentForm.qr_code_url);
                              }
                            }}
                            className="flex-1"
                          />
                          {paymentForm.qr_code_url && paymentForm.qr_code_url.startsWith('http') && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => convertUrlToBase64(paymentForm.qr_code_url)}
                              disabled={uploadingImage}
                              className="shrink-0"
                            >
                              {uploadingImage ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                  Converting...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Convert to Base64
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter URL and press Enter or click "Convert to Base64" to automatically convert the image
                        </p>
                      </div>

                      {/* Preview */}
                      {qrCodePreview && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Preview: {paymentForm.qr_code_image ? '(Base64)' : '(URL)'}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveImage}
                              className="h-7 text-xs text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                          <div className="relative inline-block">
                            <img
                              src={qrCodePreview}
                              alt="QR Code Preview"
                              className="w-48 h-48 border border-border/70 rounded-xl object-contain bg-muted/30"
                              onError={async (e) => {
                                // If URL fails, try to convert to base64
                                if (paymentForm.qr_code_url && !paymentForm.qr_code_image) {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  toast.info('Converting URL to base64...');
                                  await convertUrlToBase64(paymentForm.qr_code_url);
                                } else {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  toast.error('Failed to load image. Please check the URL or upload a new image.');
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Bank Account Details</h3>
                        <p className="text-xs text-muted-foreground">Bank transfer information</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account_holder_name">Account Holder Name</Label>
                        <Input
                          id="account_holder_name"
                          placeholder="John Doe"
                          value={paymentForm.account_holder_name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, account_holder_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_account_number">Account Number</Label>
                        <Input
                          id="bank_account_number"
                          placeholder="1234567890"
                          value={paymentForm.bank_account_number}
                          onChange={(e) => setPaymentForm({ ...paymentForm, bank_account_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_ifsc">IFSC Code</Label>
                        <Input
                          id="bank_ifsc"
                          placeholder="SBIN0001234"
                          value={paymentForm.bank_ifsc}
                          onChange={(e) => setPaymentForm({ ...paymentForm, bank_ifsc: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          placeholder="State Bank of India"
                          value={paymentForm.bank_name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSavePayment}
                      disabled={savingPayment}
                      className="rounded-2xl px-5 py-2 text-xs"
                    >
                      {savingPayment ? 'Saving...' : 'Save Payment Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groq" className="space-y-6 mt-6">
              <Card className="rounded-[1.5rem] border border-border/70">
                <CardHeader>
                  <CardTitle>AI Configuration (Groq)</CardTitle>
                  <CardDescription>
                    Configure Groq AI API details for intelligent question and test generations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="groq-api-key">Groq API Key</Label>
                      <Input
                        id="groq-api-key"
                        type="password"
                        placeholder="gsk_..."
                        value={form.groq.apiKey}
                        onChange={(e) => handleInputChange('groq', 'apiKey', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groq-model-name">Groq Model Name</Label>
                      <Input
                        id="groq-model-name"
                        placeholder="llama-3.3-70b-versatile"
                        value={form.groq.modelName}
                        onChange={(e) => handleInputChange('groq', 'modelName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-2">
                    <p className="font-semibold">Setup tips for AI Integrations:</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Sign up for an API key at <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">console.groq.com</a></li>
                      <li>Use supported models like <code>llama-3.3-70b-versatile</code> for best formatting.</li>
                      <li>It overrides any <code>GROQ_API_KEY</code> set in your deployment environment variables when available.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="rounded-2xl px-5 py-2 text-xs">
                  {saving ? 'Saving...' : 'Save AI Settings'}
                </Button>
              </div>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;


