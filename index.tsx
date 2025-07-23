
import React, { useState, createContext, useContext, useEffect, useRef, useCallback, CSSProperties, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle: any;
  }
}

// --- TYPE DEFINITIONS ---
interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'user';
}

interface Users {
  [key: string]: User;
}

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: number;
}

interface Chat {
  id:string;
  userId: string;
  messages: Message[];
  unread: number;
}

interface Channel {
  id: string;
  name: string;
  avatar: string;
  messages: Message[];
  unread: number;
  status: 'approved' | 'pending';
}

interface Story {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string; // For text stories or caption for media
  mediaUrl?: string; // Base64 data URL for image/video
}


interface StoryCollection {
  userId: string;
  stories: Story[];
}

interface PendingRequest {
  id: string;
  type: 'friend' | 'channel';
  fromUserId: string;
  date: Date;
  channelName?: string;
  channelId?: string;
}

interface AdminSettings {
    forceLocalNetwork: boolean;
    adsenseClientId: string;
}


// --- I18N (Internationalization) SETUP ---
const translations = {
  en: {
    chats: 'Chats',
    welcome: 'Welcome to Qamar',
    selectChat: 'Select a chat to start messaging or create a new conversation.',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    networkInternet: 'Global Internet',
    networkLocal: 'Qamar Network',
    language: 'Language',
    voiceCall: 'Voice Call',
    videoCall: 'Video Call',
    calling: 'Calling...',
    endCall: 'End Call',
    goBack: 'Go Back',
    typeMessage: 'Type a message...',
    send: 'Send',
    channels: 'Channels',
    requestNewChannel: 'Request New Channel',
    newChannel: 'New Channel',
    channelName: 'Channel Name',
    request: 'Request',
    cancel: 'Cancel',
    pending: 'Pending',
    channelRequestSent: 'Channel request sent for approval.',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    save: 'Save',
    uploadPhoto: 'Upload Photo',
    name: 'Name',
    appearance: 'Appearance',
    getPremium: 'Get Premium Storage',
    premiumDescription: 'Complete the 3 tasks below to unlock 150MB of temporary cloud storage for 24 hours.',
    watchAd: 'Watch Ad',
    watched: 'Watched',
    adsWatched: '{count}/3 Ads Watched',
    premiumUnlocked: 'Premium Unlocked!',
    premiumUnlockedMessage: 'You can now enjoy all features for the next 24 hours.',
    watchOnYouTube: 'Watch on YouTube',
    browseInstagram: 'Browse Instagram',
    anotherAd: 'Watch Video Ad',
    adTitle: 'Viewing Ad',
    close: 'Close',
    premiumActive: 'Premium Active',
    callsAndMessages: 'Calls & Messages',
    setupProfile: 'Set Up Your Profile',
    setupIntro: "First, let's create your public profile.",
    yourName: 'Your Name',
    yourNameToAppear: "This is how you'll appear in Qamar.",
    startMessaging: 'Start Messaging',
    loadingChats: 'Loading...',
    noChats: 'No chats yet.',
    noChannels: 'No channels available. Request a new one to get started.',
    addFriend: 'Add Friend',
    friendId: 'Friend ID',
    enterFriendId: "Enter friend's ID",
    add: 'Add',
    friendRequestSent: 'Friend request sent.',
    addFriendSupportMessage: 'Hello. This messenger was built with the tireless effort of our team. To support us, please watch an ad. Thank you!',
    addStory: 'Add Story',
    storyPosted: 'Story posted successfully!',
    premiumStorage: 'Premium Storage',
    storageUsed: '{used}MB / 150MB Used',
    timeRemaining: 'Time Remaining: {time}',
    saveMessage: 'Save Message',
    messageSaved: 'Message saved to cloud.',
    storageFull: 'Cloud storage is full.',
    adminPanel: 'Admin Panel',
    userManagement: 'User Management',
    makeAdmin: 'Make Admin',
    removeAdmin: 'Remove Admin',
    roleUser: 'User',
    roleAdmin: 'Admin',
    confirmAction: 'Confirm Action',
    confirmRoleChange: 'Are you sure you want to change the role for {name}?',
    confirm: 'Confirm',
    userRoleUpdated: 'User role updated successfully.',
    pendingRequests: 'Pending Requests',
    noPendingRequests: 'No pending requests.',
    approve: 'Approve',
    reject: 'Reject',
    friendRequestFrom: 'Friend request from {name}',
    channelRequest: 'New channel request: "{name}"',
    requestApproved: 'Request approved.',
    requestRejected: 'Request rejected.',
    networkSettings: 'Network Settings',
    forceLocalNetwork: 'Force Local Network for All Users',
    forceLocalNetworkDesc: 'When enabled, all users are forced to use the local network.',
    adSettings: 'Ad Settings',
    adsenseClientId: 'Google AdSense Client ID',
    settingsSaved: 'Settings saved successfully.',
    sponsored: 'Sponsored',
    post: 'Post',
    whatsOnYourMind: "What's on your mind? (caption)",
    settings: 'Settings',
    menu: 'Menu',
    supportMe: 'Support Me',
    supportMeTitle: 'Support Qamar',
    supportMeDescription: 'Watch an ad to support the developer. Your contribution helps keep the app running and updated. Thank you!',
    thankYou: 'Thank You!',
    supportThankYouMessage: 'Your support means a lot!',
    adminPassword: 'Admin Password',
    enterAdminPassword: 'Enter admin password to continue',
    incorrectPassword: 'Incorrect password.',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    passwordUpdated: 'Password updated successfully.',
    passwordMismatch: 'New passwords do not match.',
    incorrectCurrentPassword: 'Incorrect current password.',
    passwordEmpty: 'Password cannot be empty.',
    removePassword: 'Remove Password',
    confirmRemovePassword: 'Are you sure you want to remove the admin password? The admin panel will be accessible without a password.',
    passwordRemoved: 'Admin password removed.',
    uploadMedia: 'Upload Photo/Video',
    mediaPreview: 'Media Preview',
    setPassword: 'Set Password',
    profileSaved: 'Profile saved.',
    accountSettings: 'Account Settings',
    adInStory: 'Advertisement',
    continueToStory: 'Continue',
    earnings: 'Earnings',
    earningsDescription: 'Watch ads to earn credits. You receive 30% of the ad revenue.',
    yourBalance: 'Your Balance: {balance}',
    watchAdToEarn: 'Watch Ad to Earn',
    earnedCredit: 'You earned {amount}! Your new balance is {balance}.',
    networkMode: 'Network Mode',
  },
  fa: {
    chats: 'چت‌ها',
    welcome: 'به قمر خوش آمدید',
    selectChat: 'یک چت را برای شروع پیام‌رسانی انتخاب کنید یا یک گفتگوی جدید ایجاد کنید.',
    yesterday: 'دیروز',
    daysAgo: '{days} روز پیش',
    networkInternet: 'اینترنت بین‌المللی',
    networkLocal: 'شبکه قمر',
    language: 'زبان',
    voiceCall: 'تماس صوتی',
    videoCall: 'تماس تصویری',
    calling: 'در حال تماس...',
    endCall: 'پایان تماس',
    goBack: 'بازگشت',
    typeMessage: 'پیام خود را بنویسید...',
    send: 'ارسال',
    channels: 'کانال‌ها',
    requestNewChannel: 'درخواست کانال جدید',
    newChannel: 'کانال جدید',
    channelName: 'نام کانال',
    request: 'درخواست',
    cancel: 'لغو',
    pending: 'در انتظار',
    channelRequestSent: 'درخواست کانال برای تایید ارسال شد.',
    profile: 'پروفایل',
    editProfile: 'ویرایش پروفایل',
    save: 'ذخیره',
    uploadPhoto: 'آپلود عکس',
    name: 'نام',
    appearance: 'ظاهر',
    getPremium: 'دریافت فضای ذخیره‌سازی ویژه',
    premiumDescription: 'برای باز کردن قفل ۱۵۰ مگابایت فضای ابری موقت برای ۲۴ ساعت، ۳ وظیفه زیر را انجام دهید.',
    watchAd: 'تماشای تبلیغ',
    watched: 'دیده شد',
    adsWatched: '{count}/3 تبلیغ دیده شده',
    premiumUnlocked: 'ویژه فعال شد!',
    premiumUnlockedMessage: 'شما اکنون می‌توانید از تمام ویژگی‌ها برای ۲۴ ساعت آینده لذت ببرید.',
    watchOnYouTube: 'تماشا در یوتیوب',
    browseInstagram: 'گردش در اینستاگرام',
    anotherAd: 'تماشای تبلیغ ویدیویی',
    adTitle: 'در حال مشاهده تبلیغ',
    close: 'بستن',
    premiumActive: 'ویژه فعال است',
    callsAndMessages: 'تماس‌ها و پیام‌ها',
    setupProfile: 'پروفایل خود را تنظیم کنید',
    setupIntro: 'ابتدا، پروفایل عمومی خود را ایجاد کنیم.',
    yourName: 'نام شما',
    yourNameToAppear: 'این نامی است که در قمر نمایش داده می‌شود.',
    startMessaging: 'شروع پیام‌رسانی',
    loadingChats: 'در حال بارگذاری...',
    noChats: 'هنوز چتی وجود ندارد.',
    noChannels: 'هیچ کانالی موجود نیست. برای شروع یک کانال جدید درخواست دهید.',
    addFriend: 'افزودن دوست',
    friendId: 'شناسه دوست',
    enterFriendId: 'شناسه دوست را وارد کنید',
    add: 'افزودن',
    friendRequestSent: 'درخواست دوستی ارسال شد.',
    addFriendSupportMessage: 'سلام. این پیام‌رسان با زحمت شبانه‌روزی تیم ما ساخته شده. برای حمایت از ما، لطفاً یک تبلیغ ببینید. ممنون.',
    addStory: 'افزودن استوری',
    storyPosted: 'استوری با موفقیت ارسال شد!',
    premiumStorage: 'فضای ذخیره‌سازی ویژه',
    storageUsed: '{used}MB / 150MB استفاده شده',
    timeRemaining: 'زمان باقی‌مانده: {time}',
    saveMessage: 'ذخیره پیام',
    messageSaved: 'پیام در فضای ابری ذخیره شد.',
    storageFull: 'فضای ذخیره‌سازی ابری پر است.',
    adminPanel: 'پنل مدیریت',
    userManagement: 'مدیریت کاربران',
    makeAdmin: 'ارتقا به ادمین',
    removeAdmin: 'حذف ادمین',
    roleUser: 'کاربر',
    roleAdmin: 'ادمین',
    confirmAction: 'تایید عملیات',
    confirmRoleChange: 'آیا از تغییر نقش برای {name} مطمئن هستید؟',
    confirm: 'تایید',
    userRoleUpdated: 'نقش کاربر با موفقیت به‌روزرسانی شد.',
    pendingRequests: 'درخواست‌های در انتظار',
    noPendingRequests: 'هیچ درخواست در انتظاری وجود ندارد.',
    approve: 'تایید',
    reject: 'رد کردن',
    friendRequestFrom: 'درخواست دوستی از طرف {name}',
    channelRequest: 'درخواست کانال جدید: "{name}"',
    requestApproved: 'درخواست تایید شد.',
    requestRejected: 'درخواست رد شد.',
    networkSettings: 'تنظیمات شبکه',
    forceLocalNetwork: 'اجبار به استفاده از شبکه محلی برای همه کاربران',
    forceLocalNetworkDesc: 'در صورت فعال بودن، همه کاربران مجبور به استفاده از شبکه محلی می‌شوند.',
    adSettings: 'تنظیمات تبلیغات',
    adsenseClientId: 'شناسه کلاینت گوگل ادسنس',
    settingsSaved: 'تنظیمات با موفقیت ذخیره شد.',
    sponsored: 'ویژه',
    post: 'ارسال',
    whatsOnYourMind: 'چه چیزی در ذهن دارید؟ (کپشن)',
    settings: 'تنظیمات',
    menu: 'منو',
    supportMe: 'حمایت',
    supportMeTitle: 'از قمر حمایت کنید',
    supportMeDescription: 'برای حمایت از توسعه‌دهنده یک تبلیغ تماشا کنید. مشارکت شما به فعال ماندن و به‌روزرسانی برنامه کمک می‌کند. متشکریم!',
    thankYou: 'متشکریم!',
    supportThankYouMessage: 'حمایت شما ارزش زیادی دارد!',
    adminPassword: 'رمز عبور ادمین',
    enterAdminPassword: 'برای ادامه، رمز عبور ادمین را وارد کنید',
    incorrectPassword: 'رمز عبور اشتباه است.',
    changePassword: 'تغییر رمز عبور',
    currentPassword: 'رمز عبور فعلی',
    newPassword: 'رمز عبور جدید',
    confirmNewPassword: 'تایید رمز عبور جدید',
    passwordUpdated: 'رمز عبور با موفقیت به‌روزرسانی شد.',
    passwordMismatch: 'رمزهای عبور جدید مطابقت ندارند.',
    incorrectCurrentPassword: 'رمز عبور فعلی اشتباه است.',
    passwordEmpty: 'رمز عبور نمی‌تواند خالی باشد.',
    removePassword: 'حذف رمز عبور',
    confirmRemovePassword: 'آیا از حذف رمز عبور ادمین مطمئن هستید؟ پنل مدیریت بدون نیاز به رمز قابل دسترس خواهد بود.',
    passwordRemoved: 'رمز عبور ادمین حذف شد.',
    uploadMedia: 'آپلود عکس/ویدیو',
    mediaPreview: 'پیش‌نمایش رسانه',
    setPassword: 'تنظیم رمز عبور',
    profileSaved: 'پروفایل ذخیره شد.',
    accountSettings: 'تنظیمات حساب',
    adInStory: 'تبلیغ',
    continueToStory: 'ادامه',
    earnings: 'درآمدها',
    earningsDescription: 'برای کسب اعتبار، تبلیغات را تماشا کنید. ۳۰٪ از درآمد تبلیغات به شما اختصاص می‌یابد.',
    yourBalance: 'موجودی شما: {balance}',
    watchAdToEarn: 'برای کسب درآمد تبلیغ ببینید',
    earnedCredit: 'شما {amount} کسب کردید! موجودی جدید شما {balance} است.',
    networkMode: 'حالت شبکه',
  },
  ar: {
    chats: 'الدردشات',
    welcome: 'أهلاً بك في قمر',
    selectChat: 'اختر دردشة لبدء المراسلة أو إنشاء محادثة جديدة.',
    yesterday: 'أمس',
    daysAgo: 'قبل {days} أيام',
    networkInternet: 'الإنترنت العالمي',
    networkLocal: 'شبكة قمر',
    language: 'اللغة',
    voiceCall: 'مكالمة صوتية',
    videoCall: 'مكالمة فيديو',
    calling: 'جارٍ الاتصال...',
    endCall: 'إنهاء المكالمة',
    goBack: 'رجوع',
    typeMessage: 'اكتب رسالة...',
    send: 'إرسال',
    channels: 'القنوات',
    requestNewChannel: 'طلب قناة جديدة',
    newChannel: 'قناة جديدة',
    channelName: 'اسم القناة',
    request: 'طلب',
    cancel: 'إلغاء',
    pending: 'قيد الانتظار',
    channelRequestSent: 'تم إرسال طلب القناة للموافقة.',
    profile: 'الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    save: 'حفظ',
    uploadPhoto: 'تحميل صورة',
    name: 'الاسم',
    appearance: 'المظهر',
    getPremium: 'الحصول على تخزين مميز',
    premiumDescription: 'أكمل المهام الثلاث أدناه لفتح 150 ميجابايت من التخزين السحابي المؤقت لمدة 24 ساعة.',
    watchAd: 'مشاهدة إعلان',
    watched: 'تمت المشاهدة',
    adsWatched: '{count}/3 إعلانات تمت مشاهدتها',
    premiumUnlocked: 'تم تفعيل المميز!',
    premiumUnlockedMessage: 'يمكنك الآن الاستمتاع بجميع الميزات لمدة 24 ساعة القادمة.',
    watchOnYouTube: 'مشاهدة على يوتيوب',
    browseInstagram: 'تصفح انستجرام',
    anotherAd: 'مشاهدة إعلان فيديو',
    adTitle: 'مشاهدة الإعلان',
    close: 'إغلاق',
    premiumActive: 'المميز مفعل',
    callsAndMessages: 'المكالمات والرسائل',
    setupProfile: 'إعداد ملفك الشخصي',
    setupIntro: 'أولاً، لنقم بإنشاء ملفك الشخصي العام.',
    yourName: 'اسمك',
    yourNameToAppear: 'هكذا ستظهر في قمر.',
    startMessaging: 'بدء المراسلة',
    loadingChats: 'جارٍ التحميل...',
    noChats: 'لا توجد دردشات بعد.',
    noChannels: 'لا توجد قنوات متاحة. اطلب قناة جديدة للبدء.',
    addFriend: 'إضافة صديق',
    friendId: 'معرف الصديق',
    enterFriendId: 'أدخل معرف الصديق',
    add: 'إضافة',
    friendRequestSent: 'تم إرسال طلب الصداقة.',
    addFriendSupportMessage: 'مرحباً. تم بناء هذا الماسنجر بجهود دؤوبة من فريقنا. لدعمنا، يرجى مشاهدة إعلان. شكراً لك.',
    addStory: 'إضافة قصة',
    storyPosted: 'تم نشر القصة بنجاح!',
    premiumStorage: 'تخزين مميز',
    storageUsed: '{used} ميجابايت / 150 ميجابايت مستخدمة',
    timeRemaining: 'الوقت المتبقي: {time}',
    saveMessage: 'حفظ الرسالة',
    messageSaved: 'تم حفظ الرسالة في السحابة.',
    storageFull: 'التخزين السحابي ممتلئ.',
    adminPanel: 'لوحة التحكم',
    userManagement: 'إدارة المستخدمين',
    makeAdmin: 'جعله مسؤولاً',
    removeAdmin: 'إزالة المسؤول',
    roleUser: 'مستخدم',
    roleAdmin: 'مسؤول',
    confirmAction: 'تأكيد الإجراء',
    confirmRoleChange: 'هل أنت متأكد من أنك تريد تغيير دور {name}؟',
    confirm: 'تأكيد',
    userRoleUpdated: 'تم تحديث دور المستخدم بنجاح.',
    pendingRequests: 'الطلبات المعلقة',
    noPendingRequests: 'لا توجد طلبات معلقة.',
    approve: 'موافقة',
    reject: 'رفض',
    friendRequestFrom: 'طلب صداقة من {name}',
    channelRequest: 'طلب قناة جديدة: "{name}"',
    requestApproved: 'تمت الموافقة على الطلب.',
    requestRejected: 'تم رفض الطلب.',
    networkSettings: 'إعدادات الشبكة',
    forceLocalNetwork: 'فرض الشبكة المحلية على جميع المستخدمين',
    forceLocalNetworkDesc: 'عند التمكين، يتم إجبار جميع المستخدمين على استخدام الشبكة المحلية.',
    adSettings: 'إعدادات الإعلانات',
    adsenseClientId: 'معرف عميل Google AdSense',
    settingsSaved: 'تم حفظ الإعدادات بنجاح.',
    sponsored: 'برعاية',
    post: 'نشر',
    whatsOnYourMind: 'بماذا تفكر؟ (تعليق)',
    settings: 'الإعدادات',
    menu: 'القائمة',
    supportMe: 'ادعمني',
    supportMeTitle: 'ادعم قمر',
    supportMeDescription: 'شاهد إعلانًا لدعم المطور. مساهمتك تساعد في الحفاظ على تشغيل التطبيق وتحديثه. شكرًا لك!',
    thankYou: 'شكرًا لك!',
    supportThankYouMessage: 'دعمك يعني الكثير!',
    adminPassword: 'كلمة مرور المسؤول',
    enterAdminPassword: 'أدخل كلمة مرور المسؤول للمتابعة',
    incorrectPassword: 'كلمة المرور غير صحيحة.',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
    passwordUpdated: 'تم تحديث كلمة المرور بنجاح.',
    passwordMismatch: 'كلمتا المرور الجديدتان غير متطابقتين.',
    incorrectCurrentPassword: 'كلمة المرور الحالية غير صحيحة.',
    passwordEmpty: 'لا يمكن أن تكون كلمة المرور فارغة.',
    removePassword: 'إزالة كلمة المرور',
    confirmRemovePassword: 'هل أنت متأكد من أنك تريد إزالة كلمة مرور المسؤول؟ ستكون لوحة الإدارة متاحة بدون كلمة مرور.',
    passwordRemoved: 'تمت إزالة كلمة مرور المسؤول.',
    uploadMedia: 'تحميل صورة/فيديو',
    mediaPreview: 'معاينة الوسائط',
    setPassword: 'تعيين كلمة المرور',
    profileSaved: 'تم حفظ الملف الشخصي.',
    accountSettings: 'إعدادات الحساب',
    adInStory: 'إعلان',
    continueToStory: 'متابعة',
    earnings: 'الأرباح',
    earningsDescription: 'شاهد الإعلانات لكسب رصيد. يتم تخصيص 30٪ من عائدات الإعلانات لك.',
    yourBalance: 'رصيدك: {balance}',
    watchAdToEarn: 'شاهد إعلانًا للكسب',
    earnedCredit: 'لقد ربحت {amount}! رصيدك الجديد هو {balance}.',
    networkMode: 'وضع الشبكة',
  },
  ps: {
    chats: 'چټونه',
    welcome: 'قمر ته ښه راغلاست',
    selectChat: 'د پیغام رسولو پیل کولو لپاره یو چټ وټاکئ یا نوې خبرې اترې جوړې کړئ.',
    yesterday: 'پرون',
    daysAgo: '{days} ورځې وړاندې',
    networkInternet: 'نړیوال انټرنیټ',
    networkLocal: 'قمر شبکه',
    language: 'ژبه',
    voiceCall: 'غږیز کال',
    videoCall: 'ویډیويي کال',
    calling: 'کال روان دی...',
    endCall: 'کال پای ته ورسوه',
    goBack: 'بېرته',
    typeMessage: 'یو پیغام ولیکئ...',
    send: 'لیږل',
    channels: 'کانالونه',
    requestNewChannel: 'د نوي کانال غوښتنه',
    newChannel: 'نوی کانال',
    channelName: 'د کانال نوم',
    request: 'غوښتنه',
    cancel: 'لغوه کول',
    pending: 'په تمه',
    channelRequestSent: 'د کانال غوښتنه د تایید لپاره واستول شوه.',
    profile: 'پروفایل',
    editProfile: 'پروفایل سمول',
    save: 'خوندي کول',
    uploadPhoto: 'عکس اپلوډ کړئ',
    name: 'نوم',
    appearance: 'بڼه',
    getPremium: 'پریمیم ذخیره ترلاسه کړئ',
    premiumDescription: 'د 24 ساعتونو لپاره د 150MB لنډمهاله کلاوډ ذخیره خلاصولو لپاره لاندې 3 دندې بشپړې کړئ.',
    watchAd: 'اعلان وګورئ',
    watched: 'ولیدل شو',
    adsWatched: '{count}/3 اعلانونه ولیدل شول',
    premiumUnlocked: 'پریمیم خلاص شو!',
    premiumUnlockedMessage: 'تاسو اوس کولی شئ د راتلونکو 24 ساعتونو لپاره له ټولو ځانګړتیاو څخه خوند واخلئ.',
    watchOnYouTube: 'په یوټیوب کې وګورئ',
    browseInstagram: 'په انسټاګرام کې وګورئ',
    anotherAd: 'ویډیو اعلان وګورئ',
    adTitle: 'د اعلان لیدل',
    close: 'بندول',
    premiumActive: 'پریمیم فعال دی',
    callsAndMessages: 'کالونه او پیغامونه',
    setupProfile: 'خپل پروفایل تنظیم کړئ',
    setupIntro: 'لومړی، راځئ چې ستاسو عامه پروفایل جوړ کړو.',
    yourName: 'ستاسو نوم',
    yourNameToAppear: 'دا به تاسو په قمر کې څنګه ښکارئ.',
    startMessaging: 'پیغام رسول پیل کړئ',
    loadingChats: 'بارول...',
    noChats: 'تر اوسه کوم چټ نشته.',
    noChannels: 'کوم کانال نشته. د پیل کولو لپاره د نوي کانال غوښتنه وکړئ.',
    addFriend: 'ملګری اضافه کړئ',
    friendId: 'د ملګري ID',
    enterFriendId: 'د ملګري ID داخل کړئ',
    add: 'اضافه کول',
    friendRequestSent: 'د ملګرتیا غوښتنه واستول شوه.',
    addFriendSupportMessage: 'سلام. دا مسنجر زموږ د ټیم د نه ستړي کیدونکو هڅو په پایله کې جوړ شوی دی. زموږ د ملاتړ لپاره، مهرباني وکړئ یو اعلان وګورئ. مننه.',
    addStory: 'کیسه اضافه کړئ',
    storyPosted: 'کیسه په بریالیتوب سره خپره شوه!',
    premiumStorage: 'پریمیم ذخیره',
    storageUsed: '{used}MB / 150MB کارول شوې',
    timeRemaining: 'پاتې وخت: {time}',
    saveMessage: 'پیغام خوندي کړئ',
    messageSaved: 'پیغام په کلاوډ کې خوندي شو.',
    storageFull: 'کلاوډ ذخیره ډکه ده.',
    adminPanel: 'د مدیر پینل',
    userManagement: 'د کاروونکو مدیریت',
    makeAdmin: 'مدیر جوړ کړئ',
    removeAdmin: 'مدیر لرې کړئ',
    roleUser: 'کارن',
    roleAdmin: 'مدیر',
    confirmAction: 'عمل تایید کړئ',
    confirmRoleChange: 'ایا تاسو ډاډه یاست چې غواړئ د {name} لپاره رول بدل کړئ؟',
    confirm: 'تایید',
    userRoleUpdated: 'د کارن رول په بریالیتوب سره تازه شو.',
    pendingRequests: 'په تمه غوښتنې',
    noPendingRequests: 'کومې په تمه غوښتنې نشته.',
    approve: 'تایید',
    reject: 'ردول',
    friendRequestFrom: 'د {name} لخوا د ملګرتیا غوښتنه',
    channelRequest: 'د نوي کانال غوښتنه: "{name}"',
    requestApproved: 'غوښتنه تایید شوه.',
    requestRejected: 'غوښتنه رد شوه.',
    networkSettings: 'د شبکې تنظیمات',
    forceLocalNetwork: 'ټول کاروونکي محلي شبکې کارولو ته اړ کړئ',
    forceLocalNetworkDesc: 'کله چې فعال شي، ټول کاروونکي د محلي شبکې کارولو ته اړ کیږي.',
    adSettings: 'د اعلانونو تنظیمات',
    adsenseClientId: 'د ګوګل اډسینس پیرودونکي ID',
    settingsSaved: 'تنظیمات په بریالیتوب سره خوندي شول.',
    sponsored: 'سپانسر شوی',
    post: 'خپرول',
    whatsOnYourMind: 'ستاسو په ذهن کې څه دي؟ (کیپشن)',
    settings: 'تنظیمات',
    menu: 'مینو',
    supportMe: 'زما ملاتړ وکړئ',
    supportMeTitle: 'د قمر ملاتړ وکړئ',
    supportMeDescription: 'د پراختیا کونکي ملاتړ لپاره یو اعلان وګورئ. ستاسو ونډه د اپلیکیشن چلولو او تازه کولو کې مرسته کوي. مننه!',
    thankYou: 'مننه!',
    supportThankYouMessage: 'ستاسو ملاتړ ډیر ارزښت لري!',
    adminPassword: 'د مدیر پټنوم',
    enterAdminPassword: 'د دوام لپاره د مدیر پټنوم داخل کړئ',
    incorrectPassword: 'پټنوم ناسم دی.',
    changePassword: 'پټنوم بدل کړئ',
    currentPassword: 'اوسنی پټنوم',
    newPassword: 'نوی پټنوم',
    confirmNewPassword: 'نوی پټنوم تایید کړئ',
    passwordUpdated: 'پټنوم په بریالیتوب سره تازه شو.',
    passwordMismatch: 'نوي پټنومونه سره سمون نه خوري.',
    incorrectCurrentPassword: 'اوسنی پټنوم ناسم دی.',
    passwordEmpty: 'پټنوم خالي نشي کیدی.',
    removePassword: 'پټنوم لرې کړئ',
    confirmRemovePassword: 'ایا تاسو ډاډه یاست چې غواړئ د مدیر پټنوم لرې کړئ؟ د مدیر پینل به پرته له پټنوم څخه د لاسرسي وړ وي.',
    passwordRemoved: 'د مدیر پټنوم لرې شو.',
    uploadMedia: 'عکس/ویډیو اپلوډ کړئ',
    mediaPreview: 'د رسنیو مخکتنه',
    setPassword: 'پټنوم وټاکئ',
    profileSaved: 'پروفایل خوندي شو.',
    accountSettings: 'د حساب تنظیمات',
    adInStory: 'اعلان',
    continueToStory: 'ادامه ورکړئ',
    earnings: 'ګټه',
    earningsDescription: 'د کریډیټ ګټلو لپاره اعلانونه وګورئ. د اعلاناتو 30٪ عاید تاسو ته تخصیص شوی.',
    yourBalance: 'ستاسو بیلانس: {balance}',
    watchAdToEarn: 'د ګټلو لپاره اعلان وګورئ',
    earnedCredit: 'تاسو {amount} وګټل! ستاسو نوی بیلانس {balance} دی.',
    networkMode: 'د شبکې حالت',
  },
};

