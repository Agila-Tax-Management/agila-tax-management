// src/components/dashboard/ProfilePage.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Eye, EyeOff, Briefcase, Building2, Hash
} from 'lucide-react';

type ProfileTab = 'personal' | 'account' | 'security';

interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
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

  // Personal Information state (mock data)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: 'Genesis',
    middleName: '',
    lastName: 'Esdrilon',
    email: 'genesis.esdrilon@agilatax.com',
    phone: '+63 912 345 6789',
    address: 'Cebu City, Cebu, Philippines',
    gender: 'Male',
    birthDate: '1998-05-15',
  });

  // Account Settings state
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    username: 'genesis.esdrilon',
    profileImage: null,
  });

  // Security / Password state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      success('Profile updated', 'Your personal information has been saved successfully.');
    } catch {
      error('Update failed', 'Failed to update personal information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccountInfo = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      success('Account updated', 'Your account settings have been saved successfully.');
    } catch {
      error('Update failed', 'Failed to update account settings. Please try again.');
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
      await new Promise(resolve => setTimeout(resolve, 800));
      success('Password changed', 'Your password has been updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      error('Password change failed', 'Failed to update your password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {accountInfo.profileImage ? (
                <Image
                  src={accountInfo.profileImage}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition opacity-0 group-hover:opacity-100"
              title="Change photo"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.name ?? 'Employee'}</h1>
            <p className="text-muted-foreground mt-1">{user?.role ?? 'Employee'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Hash size={14} />
                {user?.employeeId ?? 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 size={14} />
                {user?.department ?? 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} />
                {user?.role ?? 'N/A'}
              </span>
            </div>
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
      {activeTab === 'personal' && (
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
                <span className="flex items-center gap-1.5"><Mail size={14} /> Email</span>
              </label>
              <Input
                type="email"
                value={personalInfo.email}
                onChange={e => handlePersonalInfoChange('email', e.target.value)}
                placeholder="Enter email address"
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5"><MapPin size={14} /> Address</span>
              </label>
              <Input
                value={personalInfo.address}
                onChange={e => handlePersonalInfoChange('address', e.target.value)}
                placeholder="Enter full address"
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

      {activeTab === 'account' && (
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
                value={personalInfo.email}
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
                value={user?.employeeId ?? ''}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
              <Input
                value={user?.department ?? ''}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-1.5">Role / Position</label>
              <Input
                value={user?.role ?? ''}
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

      {activeTab === 'security' && (
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
