import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { paymentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { QrCode, CreditCard, Building2, Save } from 'lucide-react';

const PaymentSettings = () => {
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [formData, setFormData] = useState({
      upi_id: '',
      upi_name: '',
      qr_code_url: '',
      bank_account_number: '',
      bank_ifsc: '',
      bank_name: '',
      account_holder_name: '',
   });

   useEffect(() => {
      fetchSettings();
   }, []);

   const fetchSettings = async () => {
      try {
         const data = await paymentsAPI.getSettings();
         if (data) {
            setFormData({
               upi_id: data.upi_id || '',
               upi_name: data.upi_name || '',
               qr_code_url: data.qr_code_url || '',
               bank_account_number: data.bank_account_number || '',
               bank_ifsc: data.bank_ifsc || '',
               bank_name: data.bank_name || '',
               account_holder_name: data.account_holder_name || '',
            });
         }
      } catch (error: any) {
         toast.error('Failed to load payment settings');
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
         await paymentsAPI.updateSettings(formData);
         toast.success('Payment settings updated successfully!');
      } catch (error: any) {
         toast.error('Failed to update payment settings: ' + error.message);
      } finally {
         setSaving(false);
      }
   };

   if (loading) {
      return (
         <AdminLayout>
            <div className="p-6 sm:p-8">
               <Loader text="Loading payment settings..." />
            </div>
         </AdminLayout>
      );
   }

   return (
      <AdminLayout>
         <div className="w-full space-y-6">
            <AdminPageHeading
               eyebrow="Configuration"
               title="Payment & Donation Settings"
               description="Configure UPI, QR codes, and bank details for receiving donations"
            />

            <form onSubmit={handleSubmit} className="space-y-6">
               {/* UPI Settings */}
               <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
                  <CardHeader className="border-b border-border/60 px-4 py-3">
                     <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2">
                           <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                           <CardTitle className="text-sm font-semibold">UPI Payment Details</CardTitle>
                           <p className="text-[11px] text-muted-foreground">Configure UPI ID for quick payments</p>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label htmlFor="upi_id">UPI ID</Label>
                           <Input
                              id="upi_id"
                              placeholder="yourname@paytm"
                              value={formData.upi_id}
                              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="upi_name">UPI Name</Label>
                           <Input
                              id="upi_name"
                              placeholder="Your Name"
                              value={formData.upi_name}
                              onChange={(e) => setFormData({ ...formData, upi_name: e.target.value })}
                           />
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* QR Code */}
               <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
                  <CardHeader className="border-b border-border/60 px-4 py-3">
                     <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2">
                           <QrCode className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                           <CardTitle className="text-sm font-semibold">QR Code</CardTitle>
                           <p className="text-[11px] text-muted-foreground">Upload QR code image URL</p>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="qr_code_url">QR Code Image URL</Label>
                        <Input
                           id="qr_code_url"
                           type="url"
                           placeholder="https://example.com/qr-code.png"
                           value={formData.qr_code_url}
                           onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                        />
                        {formData.qr_code_url && (
                           <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                              <img
                                 src={formData.qr_code_url}
                                 alt="QR Code"
                                 className="w-48 h-48 border border-border/70 rounded-xl object-contain bg-muted/30"
                                 onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                 }}
                              />
                           </div>
                        )}
                     </div>
                  </CardContent>
               </Card>

               {/* Bank Details */}
               <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
                  <CardHeader className="border-b border-border/60 px-4 py-3">
                     <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2">
                           <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                           <CardTitle className="text-sm font-semibold">Bank Account Details</CardTitle>
                           <p className="text-[11px] text-muted-foreground">Bank transfer information</p>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label htmlFor="account_holder_name">Account Holder Name</Label>
                           <Input
                              id="account_holder_name"
                              placeholder="John Doe"
                              value={formData.account_holder_name}
                              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="bank_account_number">Account Number</Label>
                           <Input
                              id="bank_account_number"
                              placeholder="1234567890"
                              value={formData.bank_account_number}
                              onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="bank_ifsc">IFSC Code</Label>
                           <Input
                              id="bank_ifsc"
                              placeholder="SBIN0001234"
                              value={formData.bank_ifsc}
                              onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="bank_name">Bank Name</Label>
                           <Input
                              id="bank_name"
                              placeholder="State Bank of India"
                              value={formData.bank_name}
                              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                           />
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <div className="flex justify-end gap-3">
                  <Button
                     type="submit"
                     disabled={saving}
                     className="rounded-2xl px-6 py-2 text-xs"
                  >
                     <Save className="h-4 w-4 mr-2" />
                     {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
               </div>
            </form>
         </div>
      </AdminLayout>
   );
};

export default PaymentSettings;