const LanguageContext = createContext({
  lang: 'en',
  setLang: (_lang: string) => {},
  t: (key: string, _replacements?: Record<string, string>) => key,
});

const useI18N = () => useContext(LanguageContext);

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem('app-lang') || 'en');

  const setLang = (newLang: string) => {
    localStorage.setItem('app-lang', newLang);
    setLangState(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = ['fa', 'ar', 'ps'].includes(newLang) ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    setLang(lang);
  }, [lang]);

  const t = (key: string, replacements?: Record<string, string>) => {
    let translation = translations[lang]?.[key] || translations.en[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{${rKey}}`, replacements[rKey]);
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- MOCK DATA ---
const initialUsers: Users = {
  'user-0': { id: 'user-0', name: 'Me', avatar: 'https://i.pravatar.cc/150?u=user-0', role: 'admin' },
  'user-1': { id: 'user-1', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=user-1', role: 'user' },
};

const initialChats: Chat[] = [];

const initialChannels: Channel[] = [];

const initialStories: StoryCollection[] = [];

const initialPendingRequests: PendingRequest[] = [
    {
        id: 'req-friend-1',
        type: 'friend',
        fromUserId: 'user-1',
        date: new Date(Date.now() - 86400000), // 1 day ago
    }
];

// --- UTILITY FUNCTIONS ---
const formatDate = (timestamp: number, t: (key: string, replacements?: Record<string, string>) => string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return t('yesterday');
  }
  if (diffDays > 1 && diffDays < 7) {
    return t('daysAgo', { days: diffDays.toString() });
  }
  return date.toLocaleDateString();
};

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};


// --- UI COMPONENTS ---

const Icon = ({ type, className = '', style }: { type: string, className?: string, style?: CSSProperties }) => {
  const icons: { [key: string]: JSX.Element } = {
    chats: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    channels: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />,
    menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />,
    back: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
    voiceCall: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
    videoCall: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    endCall: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l6-6M22 8L16 2M16.5 12.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3 12.5c0-5.25 4.25-9.5 9.5-9.5S22 7.25 22 12.5" />,
    microphone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
    camera: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    add: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
    addStory: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />,
    globe: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.705 11a8.001 8.001 0 001.328-5.385 8.002 8.002 0 00-4.01-2.435M16.295 11a8.001 8.001 0 01-1.328-5.385 8.002 8.002 0 014.01-2.435M12 21a9 9 0 100-18 9 9 0 000 18z" />,
    wifi: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13a10.606 10.606 0 0114 0M8.5 16.5a5.303 5.303 0 017 0M12 20.01h.01" />,
    premium: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6.172 7.828a4 4 0 015.656 0M9 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />,
    language: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m0 16V5m0 0L6 8m3-3l3 3m5 0h-3" />,
    save: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9-3 9 3v-8.382z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.184-1.268-.5-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.184-1.268.5-1.857M12 12a3 3 0 100-6 3 3 0 000 6z" />,
    inbox: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    upload: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
    cloud: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4a4.5 4.5 0 011.3-3.14A8 8 0 1115.4 0A4.5 4.5 0 0117 12a4 4 0 01-4 4H7z" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" className={`sidebar-icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={style}>{icons[type]}</svg>;
};

const Spinner = () => <div className="spinner"></div>;

const LoadingScreen = () => {
    const { t } = useI18N();
    return (
        <div className="loading-container">
            <Spinner />
            <p>{t('loadingChats')}</p>
        </div>
    );
};

const Toast = ({ message }: { message: string }) => {
    if (!message) return null;
    return (
        <div className="toast-container">
            <div className="toast">{message}</div>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, onCancel, onConfirm, title, message }: { isOpen: boolean, onCancel: () => void, onConfirm: () => void, title: string, message: string }) => {
    if (!isOpen) return null;
    const { t } = useI18N();

    return (
      <div className="modal-backdrop" onClick={onCancel}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{title}</h3>
            <button onClick={onCancel} className="modal-close-btn">&times;</button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-actions">
            <button onClick={onCancel} className="btn-secondary">{t('cancel')}</button>
            <button onClick={onConfirm} className="btn-primary danger">{t('confirm')}</button>
          </div>
        </div>
      </div>
    );
};

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider"></span>
    </label>
);

