// src/components/dashboard/ProfilePage.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Eye, EyeOff, Briefcase, Building2, Hash, Loader2
} from 'lucide-react';

interface ProfileApiData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  employee: {
    id: number;
    firstName: string;
    nameExtension: string | null;
    middleName: string | null;
    lastName: string;
    username: string | null;
    employeeNo: string | null;
    email: string | null;
    personalEmail: string | null;
    phone: string;
    gender: string;
    birthDate: string;
    placeOfBirth: string | null;
    civilStatus: string | null;
    citizenship: string | null;
    currentStreet: string | null;
    currentBarangay: string | null;
    currentCity: string | null;
    currentProvince: string | null;
    currentZip: string | null;
    permanentStreet: string | null;
    permanentBarangay: string | null;
    permanentCity: string | null;
    permanentProvince: string | null;
    permanentZip: string | null;
  } | null;
  employment: {
    department: { id: number; name: string } | null;
    position: { id: number; title: string } | null;
  } | null;
}

type ProfileTab = 'personal' | 'account' | 'security';

interface PersonalInfo {
  firstName: string;
  nameExtension: string;
  middleName: string;
  lastName: string;
  email: string;
  personalEmail: string;
  phone: string;
  gender: string;
  birthDate: string;
  placeOfBirth: string;
  civilStatus: string;
  citizenship: string;
  currentStreet: string;
  currentBarangay: string;
  currentCity: string;
  currentProvince: string;
  currentZip: string;
  permanentStreet: string;
  permanentBarangay: string;
  permanentCity: string;
  permanentProvince: string;
  permanentZip: string;
}

