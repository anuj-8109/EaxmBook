import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Upload, Lock } from 'lucide-react';

// Image compression function
const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8, maxSizeKB: number = 200): Promise<string> => {
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

                     // If size is acceptable or quality is too low, use it
                     if (sizeKB <= maxSizeKB || currentQuality <= 0.3) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                           resolve(reader.result as string);
                        };
                        reader.onerror = () => {
                           reject(new Error('Failed to read compressed image'));
                        };
                        reader.readAsDataURL(blob);
                     } else {
                        // Try with lower quality
                        tryCompress(currentQuality - 0.1);
                     }
                  },
                  'image/jpeg',
                  currentQuality
               );
            };

            tryCompress(quality);
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

const AdminProfile = () => {
   const { user, setUser } = useAuth();
   const [loading, setLoading] = useState(false);
   const [profile, setProfile] = useState({
      full_name: '',
      username: '',
      email: '',
      avatar_url: ''
   });
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [uploading, setUploading] = useState(false);

   useEffect(() => {
      if (user) {
         loadProfile();
      }
   }, [user]);

   const loadProfile = async () => {
      if (!user) return;

      setProfile({
         full_name: user.full_name || '',
         username: user.username || '',
         email: user.email || '',
         avatar_url: user.avatar_url || ''
      });
   };

   const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setLoading(true);
      try {
         const response = await authAPI.updateProfile({
            full_name: profile.full_name,
            username: profile.username || undefined,
         });

         if (response.user) {
            setUser(response.user);
            toast.success('Profile updated successfully!');
         }
      } catch (error: any) {
         toast.error(error.message || 'Failed to update profile');
      } finally {
         setLoading(false);
      }
   };

   const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !user) return;

      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
         toast.error('Please select a valid image file');
         return;
      }

      setUploading(true);
      try {
         // Compress image before uploading
         const compressedBase64 = await compressImage(file);

         // Check compressed size (should be under 200KB, but allow up to 300KB)
         const base64Size = (compressedBase64.length * 3) / 4 / 1024; // Approximate size in KB

         if (base64Size > 300) {
            toast.error('Image is too large even after compression. Please try a smaller image.');
            setUploading(false);
            return;
         }

         const response = await authAPI.updateAvatar(compressedBase64);

         if (response.user) {
            setUser(response.user);
            setProfile({ ...profile, avatar_url: response.user.avatar_url || '' });
            toast.success('Avatar updated successfully!');
         }
      } catch (error: any) {
         toast.error(error.message || 'Failed to upload avatar');
      } finally {
         setUploading(false);
      }
   };

   const handlePasswordUpdate = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!currentPassword) {
         toast.error('Please enter your current password');
         return;
      }

      if (newPassword !== confirmPassword) {
         toast.error('Passwords do not match');
         return;
      }

      if (newPassword.length < 6) {
         toast.error('Password must be at least 6 characters');
         return;
      }

      setLoading(true);
      try {
         await authAPI.changePassword(currentPassword, newPassword);
         toast.success('Password updated successfully!');
         setCurrentPassword('');
         setNewPassword('');
         setConfirmPassword('');
      } catch (error: any) {
         toast.error(error.message || 'Failed to update password');
      } finally {
         setLoading(false);
      }
   };

   return (
      <AdminLayout>
         <div className="space-y-6">
            <div>
               <h1 className="text-3xl font-bold">Profile Settings</h1>
               <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <Card>
               <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                     <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.full_name?.[0] || 'A'}</AvatarFallback>
                     </Avatar>
                     <div>
                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                           <Button type="button" variant="outline" disabled={uploading} asChild>
                              <span>
                                 <Upload className="h-4 w-4 mr-2" />
                                 {uploading ? 'Uploading...' : 'Upload Avatar'}
                              </span>
                           </Button>
                        </Label>
                        <Input
                           id="avatar-upload"
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleAvatarUpload}
                        />
                        <p className="text-sm text-muted-foreground mt-2">JPG, PNG or WEBP. Image will be automatically compressed.</p>
                     </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label htmlFor="full_name">Full Name</Label>
                           <Input
                              id="full_name"
                              value={profile.full_name}
                              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="username">Username</Label>
                           <Input
                              id="username"
                              value={profile.username}
                              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={profile.email} disabled />
                        <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                     </div>
                     <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                     </Button>
                  </form>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Lock className="h-5 w-5" />
                     Change Password
                  </CardTitle>
                  <CardDescription>Update your password</CardDescription>
               </CardHeader>
               <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                           id="current-password"
                           type="password"
                           value={currentPassword}
                           onChange={(e) => setCurrentPassword(e.target.value)}
                           placeholder="Enter current password"
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                           id="new-password"
                           type="password"
                           value={newPassword}
                           onChange={(e) => setNewPassword(e.target.value)}
                           placeholder="Enter new password"
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                           id="confirm-password"
                           type="password"
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder="Confirm new password"
                           required
                        />
                     </div>
                     <Button type="submit" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                     </Button>
                  </form>
               </CardContent>
            </Card>
         </div>
      </AdminLayout>
   );
};

export default AdminProfile;