const Sidebar = ({ activePanel, setActivePanel, t, currentUser }: { activePanel: string, setActivePanel: (panel: string) => void, t: (key: string) => string, currentUser: User | null }) => {
  if (!currentUser) return null; // Don't render sidebar if no user yet

  return (
    <nav className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-nav">
        <button className={`sidebar-btn ${activePanel === 'menu' ? 'active' : ''}`} onClick={() => setActivePanel('menu')} aria-label={t('menu')} title={t('menu')}>
          <Icon type="menu" />
        </button>
        <button className={`sidebar-btn ${activePanel === 'chats' ? 'active' : ''}`} onClick={() => setActivePanel('chats')} aria-label={t('chats')} title={t('chats')}>
          <Icon type="chats" />
        </button>
        <button className={`sidebar-btn ${activePanel === 'channels' ? 'active' : ''}`} onClick={() => setActivePanel('channels')} aria-label={t('channels')} title={t('channels')}>
          <Icon type="channels" />
        </button>
      </div>
    </nav>
  );
};

const BottomNavBar = ({ activePanel, setActivePanel, t }: { activePanel: string, setActivePanel: (panel: string) => void, t: (key: string) => string }) => {
  return (
    <nav className="bottom-nav-bar" aria-label="Main Navigation">
      <button className={`bottom-nav-btn ${activePanel === 'menu' ? 'active' : ''}`} onClick={() => setActivePanel('menu')} aria-label={t('menu')}>
        <Icon type="menu" />
        <span className="bottom-nav-label">{t('menu')}</span>
      </button>
      <button className={`bottom-nav-btn ${activePanel === 'chats' ? 'active' : ''}`} onClick={() => setActivePanel('chats')} aria-label={t('chats')}>
        <Icon type="chats" />
        <span className="bottom-nav-label">{t('chats')}</span>
      </button>
      <button className={`bottom-nav-btn ${activePanel === 'channels' ? 'active' : ''}`} onClick={() => setActivePanel('channels')} aria-label={t('channels')}>
        <Icon type="channels" />
        <span className="bottom-nav-label">{t('channels')}</span>
      </button>
    </nav>
  );
};

