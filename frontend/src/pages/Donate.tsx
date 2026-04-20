import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
   Heart, Copy, CheckCircle2, QrCode, CreditCard,
   Building2, Smartphone, Download, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentsAPI } from '@/lib/api';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import Loader from '@/components/Loader';

interface PaymentSettings {
   upi_id?: string;
   upi_name?: string;
   qr_code_url?: string;
   qr_code_image?: string;
   bank_account_number?: string;
   bank_ifsc?: string;
   bank_name?: string;
   account_holder_name?: string;
}

const Donate = () => {
   const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
   const [loading, setLoading] = useState(true);
   const [donationAmount, setDonationAmount] = useState('');
   const [customAmount, setCustomAmount] = useState('');
   const [donorName, setDonorName] = useState('');
   const [donorMessage, setDonorMessage] = useState('');
   const [copiedField, setCopiedField] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState('upi');

   useEffect(() => {
      fetchPaymentSettings();
   }, []);

   const fetchPaymentSettings = async () => {
      try {
         const settings = await paymentsAPI.getSettings();
         setPaymentSettings(settings || {});
      } catch (error: any) {
         console.error('Failed to load payment settings:', error);
         toast.error('Failed to load payment information');
      } finally {
         setLoading(false);
      }
   };

   const handleCopy = async (text: string, field: string) => {
      try {
         await navigator.clipboard.writeText(text);
         setCopiedField(field);
         toast.success('Copied to clipboard!');
         setTimeout(() => setCopiedField(null), 2000);
      } catch (error) {
         toast.error('Failed to copy');
      }
   };

   const handleQuickAmount = (amount: string) => {
      setDonationAmount(amount);
      setCustomAmount('');
   };

   const handleCustomAmount = (value: string) => {
      setCustomAmount(value);
      setDonationAmount('');
   };

   const getDisplayAmount = () => {
      if (customAmount) return customAmount;
      if (donationAmount) return donationAmount;
      return '0';
   };

   const handlePayment = async (method: string) => {
      const amount = customAmount || donationAmount;
      if (!amount || parseFloat(amount) <= 0) {
         toast.error('Please enter a valid donation amount');
         return;
      }

      try {
         const paymentData = {
            amount: parseFloat(amount),
            method,
            donor_name: donorName || undefined,
            message: donorMessage || undefined,
            status: 'pending',
         };

         await paymentsAPI.create(paymentData);
         toast.success('Payment details saved! Please complete the payment using the details below.');
      } catch (error: any) {
         toast.error('Failed to process payment: ' + error.message);
      }
   };

   if (loading) {
      return (
         <UserLayout>
            <div className="p-6 sm:p-8">
               <Loader text="Loading donation options..." />
            </div>
         </UserLayout>
      );
   }

   const quickAmounts = ['50', '100', '250', '500', '1000', '2000'];

   return (
      <UserLayout>
         <div className="space-y-6">
            <AdminPageHeading
               eyebrow="Support Us"
               title="Make a Donation"
               description="Your contribution helps us maintain and improve the platform for all students"
            />

            {/* Donation Amount Selection */}
            <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
               <CardHeader className="border-b border-border/60 px-4 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Heart className="h-4 w-4 text-red-500" />
                     Select Donation Amount
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                     <Label>Quick Select (₹)</Label>
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {quickAmounts.map(amount => (
                           <Button
                              key={amount}
                              type="button"
                              variant={donationAmount === amount ? 'default' : 'outline'}
                              className="rounded-xl"
                              onClick={() => handleQuickAmount(amount)}
                           >
                              ₹{amount}
                           </Button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label>Or Enter Custom Amount (₹)</Label>
                     <Input
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        className="rounded-xl"
                        min="1"
                     />
                  </div>
                  {getDisplayAmount() !== '0' && (
                     <div className="rounded-xl bg-primary/10 border border-primary/30 p-4">
                        <p className="text-xs text-muted-foreground mb-1">Your Donation</p>
                        <p className="text-2xl font-bold text-primary">₹{getDisplayAmount()}</p>
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Optional Donor Information */}
            <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
               <CardHeader className="border-b border-border/60 px-4 py-3">
                  <CardTitle className="text-sm font-semibold">Donor Information (Optional)</CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                     <Label>Your Name</Label>
                     <Input
                        placeholder="Enter your name (optional)"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="rounded-xl"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Message (Optional)</Label>
                     <Textarea
                        placeholder="Leave a message..."
                        value={donorMessage}
                        onChange={(e) => setDonorMessage(e.target.value)}
                        className="rounded-xl min-h-[100px]"
                     />
                  </div>
               </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
               <CardHeader className="border-b border-border/60 px-4 py-3">
                  <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                     Choose your preferred payment method
                  </p>
               </CardHeader>
               <CardContent className="p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                     <TabsList className="grid w-full grid-cols-3 rounded-xl border border-border/70">
                        <TabsTrigger value="upi" className="rounded-lg text-xs">
                           <Smartphone className="h-4 w-4 mr-2" />
                           UPI
                        </TabsTrigger>
                        <TabsTrigger value="qr" className="rounded-lg text-xs">
                           <QrCode className="h-4 w-4 mr-2" />
                           QR Code
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="rounded-lg text-xs">
                           <Building2 className="h-4 w-4 mr-2" />
                           Bank Transfer
                        </TabsTrigger>
                     </TabsList>

                     {/* UPI Payment */}
                     <TabsContent value="upi" className="space-y-4 mt-4">
                        {paymentSettings?.upi_id ? (
                           <div className="space-y-4">
                              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                                 <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">UPI ID</Label>
                                    <Button
                                       variant="ghost"
                                       size="sm"
                                       className="rounded-xl"
                                       onClick={() => handleCopy(paymentSettings.upi_id!, 'upi_id')}
                                    >
                                       {copiedField === 'upi_id' ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                       ) : (
                                          <Copy className="h-4 w-4" />
                                       )}
                                    </Button>
                                 </div>
                                 <div className="rounded-lg bg-background p-3 border border-border/60">
                                    <p className="font-mono text-sm font-semibold">{paymentSettings.upi_id}</p>
                                 </div>
                                 {paymentSettings.upi_name && (
                                    <p className="text-xs text-muted-foreground">
                                       Name: {paymentSettings.upi_name}
                                    </p>
                                 )}
                              </div>
                              <Button
                                 className="w-full rounded-2xl"
                                 onClick={() => handlePayment('upi')}
                                 disabled={getDisplayAmount() === '0'}
                              >
                                 <CreditCard className="h-4 w-4 mr-2" />
                                 Proceed with UPI Payment
                              </Button>
                           </div>
                        ) : (
                           <div className="rounded-xl border border-border/70 bg-muted/20 p-8 text-center">
                              <p className="text-sm text-muted-foreground">UPI payment details not available</p>
                           </div>
                        )}
                     </TabsContent>

                     {/* QR Code Payment */}
                     <TabsContent value="qr" className="space-y-4 mt-4">
                        {(paymentSettings?.qr_code_url || paymentSettings?.qr_code_image) ? (
                           <div className="space-y-4">
                              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                                 <Label className="text-sm font-semibold">Scan QR Code</Label>
                                 <div className="flex justify-center">
                                    <div className="rounded-xl border-4 border-background bg-background p-4 shadow-lg">
                                       <img
                                          src={paymentSettings.qr_code_image || paymentSettings.qr_code_url}
                                          alt="Payment QR Code"
                                          className="w-64 h-64 object-contain"
                                       />
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <Button
                                       variant="outline"
                                       className="flex-1 rounded-xl"
                                       onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = paymentSettings.qr_code_image || paymentSettings.qr_code_url!;
                                          link.download = 'payment-qr-code.png';
                                          link.click();
                                       }}
                                    >
                                       <Download className="h-4 w-4 mr-2" />
                                       Download QR
                                    </Button>
                                    <Button
                                       variant="outline"
                                       className="flex-1 rounded-xl"
                                       onClick={async () => {
                                          try {
                                             await navigator.share({
                                                title: 'Payment QR Code',
                                                text: 'Scan this QR code to make a payment',
                                                url: paymentSettings.qr_code_image || paymentSettings.qr_code_url!,
                                             });
                                          } catch (error) {
                                             handleCopy(paymentSettings.qr_code_image || paymentSettings.qr_code_url!, 'qr_code');
                                          }
                                       }}
                                    >
                                       <Share2 className="h-4 w-4 mr-2" />
                                       Share
                                    </Button>
                                 </div>
                              </div>
                              <Button
                                 className="w-full rounded-2xl"
                                 onClick={() => handlePayment('qr_code')}
                                 disabled={getDisplayAmount() === '0'}
                              >
                                 <QrCode className="h-4 w-4 mr-2" />
                                 Proceed with QR Payment
                              </Button>
                           </div>
                        ) : (
                           <div className="rounded-xl border border-border/70 bg-muted/20 p-8 text-center">
                              <p className="text-sm text-muted-foreground">QR Code not available</p>
                           </div>
                        )}
                     </TabsContent>

                     {/* Bank Transfer */}
                     <TabsContent value="bank" className="space-y-4 mt-4">
                        {paymentSettings?.bank_account_number ? (
                           <div className="space-y-4">
                              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                                 <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                       <Label className="text-sm font-semibold">Account Number</Label>
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          className="rounded-xl"
                                          onClick={() => handleCopy(paymentSettings.bank_account_number!, 'account')}
                                       >
                                          {copiedField === 'account' ? (
                                             <CheckCircle2 className="h-4 w-4 text-green-600" />
                                          ) : (
                                             <Copy className="h-4 w-4" />
                                          )}
                                       </Button>
                                    </div>
                                    <div className="rounded-lg bg-background p-3 border border-border/60">
                                       <p className="font-mono text-sm font-semibold">{paymentSettings.bank_account_number}</p>
                                    </div>
                                 </div>

                                 {paymentSettings.bank_ifsc && (
                                    <div className="space-y-2">
                                       <div className="flex items-center justify-between">
                                          <Label className="text-sm font-semibold">IFSC Code</Label>
                                          <Button
                                             variant="ghost"
                                             size="sm"
                                             className="rounded-xl"
                                             onClick={() => handleCopy(paymentSettings.bank_ifsc!, 'ifsc')}
                                          >
                                             {copiedField === 'ifsc' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                             ) : (
                                                <Copy className="h-4 w-4" />
                                             )}
                                          </Button>
                                       </div>
                                       <div className="rounded-lg bg-background p-3 border border-border/60">
                                          <p className="font-mono text-sm font-semibold">{paymentSettings.bank_ifsc}</p>
                                       </div>
                                    </div>
                                 )}

                                 {paymentSettings.bank_name && (
                                    <div className="space-y-2">
                                       <Label className="text-sm font-semibold">Bank Name</Label>
                                       <p className="text-sm">{paymentSettings.bank_name}</p>
                                    </div>
                                 )}

                                 {paymentSettings.account_holder_name && (
                                    <div className="space-y-2">
                                       <Label className="text-sm font-semibold">Account Holder Name</Label>
                                       <p className="text-sm">{paymentSettings.account_holder_name}</p>
                                    </div>
                                 )}
                              </div>
                              <Button
                                 className="w-full rounded-2xl"
                                 onClick={() => handlePayment('bank_transfer')}
                                 disabled={getDisplayAmount() === '0'}
                              >
                                 <Building2 className="h-4 w-4 mr-2" />
                                 Proceed with Bank Transfer
                              </Button>
                           </div>
                        ) : (
                           <div className="rounded-xl border border-border/70 bg-muted/20 p-8 text-center">
                              <p className="text-sm text-muted-foreground">Bank details not available</p>
                           </div>
                        )}
                     </TabsContent>
                  </Tabs>
               </CardContent>
            </Card>

            {/* Thank You Message */}
            <Card className="rounded-[1.5rem] border border-primary/30 bg-primary/5 shadow-lg">
               <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Thank You for Your Support!</h3>
                  <p className="text-sm text-muted-foreground">
                     Your donation helps us continue providing quality education resources to students.
                     After making the payment, please keep the transaction ID for reference.
                  </p>
               </CardContent>
            </Card>
         </div>
      </UserLayout>
   );
};

export default Donate;