interface AccountInfo {
  username: string;
  profileImage: string | null;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const TABS: { key: ProfileTab; label: string; icon: typeof User }[] = [
  { key: 'personal', label: 'Personal Information', icon: User },
  { key: 'account', label: 'Account Settings', icon: Shield },
  { key: 'security', label: 'Security', icon: Shield },
];

export function ProfilePage(): React.ReactNode {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileApiData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    nameExtension: '',
    middleName: '',
    lastName: '',
    email: '',
    personalEmail: '',
    phone: '',
    gender: '',
    birthDate: '',
    placeOfBirth: '',
    civilStatus: '',
    citizenship: '',
    currentStreet: '',
    currentBarangay: '',
    currentCity: '',
    currentProvince: '',
    currentZip: '',
    permanentStreet: '',
    permanentBarangay: '',
    permanentCity: '',
    permanentProvince: '',
    permanentZip: '',
  });

  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    username: '',
    profileImage: null,
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        const json = await res.json() as { data?: ProfileApiData; error?: string };
        if (!res.ok || !json.data) return;
        const { data } = json;
        setProfileData(data);
        setProfileImage(data.user.image);
        setAccountInfo({ username: data.employee?.username ?? '', profileImage: data.user.image });
        if (data.employee) {
          const emp = data.employee;
          setPersonalInfo({
            firstName: emp.firstName,
            nameExtension: emp.nameExtension ?? '',
            middleName: emp.middleName ?? '',
            lastName: emp.lastName,
            email: emp.email ?? '',
            personalEmail: emp.personalEmail ?? '',
            phone: emp.phone,
            gender: emp.gender,
            birthDate: emp.birthDate.slice(0, 10),
            placeOfBirth: emp.placeOfBirth ?? '',
            civilStatus: emp.civilStatus ?? '',
            citizenship: emp.citizenship ?? '',
            currentStreet: emp.currentStreet ?? '',
            currentBarangay: emp.currentBarangay ?? '',
            currentCity: emp.currentCity ?? '',
            currentProvince: emp.currentProvince ?? '',
            currentZip: emp.currentZip ?? '',
            permanentStreet: emp.permanentStreet ?? '',
            permanentBarangay: emp.permanentBarangay ?? '',
            permanentCity: emp.permanentCity ?? '',
            permanentProvince: emp.permanentProvince ?? '',
            permanentZip: emp.permanentZip ?? '',
          });
        }
      } catch {
        // Non-blocking — page still renders with empty fields
      } finally {
        setProfileLoading(false);
      }
    }
    void fetchProfile();
  }, []);

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountInfoChange = (field: keyof AccountInfo, value: string) => {
    setAccountInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: personalInfo.firstName,
          nameExtension: personalInfo.nameExtension || null,
          middleName: personalInfo.middleName || null,
          lastName: personalInfo.lastName,
          email: personalInfo.email || null,
          personalEmail: personalInfo.personalEmail || null,
          phone: personalInfo.phone || null,
          gender: personalInfo.gender,
          birthDate: personalInfo.birthDate,
          placeOfBirth: personalInfo.placeOfBirth || null,
          civilStatus: personalInfo.civilStatus || null,
          citizenship: personalInfo.citizenship || null,
          currentStreet: personalInfo.currentStreet || null,
          currentBarangay: personalInfo.currentBarangay || null,
          currentCity: personalInfo.currentCity || null,
          currentProvince: personalInfo.currentProvince || null,
          currentZip: personalInfo.currentZip || null,
          permanentStreet: personalInfo.permanentStreet || null,
          permanentBarangay: personalInfo.permanentBarangay || null,
          permanentCity: personalInfo.permanentCity || null,
          permanentProvince: personalInfo.permanentProvince || null,
          permanentZip: personalInfo.permanentZip || null,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Update failed');
      // Sync display name in profileData
      setProfileData(prev =>
        prev ? { ...prev, user: { ...prev.user, name: `${personalInfo.firstName} ${personalInfo.lastName}` } } : prev
      );
      success('Profile updated', 'Your personal information has been saved successfully.');
    } catch (err) {
      error('Update failed', err instanceof Error ? err.message : 'Failed to update personal information.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccountInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: accountInfo.username }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Update failed');
      success('Account updated', 'Your account settings have been saved successfully.');
    } catch (err) {
      error('Update failed', err instanceof Error ? err.message : 'Failed to update account settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      error('Validation error', 'Please enter your current password.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      error('Validation error', 'New password must be at least 8 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('Validation error', 'New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to change password');
      success('Password changed', 'Your password has been updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error('Password change failed', err instanceof Error ? err.message : 'Failed to update your password.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      error('Invalid file type', 'Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error('File too large', 'Profile photo must be under 5 MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const json = await response.json() as { data?: { imageUrl: string }; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? 'Upload failed');
      }
      if (json.data?.imageUrl) {
        setProfileImage(json.data.imageUrl);
        setAccountInfo(prev => ({ ...prev, profileImage: json.data!.imageUrl }));
      }
      success('Photo updated', 'Your profile photo has been saved.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      error('Upload failed', message);
    } finally {
      setUploadingAvatar(false);
      // Reset the input so the same file can be re-selected if needed.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displayName = profileData?.user.name ?? user?.name ?? 'Employee';
  const displayRole = profileData?.employment?.position?.title ?? profileData?.user.role ?? user?.role ?? 'Employee';
  const displayDepartment = profileData?.employment?.department?.name ?? user?.department ?? 'N/A';
  const displayEmployeeNo = profileData?.employee?.employeeNo ?? user?.employeeId ?? 'N/A';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
              {profileImage ?? accountInfo.profileImage ? (
                <Image
                  src={(profileImage ?? accountInfo.profileImage) as string}
                  alt="Profile photo"
                  width={96}
                  height={96}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                initials
              )}
            </div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition disabled:opacity-70"
              title="Change photo"
            >
              {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            {profileLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <p className="text-muted-foreground mt-1">{displayRole}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Hash size={14} />
                    {displayEmployeeNo}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} />
                    {displayDepartment}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} />
                    {displayRole}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {profileLoading && (
        <Card className="p-6 sm:p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </Card>
      )}

      {!profileLoading && activeTab === 'personal' && (
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5"><User size={14} /> First Name</span>
              </label>
              <Input
                value={personalInfo.firstName}
                onChange={e => handlePersonalInfoChange('firstName', e.target.value)}
                placeholder="Enter first name"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name Extension</label>
              <Input
                value={personalInfo.nameExtension}
                onChange={e => handlePersonalInfoChange('nameExtension', e.target.value)}
                placeholder="e.g. Jr., Sr., III"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Middle Name</label>
              <Input
                value={personalInfo.middleName}
                onChange={e => handlePersonalInfoChange('middleName', e.target.value)}
                placeholder="Enter middle name"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
              <Input
                value={personalInfo.lastName}
                onChange={e => handlePersonalInfoChange('lastName', e.target.value)}
                placeholder="Enter last name"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5"><Mail size={14} /> Work Email</span>
              </label>
              <Input
                type="email"
                value={personalInfo.email}
                onChange={e => handlePersonalInfoChange('email', e.target.value)}
                placeholder="Enter work email"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5"><Mail size={14} /> Personal Email</span>
              </label>
              <Input
                type="email"
                value={personalInfo.personalEmail}
                onChange={e => handlePersonalInfoChange('personalEmail', e.target.value)}
                placeholder="Enter personal email"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5"><Phone size={14} /> Phone</span>
              </label>
              <Input
                value={personalInfo.phone}
                onChange={e => handlePersonalInfoChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
              <select
                value={personalInfo.gender}
                onChange={e => handlePersonalInfoChange('gender', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Birth Date</span>
              </label>
              <Input
                type="date"
                value={personalInfo.birthDate}
                onChange={e => handlePersonalInfoChange('birthDate', e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Place of Birth</label>
              <Input
                value={personalInfo.placeOfBirth}
                onChange={e => handlePersonalInfoChange('placeOfBirth', e.target.value)}
                placeholder="Enter place of birth"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Civil Status</label>
              <select
                value={personalInfo.civilStatus}
                onChange={e => handlePersonalInfoChange('civilStatus', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select civil status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Annulled">Annulled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Citizenship</label>
              <Input
                value={personalInfo.citizenship}
                onChange={e => handlePersonalInfoChange('citizenship', e.target.value)}
                placeholder="e.g. Filipino"
                className="bg-background text-foreground"
              />
            </div>
          </div>

          {/* Current Address */}
          <div className="mt-6 mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Current Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Street</label>
              <Input
                value={personalInfo.currentStreet}
                onChange={e => handlePersonalInfoChange('currentStreet', e.target.value)}
                placeholder="House no., street name"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Barangay</label>
              <Input
                value={personalInfo.currentBarangay}
                onChange={e => handlePersonalInfoChange('currentBarangay', e.target.value)}
                placeholder="Barangay"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">City / Municipality</label>
              <Input
                value={personalInfo.currentCity}
                onChange={e => handlePersonalInfoChange('currentCity', e.target.value)}
                placeholder="City or municipality"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Province</label>
              <Input
                value={personalInfo.currentProvince}
                onChange={e => handlePersonalInfoChange('currentProvince', e.target.value)}
                placeholder="Province"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">ZIP Code</label>
              <Input
                value={personalInfo.currentZip}
                onChange={e => handlePersonalInfoChange('currentZip', e.target.value)}
                placeholder="ZIP code"
                className="bg-background text-foreground"
              />
            </div>
          </div>

          {/* Permanent Address */}
          <div className="mt-6 mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Permanent Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Street</label>
              <Input
                value={personalInfo.permanentStreet}
                onChange={e => handlePersonalInfoChange('permanentStreet', e.target.value)}
                placeholder="House no., street name"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Barangay</label>
              <Input
                value={personalInfo.permanentBarangay}
                onChange={e => handlePersonalInfoChange('permanentBarangay', e.target.value)}
                placeholder="Barangay"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">City / Municipality</label>
              <Input
                value={personalInfo.permanentCity}
                onChange={e => handlePersonalInfoChange('permanentCity', e.target.value)}
                placeholder="City or municipality"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Province</label>
              <Input
                value={personalInfo.permanentProvince}
                onChange={e => handlePersonalInfoChange('permanentProvince', e.target.value)}
                placeholder="Province"
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">ZIP Code</label>
              <Input
                value={personalInfo.permanentZip}
                onChange={e => handlePersonalInfoChange('permanentZip', e.target.value)}
                placeholder="ZIP code"
                className="bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSavePersonalInfo} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}

      {!profileLoading && activeTab === 'account' && (
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Account Settings</h2>
          <div className="space-y-5">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <Input
                value={accountInfo.username}
                onChange={e => handleAccountInfoChange('username', e.target.value)}
                placeholder="Enter username"
                className="bg-background text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                This is your unique username used to log in.
              </p>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <Input
                type="email"
                value={profileData?.user.email ?? ''}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Contact your administrator to change your email address.
              </p>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Employee ID</label>
              <Input
                value={displayEmployeeNo}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
              <Input
                value={displayDepartment}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Role / Position</label>
              <Input
                value={displayRole}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveAccountInfo} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}

      {!profileLoading && activeTab === 'security' && (
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Change Password</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ensure your account stays secure by using a strong password.
          </p>
          <div className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                  className="bg-background text-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={e => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                  className="bg-background text-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Must be at least 8 characters.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-background text-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5">Passwords do not match.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