const StoriesBar = ({ users, stories, onStoryView, onAddStory, t }: { users: Users, stories: StoryCollection[], onStoryView: (userId: string) => void, onAddStory: () => void, t: (key: string) => string }) => {
  const me = users['user-0'];
  const friendsWithStories = Object.values(users).filter(u => u.id !== 'user-0' && stories.some(s => s.userId === u.id));

  return (
    <div className="stories-bar">
      <div className="story" onClick={onAddStory} role="button" tabIndex={0}>
        <div className="story-avatar-wrapper is-me">
          <img src={me.avatar} alt={me.name} className="story-avatar" />
          <div className="add-story-overlay">
            <Icon type="addStory" className="add-story-icon" />
          </div>
        </div>
        <span className="story-name">{t('addStory')}</span>
      </div>
      {friendsWithStories.map(user => (
        <div className="story" key={user.id} onClick={() => onStoryView(user.id)} role="button" tabIndex={0}>
          <div className="story-avatar-wrapper">
            <img src={user.avatar} alt={user.name} className="story-avatar" />
          </div>
          <span className="story-name">{user.name}</span>
        </div>
      ))}
    </div>
  );
};

const AdSenseBlock = () => {
    const { t } = useI18N();
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div className="adsense-container">
            <div className="sponsored-label">{t('sponsored')}</div>
            <div className="ad-placeholder">
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-1234567890123456" // Replace with your ad client ID
                     data-ad-slot="1234567890" // Replace with your ad slot ID
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        </div>
    );
};

const ChatListPanel = ({ chats, users, activeChatId, onSelectChat, onAddFriend, onAddStory, onStoryView, stories, t }: { chats: Chat[], users: Users, activeChatId: string | null, onSelectChat: (id: string) => void, onAddFriend: () => void, onAddStory: () => void, onStoryView: (id: string) => void, stories: StoryCollection[], t: (key: string, replacements?: Record<string, string>) => string }) => {
  return (
    <div className="chat-list-panel">
      <div className="chat-list-header">
         <h1>{t('chats')}</h1>
         <div className="chat-list-header-actions">
            <button onClick={onAddFriend} className="new-channel-btn" style={{ padding: '8px', borderRadius: '50%' }} aria-label={t('addFriend')}>
                <Icon type="add" />
            </button>
         </div>
      </div>
      <StoriesBar users={users} stories={stories} onStoryView={onStoryView} onAddStory={onAddStory} t={t} />
      <AdSenseBlock />
      <div className="chat-list">
        {chats.length === 0 ? (
          <p className="no-chats">{t('noChats')}</p>
        ) : (
          chats.map(chat => {
            const user = users[chat.userId];
            if (!user) return null;
            const lastMessage = chat.messages[chat.messages.length - 1];
            return (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
                role="button"
                tabIndex={0}
              >
                <img src={user.avatar} alt={user.name} className="chat-avatar" />
                <div className="chat-details">
                  <div className="chat-header">
                    <span className="chat-name">{user.name}</span>
                    <span className="chat-timestamp">{formatDate(lastMessage.timestamp, t)}</span>
                  </div>
                  <p className="chat-message">{lastMessage.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ChannelListPanel = ({ channels, activeChannelId, onSelectChannel, onNewChannelRequest, t }: { channels: Channel[], activeChannelId: string | null, onSelectChannel: (id: string) => void, onNewChannelRequest: () => void, t: (key: string, replacements?: Record<string, string>) => string }) => {
    const approvedChannels = channels.filter(c => c.status === 'approved');
    const pendingChannels = channels.filter(c => c.status === 'pending');

    return (
        <div className="chat-list-panel">
            <div className="chat-list-header">
                <h1>{t('channels')}</h1>
                <div className="chat-list-header-actions">
                     <button onClick={onNewChannelRequest} className="new-channel-btn">
                        <Icon type="add" />
                        {t('requestNewChannel')}
                    </button>
                </div>
            </div>
            <div className="chat-list">
                {approvedChannels.length === 0 && pendingChannels.length === 0 && (
                    <p className="no-chats">{t('noChannels')}</p>
                )}
                {approvedChannels.map(channel => {
                    const lastMessage = channel.messages[channel.messages.length - 1];
                    return (
                        <div key={channel.id} className={`chat-item ${channel.id === activeChannelId ? 'active' : ''}`} onClick={() => onSelectChannel(channel.id)} role="button" tabIndex={0}>
                            <img src={channel.avatar} alt={channel.name} className="chat-avatar" />
                            <div className="chat-details">
                                <div className="chat-header">
                                    <span className="chat-name">{channel.name}</span>
                                    {lastMessage && <span className="chat-timestamp">{formatDate(lastMessage.timestamp, t)}</span>}
                                </div>
                                <p className="chat-message">{lastMessage ? lastMessage.text : 'No messages yet.'}</p>
                            </div>
                        </div>
                    );
                })}
                {pendingChannels.length > 0 && (
                    <>
                        <h2 className="profile-menu-header" style={{paddingLeft: '15px'}}>{t('pending')}</h2>
                        {pendingChannels.map(channel => (
                            <div key={channel.id} className="chat-item" style={{ opacity: 0.6 }}>
                                <img src={channel.avatar} alt={channel.name} className="chat-avatar" />
                                <div className="chat-details">
                                    <div className="chat-header">
                                        <span className="chat-name">{channel.name}</span>
                                        <span className="pending-badge">{t('pending')}</span>
                                    </div>
                                    <p className="chat-message">Awaiting approval.</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

const MenuPanel = ({ currentUser, onEditProfile, onShowPremium, onShowAdmin, onShowSettings, onShowSupport, onShowEarnings, t, onGoBack, isPremium, onLogout, lang, setLang, isLocalNetwork, onToggleNetwork }: { currentUser: User, onEditProfile: () => void, onShowPremium: () => void, onShowAdmin: () => void, onShowSettings: () => void, onShowSupport: () => void, onShowEarnings: () => void, t: (key: string) => string, onGoBack: () => void, isPremium: boolean, onLogout: () => void, lang: string, setLang: (l: string) => void, isLocalNetwork: boolean, onToggleNetwork: () => void }) => {
    return (
      <div className="menu-panel">
        <div className="chat-list-header">
          <div className="panel-title-group">
             <button className="panel-header-back-btn" onClick={onGoBack} aria-label={t('goBack')}>
                <Icon type="back" />
            </button>
            <h1>{t('menu')}</h1>
          </div>
        </div>
        <div className="menu-panel-scroll-content">
            <div className="profile-info-card">
              <div className="profile-info-avatar-wrapper is-clickable" onClick={onEditProfile} role="button" tabIndex={0} aria-label={t('editProfile')}>
                <img src={currentUser.avatar} alt={currentUser.name} className="profile-info-avatar" />
              </div>
              <div className="profile-info-text">
                <h2>{currentUser.name}</h2>
              </div>
              <button onClick={onEditProfile} className="edit-profile-btn" aria-label={t('editProfile')}>
                <Icon type="edit" />
              </button>
            </div>

            <div className="profile-menu">
                <div className="profile-menu-section">
                    <div className="profile-menu-item" onClick={onShowPremium}>
                        <div className="profile-menu-icon"><Icon type="cloud" /></div>
                        <span className="profile-menu-title">{t('premiumStorage')}</span>
                         {isPremium && <div className="profile-menu-status-icon"><Icon type="check"/></div>}
                    </div>
                    <div className="profile-menu-item" onClick={onShowEarnings}>
                        <div className="profile-menu-icon"><Icon type="wallet" /></div>
                        <span className="profile-menu-title">{t('earnings')}</span>
                    </div>
                    {currentUser.role === 'admin' && (
                         <div className="profile-menu-item" onClick={onShowAdmin}>
                            <div className="profile-menu-icon"><Icon type="shield" /></div>
                            <span className="profile-menu-title">{t('adminPanel')}</span>
                        </div>
                    )}
                </div>
                
                <div className="profile-menu-section">
                     <div className="profile-menu-item no-hover">
                        <div className="profile-menu-icon"><Icon type={isLocalNetwork ? "wifi" : "globe"} /></div>
                        <span className="profile-menu-title">{t('networkMode')}</span>
                        <div style={{marginLeft: 'auto'}}><ToggleSwitch checked={!isLocalNetwork} onChange={onToggleNetwork} /></div>
                    </div>
                </div>

                <div className="profile-menu-section">
                    <div className="profile-menu-item no-hover">
                        <div className="profile-menu-icon"><Icon type="language" /></div>
                        <span className="profile-menu-title">{t('language')}</span>
                    </div>
                    <div className="language-selector-list">
                      <ul>
                        <li><button className={`language-option-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button></li>
                        <li><button className={`language-option-btn ${lang === 'fa' ? 'active' : ''}`} onClick={() => setLang('fa')}>فارسی</button></li>
                        <li><button className={`language-option-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>العربية</button></li>
                        <li><button className={`language-option-btn ${lang === 'ps' ? 'active' : ''}`} onClick={() => setLang('ps')}>پښتو</button></li>
                      </ul>
                    </div>
                </div>

                <div className="profile-menu-section">
                     <div className="profile-menu-item" onClick={onShowSettings}>
                        <div className="profile-menu-icon"><Icon type="settings" /></div>
                        <span className="profile-menu-title">{t('settings')}</span>
                    </div>
                    <div className="profile-menu-item" onClick={onShowSupport}>
                        <div className="profile-menu-icon"><Icon type="heart" style={{color: '#ff3b30'}}/></div>
                        <span className="profile-menu-title">{t('supportMe')}</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    );
};

const PremiumStorageCard = ({ used, total, timeRemaining, t }) => (
    <div className="premium-storage-card">
        <div className="storage-header">
            <div className="storage-title">{t('premiumStorage')}</div>
            <div className="storage-time">{t('timeRemaining', {time: formatTime(timeRemaining)})}</div>
        </div>
        <div className="storage-bar-container">
            <div className="storage-bar-fill" style={{ width: `${(used / total) * 100}%` }}></div>
        </div>
        <span className="storage-usage-text">{t('storageUsed', {used: used.toFixed(2)})}</span>
    </div>
);


// Modals
const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
            {children}
        </div>
      </div>
    </div>
  );
};


const NewChannelModal = ({ isOpen, onClose, onSubmit, t }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('newChannel')}>
      <input
        type="text"
        placeholder={t('channelName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={t('channelName')}
      />
      <div className="modal-actions">
        <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
        <button onClick={handleSubmit} className="btn-primary" disabled={!name.trim()}>{t('request')}</button>
      </div>
    </Modal>
  );
};

const EditProfileModal = ({ isOpen, onClose, user, onSave, t }) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onSave({ ...user, name, avatar });
        onClose();
    };
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatar(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editProfile')}>
            <div className="setup-avatar-uploader" onClick={handleAvatarClick} style={{ alignSelf: 'center', marginBottom: '15px' }}>
              <img src={avatar} alt="Avatar" className="setup-avatar-img" />
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              <div className="setup-avatar-overlay">
                <Icon type="edit" />
              </div>
            </div>
            <label htmlFor="profile-name" className="form-label">{t('name')}</label>
            <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <div className="modal-actions">
                <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
                <button onClick={handleSave} className="btn-primary">{t('save')}</button>
            </div>
        </Modal>
    );
};

const AddFriendModal = ({ isOpen, onClose, onAdd, t }) => {
    const [id, setId] = useState('');

    const handleAdd = () => {
        if(id.trim()) {
            onAdd(id.trim());
            setId('');
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('addFriend')}>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 15px 0' }}>{t('addFriendSupportMessage')}</p>
            <label htmlFor="friend-id" className="form-label">{t('friendId')}</label>
            <input
                id="friend-id"
                type="text"
                placeholder={t('enterFriendId')}
                value={id}
                onChange={(e) => setId(e.target.value)}
            />
             <div className="modal-actions">
                <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
                <button onClick={handleAdd} className="btn-primary" disabled={!id.trim()}>{t('add')}</button>
            </div>
        </Modal>
    );
};

const AddStoryModal = ({ isOpen, onClose, onPost, t }) => {
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handlePost = () => {
        if (content.trim() || file) {
            onPost(content.trim(), file);
            setContent('');
            setFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onClose();
        }
    };
    
    const handleClose = () => {
        setContent('');
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('addStory')}>
            <div className="add-story-content">
                {previewUrl && (
                    <div className="media-preview">
                        {file?.type.startsWith('image/') && <img src={previewUrl} alt={t('mediaPreview')} />}
                        {file?.type.startsWith('video/') && <video src={previewUrl} controls muted loop playsInline />}
                    </div>
                )}
                <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                    <Icon type="upload" />
                    {t('uploadMedia')}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/mp4,video/webm"
                    style={{ display: 'none' }}
                />
                <textarea
                    className="add-story-textarea"
                    placeholder={t('whatsOnYourMind')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                />
            </div>
            <div className="modal-actions">
                <button onClick={handleClose} className="btn-secondary">{t('cancel')}</button>
                <button onClick={handlePost} className="btn-primary" disabled={!content.trim() && !file}>{t('post')}</button>
            </div>
        </Modal>
    );
};

const InAppBrowserModal = ({ isOpen, onClose, url, title }: { isOpen: boolean, onClose: () => void, url: string, title: string }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="in-app-browser-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="in-app-browser-body">
            <iframe
                src={url}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
      </div>
    </div>
  );
};

const PremiumModal = ({ isOpen, onClose, onUnlock, adsWatched, t }) => {
    const tasks = useMemo(() => [
        { id: 1, title: t('watchAd'), icon: 'videoCall', complete: 1 <= adsWatched, url: null },
        { id: 2, title: t('watchOnYouTube'), icon: 'videoCall', complete: 2 <= adsWatched, url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 3, title: t('browseInstagram'), icon: 'globe', complete: 3 <= adsWatched, url: 'https://www.instagram.com' },
    ], [t, adsWatched]);

    const [isAdOpen, setAdOpen] = useState(false);
    const [browserState, setBrowserState] = useState<{isOpen: boolean, url: string, taskId: number | null}>({isOpen: false, url: '', taskId: null});

    const handleTaskClick = (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        // The disabled logic will prevent clicking completed tasks, but this is a good safeguard.
        if (task && !task.complete && !(adsWatched < task.id - 1)) {
            if (task.url) {
                setBrowserState({ isOpen: true, url: task.url, taskId: task.id });
            } else {
                setAdOpen(true);
            }
        }
    };
    
    const handleCloseBrowser = () => {
        if (browserState.taskId) {
            onUnlock();
        }
        setBrowserState({ isOpen: false, url: '', taskId: null });
    };

    const handleCloseAd = () => {
        setAdOpen(false);
        onUnlock();
    };

    if (isAdOpen) {
        return (
             <Modal isOpen={true} onClose={handleCloseAd} title={t('adTitle')}>
                 <p>{t('premiumDescription')}</p>
                 <AdSenseBlock/>
                 <div className="modal-actions">
                    <button onClick={handleCloseAd} className="btn-primary">{t('close')}</button>
                 </div>
             </Modal>
        )
    }
    
    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={t('getPremium')}>
                <p>{t('premiumDescription')}</p>
                <div className="premium-tasks-list">
                    {tasks.map((task) => (
                        <button key={task.id} className="premium-task-btn" onClick={() => handleTaskClick(task.id)} disabled={task.complete || adsWatched < task.id - 1}>
                             <div className="premium-task-icon"><Icon type={task.icon} /></div>
                             <span>{task.title}</span>
                             <div className="premium-task-checkbox">
                                 {task.complete && <Icon type="check" />}
                             </div>
                        </button>
                    ))}
                </div>
            </Modal>
            <InAppBrowserModal 
                isOpen={browserState.isOpen}
                onClose={handleCloseBrowser}
                url={browserState.url}
                title={t('adTitle')}
            />
        </>
    );
};


const SupportModal = ({ isOpen, onClose, t }) => {
    const [adCompleted, setAdCompleted] = useState(false);
    const [showAd, setShowAd] = useState(false);

    const handleWatchAd = () => {
        setShowAd(true);
    };

    const handleCloseAd = () => {
        setShowAd(false);
        setAdCompleted(true);
    };
    
    const handleCloseMain = () => {
        setAdCompleted(false); // Reset for next time
        onClose();
    }

    if (showAd) {
        return (
            <Modal isOpen={true} onClose={handleCloseAd} title={t('adTitle')}>
                <p>{t('supportMeDescription')}</p>
                <AdSenseBlock/>
                <div className="modal-actions">
                   <button onClick={handleCloseAd} className="btn-primary">{t('close')}</button>
                </div>
            </Modal>
        );
    }

    if (adCompleted) {
        return (
            <Modal isOpen={isOpen} onClose={handleCloseMain} title={t('thankYou')}>
                <p style={{textAlign: 'center', fontSize: '18px'}}>{t('supportThankYouMessage')}</p>
                <div className="modal-actions">
                   <button onClick={handleCloseMain} className="btn-primary">{t('close')}</button>
                </div>
            </Modal>
        );
    }


    return (
         <Modal isOpen={isOpen} onClose={onClose} title={t('supportMeTitle')}>
            <p>{t('supportMeDescription')}</p>
            <div className="modal-actions">
                <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
                <button onClick={handleWatchAd} className="btn-primary">{t('watchAd')}</button>
            </div>
        </Modal>
    );
};

const EarningsModal = ({ isOpen, onClose, t, onEarn, balance }) => {
    const [showAd, setShowAd] = useState(false);

    const handleWatchAd = () => {
        setShowAd(true);
    };

    const handleCloseAd = () => {
        setShowAd(false);
        onEarn(); // Trigger earning after ad is closed
    };
    
    if (showAd) {
        return (
            <Modal isOpen={true} onClose={handleCloseAd} title={t('adTitle')}>
                <p>{t('earningsDescription')}</p>
                <AdSenseBlock/>
                <div className="modal-actions">
                   <button onClick={handleCloseAd} className="btn-primary">{t('close')}</button>
                </div>
            </Modal>
        );
    }

    return (
         <Modal isOpen={isOpen} onClose={onClose} title={t('earnings')}>
            <div className="earnings-content">
                <Icon type="wallet" className="earnings-icon" />
                <p>{t('earningsDescription')}</p>
                <h3 className="earnings-balance">{t('yourBalance', {balance: `$${balance.toFixed(2)}`})}</h3>
            </div>
            <div className="modal-actions">
                <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
                <button onClick={handleWatchAd} className="btn-primary">{t('watchAdToEarn')}</button>
            </div>
        </Modal>
    );
};


interface AdminPanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string, replacements?: Record<string, string>) => string;
    users: Users;
    onUpdateUserRole: (userId: string) => void;
    pendingRequests: PendingRequest[];
    onApproveRequest: (reqId: string) => void;
    onRejectRequest: (reqId: string) => void;
    settings: AdminSettings;
    onSaveSettings: (settings: AdminSettings) => void;
    onChangePassword: (current: string, newPass: string) => string | null;
    onRemovePassword: () => void;
    hasPassword?: boolean;
}

const AdminPanelModal = ({ isOpen, onClose, t, users, onUpdateUserRole, pendingRequests, onApproveRequest, onRejectRequest, settings, onSaveSettings, onChangePassword, onRemovePassword, hasPassword }: AdminPanelModalProps) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [confirmRoleModal, setConfirmRoleModal] = useState<{ isOpen: boolean, user: User | null }>({ isOpen: false, user: null });
    const [confirmPassRemovalModal, setConfirmPassRemovalModal] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);
    
    const handleRoleChangeClick = (user: User) => {
        setConfirmRoleModal({ isOpen: true, user: user });
    };

    const handleConfirmRoleChange = () => {
        if (confirmRoleModal.user) {
            onUpdateUserRole(confirmRoleModal.user.id);
        }
        setConfirmRoleModal({ isOpen: false, user: null });
    };

    const handleSettingsSave = () => {
        onSaveSettings(localSettings);
    };
    
    const handlePasswordChange = () => {
        setPasswordError('');
        if (newPassword !== confirmNewPassword) {
            setPasswordError(t('passwordMismatch'));
            return;
        }
        
        const error = onChangePassword(currentPassword, newPassword);
        if(error) {
            setPasswordError(error);
        } else {
             setCurrentPassword('');
             setNewPassword('');
             setConfirmNewPassword('');
        }
    }
    
    const handleConfirmRemovePassword = () => {
        onRemovePassword();
        setConfirmPassRemovalModal(false);
    }


    return (
      <>
        <Modal isOpen={isOpen} onClose={onClose} title={t('adminPanel')}>
          <div className="admin-panel">
            {/* User Management */}
            <div className="admin-section">
                <h4 className="admin-section-header"><Icon type="users" />{t('userManagement')}</h4>
                <div className="user-list">
                    {Object.values(users).filter(u => u.id !== 'user-0').map(user => (
                        <div key={user.id} className="user-item">
                            <img src={user.avatar} alt={user.name} className="chat-avatar" style={{width: '40px', height: '40px'}}/>
                            <div className="user-info">
                                <strong>{user.name}</strong>
                                <span className={`user-role ${user.role}`}>
                                    {user.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleRoleChangeClick(user)}
                                className={`admin-action-btn ${user.role === 'admin' ? 'secondary' : 'primary'}`}
                            >
                                {user.role === 'admin' ? t('removeAdmin') : t('makeAdmin')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Requests */}
            <div className="admin-section">
                <h4 className="admin-section-header"><Icon type="inbox" />{t('pendingRequests')}</h4>
                <div className="request-list">
                   {pendingRequests.length === 0 ? <p>{t('noPendingRequests')}</p> : pendingRequests.map(req => {
                        const fromUser = users[req.fromUserId];
                        const message = req.type === 'friend' 
                            ? t('friendRequestFrom', {name: fromUser?.name || 'Unknown User'}) 
                            : t('channelRequest', {name: req.channelName});
                       
                       return (
                            <div key={req.id} className="request-item">
                                <img src={fromUser?.avatar} alt={fromUser?.name} className="chat-avatar" style={{width: '40px', height: '40px'}}/>
                                <div className="request-info">
                                    <strong>{message}</strong>
                                    <span>{formatDate(req.date.getTime(), t)}</span>
                                </div>
                                <div className="request-actions">
                                    <button onClick={() => onRejectRequest(req.id)} className="admin-action-btn danger">{t('reject')}</button>
                                    <button onClick={() => onApproveRequest(req.id)} className="admin-action-btn success">{t('approve')}</button>
                                </div>
                            </div>
                       );
                   })}
                </div>
            </div>
            
            {/* Settings Section */}
            <div className="admin-section">
                <h4 className="admin-section-header"><Icon type="settings" />{t('settings')}</h4>
                 {/* Network Settings */}
                <div className="admin-form-group">
                    <label>{t('networkSettings')}</label>
                     <div className="admin-setting-item">
                        <div className="admin-setting-text">
                            <strong>{t('forceLocalNetwork')}</strong>
                            <p>{t('forceLocalNetworkDesc')}</p>
                        </div>
                        <ToggleSwitch
                            checked={localSettings.forceLocalNetwork}
                            onChange={e => setLocalSettings(prev => ({ ...prev, forceLocalNetwork: e.target.checked }))}
                        />
                    </div>
                </div>
                 {/* Ad Settings */}
                <div className="admin-form-group" style={{marginTop: '10px'}}>
                    <label htmlFor="adsense-id">{t('adsenseClientId')}</label>
                    <input 
                        id="adsense-id"
                        type="text" 
                        value={localSettings.adsenseClientId}
                        onChange={e => setLocalSettings(prev => ({ ...prev, adsenseClientId: e.target.value }))}
                        placeholder="ca-pub-..."
                    />
                </div>
                <button onClick={handleSettingsSave} className="admin-action-btn primary" style={{marginTop: '15px'}}>{t('save')}</button>
            </div>


            {/* Account Settings */}
             <div className="admin-section">
                <h4 className="admin-section-header"><Icon type="shield" />{t('accountSettings')}</h4>
                <div className="admin-form-group" style={{gap: '20px'}}>
                    <div>
                        <label>{t('changePassword')}</label>
                        <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{hasPassword ? t('currentPassword') : t('setPassword')}</p>
                    </div>
                    {hasPassword && <input type="password" placeholder={t('currentPassword')} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />}
                    <input type="password" placeholder={t('newPassword')} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <input type="password" placeholder={t('confirmNewPassword')} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                    {passwordError && <p style={{color: 'var(--danger-red)'}}>{passwordError}</p>}
                    <div className="admin-password-actions">
                        <button onClick={handlePasswordChange} className="admin-action-btn primary">{t('save')}</button>
                        {hasPassword && <button onClick={() => setConfirmPassRemovalModal(true)} className="admin-action-btn danger">{t('removePassword')}</button>}
                    </div>
                </div>
            </div>

          </div>
        </Modal>
        
        <ConfirmationModal 
            isOpen={confirmRoleModal.isOpen}
            onCancel={() => setConfirmRoleModal({ isOpen: false, user: null })}
            onConfirm={handleConfirmRoleChange}
            title={t('confirmAction')}
            message={t('confirmRoleChange', { name: confirmRoleModal.user?.name || '' })}
        />
        
        <ConfirmationModal 
            isOpen={confirmPassRemovalModal}
            onCancel={() => setConfirmPassRemovalModal(false)}
            onConfirm={handleConfirmRemovePassword}
            title={t('removePassword')}
            message={t('confirmRemovePassword')}
        />

      </>
    );
};

// ... other modals ...

const StoryAdView = ({ onContinue, t }) => {
    return (
        <div className="story-ad-view">
            <div className="sponsored-label" style={{alignSelf: 'flex-start'}}>{t('adInStory')}</div>
            <div className="story-ad-content">
                <AdSenseBlock />
            </div>
            <button onClick={onContinue} className="story-ad-continue-btn">{t('continueToStory')}</button>
        </div>
    );
};

const StoryViewer = ({ collection, users, onClose, onNextUser, onPrevUser }: { collection: StoryCollection, users: Users, onClose: () => void, onNextUser: () => void, onPrevUser: () => void }) => {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const storyUser = users[collection.userId];
    const story = collection.stories[currentStoryIndex];
    const { t } = useI18N();

    const AD_INTERVAL = 2; // Show ad after every 2 stories

    const goToNextStory = useCallback(() => {
        if (currentStoryIndex < collection.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else {
            onNextUser();
        }
    }, [currentStoryIndex, collection.stories.length, onNextUser]);

    const goToPrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else {
            onPrevUser();
        }
    };

    useEffect(() => {
        if (isPaused || (currentStoryIndex + 1) % AD_INTERVAL === 0) {
            return;
        }
        
        const timer = setTimeout(goToNextStory, 5000); // 5 second timer for each story
        return () => clearTimeout(timer);
    }, [currentStoryIndex, isPaused, goToNextStory, collection.stories.length]);
    
    const handleMouseDown = () => setIsPaused(true);
    const handleMouseUp = () => setIsPaused(false);
    
    if (!storyUser) return null;

    // Show an ad view instead of a story
    if ((currentStoryIndex + 1) % AD_INTERVAL === 0 && currentStoryIndex > 0) {
        return (
            <div className="story-viewer-backdrop" onClick={onClose}>
                <div className="story-viewer-container" onClick={e => e.stopPropagation()}>
                    <StoryAdView onContinue={goToNextStory} t={t} />
                </div>
            </div>
        );
    }


    return (
        <div className="story-viewer-backdrop" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp}>
            <div className="story-viewer-container" onClick={e => e.stopPropagation()}>
                <div className="story-progress-bars">
                    {collection.stories.map((s, index) => (
                        <div key={s.id} className="story-progress-bar">
                            <div 
                                className="story-progress-bar-fill" 
                                style={{ 
                                    width: index < currentStoryIndex ? '100%' : (index === currentStoryIndex && !isPaused ? '100%' : '0%'),
                                    transition: index === currentStoryIndex && !isPaused ? 'width 5s linear' : 'none'
                                }}
                            ></div>
                        </div>
                    ))}
                </div>
                
                <div className="story-viewer-header">
                    <img src={storyUser.avatar} alt={storyUser.name} className="story-viewer-avatar" />
                    <span className="story-viewer-name">{storyUser.name}</span>
                    <button onClick={onClose} className="story-viewer-close-btn">&times;</button>
                </div>

                <div className="story-viewer-content">
                    {story.type === 'text' && <div className="story-viewer-text-content">{story.content}</div>}
                    {story.type === 'image' && <img src={story.mediaUrl} alt={story.content} className="story-viewer-media" />}
                    {story.type === 'video' && <video src={story.mediaUrl} className="story-viewer-media" autoPlay muted loop={false} onEnded={goToNextStory} />}
                    
                    {story.type !== 'text' && story.content && (
                        <div className="story-viewer-caption">{story.content}</div>
                    )}
                </div>

                <div className="story-navigation">
                    <div className="story-nav-area" onClick={goToPrevStory}></div>
                    <div className="story-nav-area" onClick={goToNextStory}></div>
                </div>
            </div>
        </div>
    );
};


const CallScreen = ({ user, onEndCall, t, callType }: { user: User, onEndCall: () => void, t: (key: string) => string, callType: 'voice' | 'video' }) => {
    return (
        <div className="call-screen">
            <div className="call-screen-bg" style={{ backgroundImage: `url(${user.avatar})` }}></div>
            <div className="call-screen-content">
                <img src={user.avatar} alt={user.name} className="call-user-avatar" />
                <h1 className="call-user-name">{user.name}</h1>
                <p className="call-status">{t('calling')}</p>

                <div className="call-controls">
                    <button className="call-control-button"><Icon type="microphone" /></button>
                    {callType === 'video' && <button className="call-control-button"><Icon type="camera" /></button>}
                    <button className="call-control-button end-call" onClick={onEndCall}><Icon type="endCall" /></button>
                </div>
            </div>
        </div>
    );
};

const ChatWindow = ({ active, onBack, chat, users, t, onSendMessage, isTyping }: { active: boolean, onBack: () => void, chat: Chat | Channel | null, users: Users, t: (key: string, replacements?: Record<string, string>) => string, onSendMessage: (text: string) => void, isTyping: boolean }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [callState, setCallState] = useState<{ active: boolean, type: 'voice' | 'video' }>({ active: false, type: 'voice' });
    const isChannel = chat && 'name' in chat;
    const currentUser = users['user-0'];
    
    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;
        onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chat?.messages]);
    

    if (!chat) {
        return (
            <div className={`chat-window welcome`}>
                <div className="chat-window-content">
                    <Icon type="chats" className="chat-window-icon" />
                    <h2>{t('welcome')}</h2>
                    <p>{t('selectChat')}</p>
                </div>
            </div>
        );
    }
    
    const targetUser = !isChannel ? users[(chat as Chat).userId] : null;

    return (
        <div className={`chat-window ${active ? 'active' : ''}`}>
            <div className="chat-window-header">
                <button className="chat-window-back-btn" onClick={onBack}>
                    <Icon type="back" />
                </button>
                <div className="chat-window-header-info">
                    <img src={isChannel ? (chat as Channel).avatar : targetUser.avatar} alt={isChannel ? (chat as Channel).name : targetUser.name} className="chat-avatar" />
                    <div>
                        <span className="chat-name">{isChannel ? (chat as Channel).name : targetUser.name}</span>
                         {isTyping && !isChannel && <span className="typing-status">typing...</span>}
                    </div>
                </div>
                {!isChannel && (
                    <div className="chat-window-header-actions">
                        <button className="chat-window-action-btn" onClick={() => setCallState({ active: true, type: 'voice' })}>
                            <Icon type="voiceCall" />
                        </button>
                        <button className="chat-window-action-btn" onClick={() => setCallState({ active: true, type: 'video' })}>
                            <Icon type="videoCall" />
                        </button>
                    </div>
                )}
            </div>
            <div className="chat-messages-area">
                {chat.messages.map(message => {
                    const sender = isChannel ? users[message.sender] : (message.sender === currentUser.id ? currentUser : targetUser);
                    const isSent = message.sender === currentUser.id;
                    return (
                        <div key={message.id} className={`message-container ${isSent ? 'sent' : 'received'}`}>
                           {!isSent && !isChannel && <img src={sender.avatar} alt={sender.name} className="chat-avatar" style={{width: '30px', height: '30px'}}/>}
                           {isChannel && !isSent && (
                             <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                <img src={sender.avatar} alt={sender.name} className="chat-avatar" style={{width: '30px', height: '30px'}}/>
                                <span style={{fontSize: '10px', color: 'var(--text-secondary)'}}>{sender.name}</span>
                             </div>
                           )}
                           <div className="message-bubble">{message.text}</div>
                        </div>
                    )
                })}
                {isTyping && !isChannel && (
                  <div className="message-container received">
                    <img src={targetUser.avatar} alt={targetUser.name} className="chat-avatar" style={{width: '30px', height: '30px'}}/>
                    <div className="message-bubble typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>
             <div className="chat-input-container">
                <input
                    type="text"
                    className="chat-input"
                    placeholder={t('typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={(isChannel && (chat as Channel).status === 'pending')}
                />
                <button className="send-btn" onClick={handleSendMessage} disabled={(isChannel && (chat as Channel).status === 'pending')}>
                    <Icon type="send" />
                </button>
            </div>
            
            {callState.active && targetUser && (
                <CallScreen user={targetUser} onEndCall={() => setCallState({active: false, type: 'voice'})} t={t} callType={callState.type} />
            )}
        </div>
    );
};

const UserSetupScreen = ({ onSetupComplete, t }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/150?u=user-0');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSetupComplete(name.trim(), avatar);
    }
  };

  return (
    <div className="user-setup-container">
      <div className="user-setup-box">
        <h1>{t('setupProfile')}</h1>
        <p>{t('setupIntro')}</p>
        <form className="user-setup-form" onSubmit={handleSubmit}>
          <div className="setup-avatar-uploader" onClick={handleAvatarClick}>
            <img src={avatar} alt="Avatar" className="setup-avatar-img" />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            <div className="setup-avatar-overlay">
                <Icon type="edit" />
            </div>
          </div>
          <div className="setup-input-group">
            <label htmlFor="user-name">{t('yourName')}</label>
            <input
              id="user-name"
              type="text"
              placeholder={t('yourNameToAppear')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="setup-submit-btn" disabled={!name.trim()}>{t('startMessaging')}</button>
        </form>
      </div>
    </div>
  );
};


const App = () => {
  const [users, setUsers] = useState<Users>(() => JSON.parse(localStorage.getItem('app-users')) || initialUsers);
  const [chats, setChats] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('app-chats')) || initialChats);
  const [channels, setChannels] = useState<Channel[]>(() => JSON.parse(localStorage.getItem('app-channels')) || initialChannels);
  const [stories, setStories] = useState<StoryCollection[]>(() => JSON.parse(localStorage.getItem('app-stories')) || initialStories);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(() => {
     const saved = localStorage.getItem('app-pending-requests');
     return saved ? JSON.parse(saved).map(r => ({...r, date: new Date(r.date)})) : initialPendingRequests
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => JSON.parse(localStorage.getItem('app-admin-settings')) || { forceLocalNetwork: false, adsenseClientId: 'ca-pub-1234567890123456' });
  const [userBalance, setUserBalance] = useState(() => parseFloat(localStorage.getItem('app-user-balance')) || 0);
  const [isLocalNetwork, setIsLocalNetwork] = useState(() => JSON.parse(localStorage.getItem('app-is-local-network')) || false);

  const [activePanel, setActivePanel] = useState('chats'); // chats, channels, menu
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null); // chat or channel id
  const [currentView, setCurrentView] = useState('list'); // list, conversation
  const [currentModal, setCurrentModal] = useState<string | null>(null); // newChannel, editProfile, addFriend, addStory, premium, admin, support, earnings
  
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [isPremium, setIsPremium] = useState(() => JSON.parse(localStorage.getItem('app-isPremium')) || false);
  const [premiumEndTime, setPremiumEndTime] = useState(() => parseInt(localStorage.getItem('app-premiumEndTime') || '0'));
  const [adsWatched, setAdsWatched] = useState(() => parseInt(localStorage.getItem('app-adsWatched') || '0'));
  const [storageUsed, setStorageUsed] = useState(() => parseFloat(localStorage.getItem('app-storageUsed') || '0'));
  
  const [storyViewerState, setStoryViewerState] = useState<{ isOpen: boolean, userId: string | null }>({ isOpen: false, userId: null });

  const { t, lang, setLang } = useI18N();
  const currentUser = users['user-0'];
  const isProfileSetup = currentUser && currentUser.name !== 'Me';

  // Persist state to localStorage
  useEffect(() => { localStorage.setItem('app-users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('app-chats', JSON.stringify(chats)); }, [chats]);
  useEffect(() => { localStorage.setItem('app-channels', JSON.stringify(channels)); }, [channels]);
  useEffect(() => { localStorage.setItem('app-stories', JSON.stringify(stories)); }, [stories]);
  useEffect(() => { localStorage.setItem('app-pending-requests', JSON.stringify(pendingRequests)); }, [pendingRequests]);
  useEffect(() => { localStorage.setItem('app-isPremium', JSON.stringify(isPremium)); }, [isPremium]);
  useEffect(() => { localStorage.setItem('app-premiumEndTime', premiumEndTime.toString()); }, [premiumEndTime]);
  useEffect(() => { localStorage.setItem('app-adsWatched', adsWatched.toString()); }, [adsWatched]);
  useEffect(() => { localStorage.setItem('app-storageUsed', storageUsed.toString()); }, [storageUsed]);
  useEffect(() => { localStorage.setItem('app-admin-settings', JSON.stringify(adminSettings)); }, [adminSettings]);
  useEffect(() => { localStorage.setItem('app-user-balance', userBalance.toString()); }, [userBalance]);
  useEffect(() => { localStorage.setItem('app-is-local-network', JSON.stringify(isLocalNetwork)); }, [isLocalNetwork]);


  // Toast timeout
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  // Premium timer
  useEffect(() => {
    let interval: any;
    if (isPremium) {
        interval = setInterval(() => {
            const now = Date.now();
            if (now >= premiumEndTime) {
                setIsPremium(false);
                setAdsWatched(0);
                setStorageUsed(0);
                // Maybe clear saved messages from state
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPremium, premiumEndTime]);


  // Simulate initial loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setCurrentView('conversation');
  };
  
  const handlePanelSelection = (panel: string) => {
      setActivePanel(panel);
  }

  const handleGoBackToList = () => {
    setActiveConversationId(null);
    setCurrentView('list');
  };

  const handleGoBackToMainPanels = () => {
    setActivePanel('chats');
  };
  
  const handleProfileSetup = (name: string, avatar: string) => {
    setUsers(prev => ({...prev, 'user-0': { ...prev['user-0'], name, avatar }}));
  };

  const handleEditProfile = (updatedUser: User) => {
    setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
    setToastMessage(t('profileSaved'));
  };

  const handleRequestChannel = (name: string) => {
    const channelId = `channel-${Date.now()}`;
    const newRequest: PendingRequest = {
        id: `req-${Date.now()}`,
        type: 'channel',
        fromUserId: 'user-0',
        date: new Date(),
        channelName: name,
        channelId: channelId
    };
    const newChannel: Channel = {
        id: channelId,
        name,
        avatar: `https://i.pravatar.cc/150?u=${name}`,
        messages: [],
        unread: 0,
        status: 'pending'
    };
    setChannels(prev => [...prev, newChannel]);
    setPendingRequests(prev => [...prev, newRequest]);
    setToastMessage(t('channelRequestSent'));
  };
  
  const handleAddFriend = (friendId: string) => {
    // In a real app, you'd find the user by ID and send a request
    // Here we'll just simulate it.
    const newRequest: PendingRequest = {
        id: `req-${Date.now()}`,
        type: 'friend',
        fromUserId: 'user-0',
        date: new Date()
    };
    setPendingRequests(prev => [...prev, newRequest]);
    setToastMessage(t('friendRequestSent'));
  };
  
  const handlePostStory = (content: string, file: File | null) => {
    const storyType = file ? (file.type.startsWith('image/') ? 'image' : 'video') : 'text';
    const newStory: Story = {
        id: `story-${Date.now()}`,
        type: storyType,
        content: content,
    };

    const postStory = (mediaUrl?: string) => {
        if(mediaUrl) newStory.mediaUrl = mediaUrl;
        
        setStories(prev => {
            const myStories = prev.find(s => s.userId === 'user-0');
            if (myStories) {
                myStories.stories.push(newStory);
                return [...prev];
            }
            return [...prev, { userId: 'user-0', stories: [newStory] }];
        });
        setToastMessage(t('storyPosted'));
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            postStory(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        postStory();
    }
  };
  
  const handleViewStories = (userId: string) => {
      setStoryViewerState({ isOpen: true, userId });
  };
  
  const handleCloseStoryViewer = () => {
       setStoryViewerState({ isOpen: false, userId: null });
  };
  
  const handleStoryNextUser = () => {
    const usersWithStories = ['user-0', ...Object.keys(users).filter(id => id !== 'user-0' && stories.some(s => s.userId === id))];
    const currentIndex = usersWithStories.findIndex(id => id === storyViewerState.userId);
    if(currentIndex < usersWithStories.length - 1) {
        setStoryViewerState({isOpen: true, userId: usersWithStories[currentIndex + 1]});
    } else {
        handleCloseStoryViewer();
    }
  };
  
  const handleStoryPrevUser = () => {
    const usersWithStories = ['user-0', ...Object.keys(users).filter(id => id !== 'user-0' && stories.some(s => s.userId === id))];
    const currentIndex = usersWithStories.findIndex(id => id === storyViewerState.userId);
    if(currentIndex > 0) {
        setStoryViewerState({isOpen: true, userId: usersWithStories[currentIndex - 1]});
    } else {
        handleCloseStoryViewer();
    }
  };

  const handleUnlockPremium = () => {
    setAdsWatched(prev => {
      const newCount = Math.min(prev + 1, 3);
      if (newCount === 3 && !isPremium) {
        setIsPremium(true);
        setPremiumEndTime(Date.now() + 24 * 60 * 60 * 1000);
        setToastMessage(t('premiumUnlocked'));
      }
      return newCount;
    });
  };

    const handleSendMessage = (text: string) => {
        if (!activeConversationId) return;

        const newMessage: Message = {
            id: Date.now(),
            text,
            sender: 'user-0',
            timestamp: Date.now(),
        };

        if (activePanel === 'chats') {
            setChats(prev => prev.map(c =>
                c.id === activeConversationId
                    ? { ...c, messages: [...c.messages, newMessage] }
                    : c
            ));
            
            setIsTyping(true);
            setTimeout(() => {
                setChats(prev => {
                    const currentChat = prev.find(c => c.id === activeConversationId);
                    if (!currentChat) return prev;

                    const replyMessage: Message = {
                        id: Date.now(),
                        text: `This is a simulated reply to: "${text}"`,
                        sender: currentChat.userId,
                        timestamp: Date.now(),
                    };

                    setIsTyping(false);
                    return prev.map(c =>
                        c.id === activeConversationId
                            ? { ...c, messages: [...c.messages, replyMessage] }
                            : c
                    );
                });
            }, 1500 + Math.random() * 1000);

        } else {
            setChannels(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: [...c.messages, newMessage] } : c));
        }
    };

  const handleUserEarn = () => {
    const amount = 0.02; // Fixed amount for simulation
    const newBalance = userBalance + amount;
    setUserBalance(newBalance);
    setToastMessage(t('earnedCredit', {
        amount: `$${amount.toFixed(2)}`,
        balance: `$${newBalance.toFixed(2)}`
    }));
  };
  

  // Admin panel functions
  const handleUpdateUserRole = (userId: string) => {
    setUsers(prev => ({
        ...prev,
        [userId]: { ...prev[userId], role: prev[userId].role === 'admin' ? 'user' : 'admin' }
    }));
    setToastMessage(t('userRoleUpdated'));
  };
  
  const handleSaveAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    setToastMessage(t('settingsSaved'));
  };

  const handleApproveRequest = (reqId: string) => {
    const request = pendingRequests.find(r => r.id === reqId);
    if (!request) return;

    if (request.type === 'channel' && request.channelId) {
        setChannels(prev => prev.map(c => c.id === request.channelId ? { ...c, status: 'approved' } : c));
    } else if (request.type === 'friend') {
        const friendId = request.fromUserId;
        const chatExists = chats.some(c => c.userId === friendId);

        if (!chatExists && users[friendId]) {
            const newChat: Chat = {
                id: `chat-${Date.now()}`,
                userId: friendId,
                messages: [
                    {
                        id: Date.now(),
                        text: `You are now connected with ${users[friendId].name}. Say hi!`,
                        sender: 'user-0',
                        timestamp: Date.now(),
                    }
                ],
                unread: 0,
            };
            setChats(prev => [newChat, ...prev]);
        }
    }
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    setToastMessage(t('requestApproved'));
  };

  const handleRejectRequest = (reqId: string) => {
    const request = pendingRequests.find(r => r.id === reqId);
     if (request && request.type === 'channel' && request.channelId) {
        setChannels(prev => prev.filter(c => c.id !== request.channelId));
    }
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    setToastMessage(t('requestRejected'));
  };


  if (isLoading) return <LoadingScreen />;
  if (!isProfileSetup) return <LanguageProvider><UserSetupScreen onSetupComplete={handleProfileSetup} t={t} /></LanguageProvider>;

  const activeConversation = 
    activePanel === 'chats' 
    ? chats.find(c => c.id === activeConversationId) 
    : channels.find(c => c.id === activeConversationId);
    
  const timeRemaining = isPremium ? Math.floor((premiumEndTime - Date.now()) / 1000) : 0;
  
  const storyCollection = stories.find(s => s.userId === storyViewerState.userId);
  
  const effectiveIsLocalNetwork = adminSettings.forceLocalNetwork || isLocalNetwork;

  return (
      <div className="app-container">
        <Sidebar activePanel={activePanel} setActivePanel={handlePanelSelection} t={t} currentUser={currentUser} />

        <main className="main-content" style={{ display: currentView === 'list' ? 'block' : 'none' }}>
            {activePanel === 'chats' && <ChatListPanel chats={chats} users={users} activeChatId={activeConversationId} onSelectChat={handleSelectConversation} onAddFriend={() => setCurrentModal('addFriend')} onAddStory={() => setCurrentModal('addStory')} onStoryView={handleViewStories} stories={stories} t={t} />}
            {activePanel === 'channels' && <ChannelListPanel channels={channels} activeChannelId={activeConversationId} onSelectChannel={handleSelectConversation} onNewChannelRequest={() => setCurrentModal('newChannel')} t={t} />}
            {activePanel === 'menu' && <MenuPanel currentUser={currentUser} onEditProfile={() => setCurrentModal('editProfile')} onShowPremium={() => setCurrentModal('premium')} onShowAdmin={() => setCurrentModal('admin')} onShowSettings={() => {}} onShowSupport={() => setCurrentModal('support')} onShowEarnings={() => setCurrentModal('earnings')} t={t} onGoBack={handleGoBackToMainPanels} isPremium={isPremium} onLogout={() => {}} lang={lang} setLang={setLang} isLocalNetwork={effectiveIsLocalNetwork} onToggleNetwork={() => setIsLocalNetwork(p => !p)} />}
        </main>
        
        {isPremium && activePanel !== 'menu' && (
            <div className="premium-storage-card-container">
                <PremiumStorageCard used={storageUsed} total={150} timeRemaining={timeRemaining} t={t} />
            </div>
        )}

        <ChatWindow active={currentView === 'conversation'} onBack={handleGoBackToList} chat={activeConversation} users={users} t={t} onSendMessage={handleSendMessage} isTyping={isTyping && activeConversation?.id === activeConversationId} />

        {/* Modals */}
        <NewChannelModal isOpen={currentModal === 'newChannel'} onClose={() => setCurrentModal(null)} onSubmit={handleRequestChannel} t={t} />
        <EditProfileModal isOpen={currentModal === 'editProfile'} onClose={() => setCurrentModal(null)} user={currentUser} onSave={handleEditProfile} t={t} />
        <AddFriendModal isOpen={currentModal === 'addFriend'} onClose={() => setCurrentModal(null)} onAdd={handleAddFriend} t={t} />
        <AddStoryModal isOpen={currentModal === 'addStory'} onClose={() => setCurrentModal(null)} onPost={handlePostStory} t={t} />
        <PremiumModal isOpen={currentModal === 'premium'} onClose={() => setCurrentModal(null)} onUnlock={handleUnlockPremium} adsWatched={adsWatched} t={t} />
        <SupportModal isOpen={currentModal === 'support'} onClose={() => setCurrentModal(null)} t={t} />
        <EarningsModal isOpen={currentModal === 'earnings'} onClose={() => setCurrentModal(null)} onEarn={handleUserEarn} balance={userBalance} t={t} />
        <AdminPanelModal 
            isOpen={currentModal === 'admin'} 
            onClose={() => setCurrentModal(null)} 
            t={t} 
            users={users}
            onUpdateUserRole={handleUpdateUserRole}
            pendingRequests={pendingRequests}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            settings={adminSettings}
            onSaveSettings={handleSaveAdminSettings}
            onChangePassword={() => null}
            onRemovePassword={() => {}}
        />
        
        {storyViewerState.isOpen && storyCollection && (
            <StoryViewer 
                collection={storyCollection}
                users={users} 
                onClose={handleCloseStoryViewer}
                onNextUser={handleStoryNextUser}
                onPrevUser={handleStoryPrevUser}
            />
        )}
        
        <Toast message={toastMessage} />

        <BottomNavBar activePanel={activePanel} setActivePanel={handlePanelSelection} t={t} />
      </div>
  );
};

const Root = () => (
    <LanguageProvider>
        <App />
    </LanguageProvider>
);

createRoot(document.getElementById('root')!).render(<Root />);