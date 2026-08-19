/* ==========================================================================
   Nexus Earn Hub - Core Application Logic
   ========================================================================== */

lucide.createIcons();

const AVATAR_MALE = "https://i.ibb.co/JjNVJRNc/male-face-avatar-icon-set-flat-design-social-media-profiles-1281173-3806.jpg";
const AVATAR_FEMALE = "https://i.ibb.co/sdR3gRvk/cartoon-portrait-smiling-professional-businesswoman-circular-avatar-icon-399956737.jpg";

const GATEWAY_ICONS = {
  'JazzCash': 'https://i.ibb.co/LX2pqZBV/Screenshot-20260816-074727-3.jpg',
  'Easypaisa': 'https://i.ibb.co/cXv3yLJd/8031c6abd95fcee33da6ecb67264eaa2.jpg',
  'Bank Transfer': 'https://i.ibb.co/4nVJdkQG/Screenshot-20260816-075035-1.jpg'
};

let toastTimeout = null;
function showToast(title, message, iconName = 'check-circle-2', isError = false) {
  const toast = document.getElementById('app-toast');
  const titleEl = document.getElementById('toast-title');
  const msgEl = document.getElementById('toast-message');
  const iconBox = document.getElementById('toast-icon-box');

  titleEl.innerText = title;
  msgEl.innerText = message;

  if (isError) {
    iconBox.className = 'w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-sm';
  } else {
    iconBox.className = 'w-10 h-10 rounded-xl bg-purple-50 text-brand-purple flex items-center justify-center flex-shrink-0 shadow-sm';
  }

  iconBox.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
  lucide.createIcons({ root: iconBox });

  toast.classList.remove('toast-enter');
  toast.classList.add('toast-visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-enter');
  }, 3500);
}

// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGfceOTPICSWNe948xHcqNy9DQWyJ3zzc",
  authDomain: "growth-31702.firebaseapp.com",
  projectId: "growth-31702",
  storageBucket: "growth-31702.firebasestorage.app",
  messagingSenderId: "1032728993099",
  appId: "1:1032728993099:web:56ad75c99fcb41e8f59cce"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// Server Time Synchronization
let serverTimeOffset = 0;
db.ref('.info/serverTimeOffset').on('value', (snap) => {
  serverTimeOffset = snap.val() || 0;
});
function getServerTime() {
  return Date.now() + serverTimeOffset;
}

let currentUser = null;
let currentBalance = 0.00;
let currentUserGender = 'Male';
let currentReferralCode = "USMAN123";
let userInvestments = [];
let savedPaymentMethods = {};
let selectedPackageForPayment = null;
let selectedPaymentGateway = 'JazzCash';
let currentWithdrawLimit = 0.00;

let historyTab = 'all';
let historyLimit = 8;
let policyReturnScreen = 'screen-signup';

// Active DB Listeners References
let activeUserRef = null;
let activeInvestmentsRef = null;
let activeWithdrawalsRef = null;

const urlParams = new URLSearchParams(window.location.search);
const incomingRef = urlParams.get('ref');
if (incomingRef) {
  const banner = document.getElementById('referred-by-banner');
  const codeSpan = document.getElementById('referred-by-code');
  if (banner && codeSpan) {
    codeSpan.innerText = incomingRef.toUpperCase();
    banner.classList.remove('hidden');
  }
}

const PACKAGE_DURATION_MS = 36500 * 24 * 60 * 60 * 1000;

const investmentPackages = [
  { id: "pkg-01", name: "Package 01", invest: "250 PKR", investNum: 250, daily: "100 PKR", dailyNum: 100, total: "3,650,000 PKR", netProfit: "Rs. 3,649,750", gradient: "from-indigo-600 to-purple-600", badge: "bg-indigo-100 text-indigo-700" },
  { id: "pkg-02", name: "Package 02", invest: "400 PKR", investNum: 400, daily: "150 PKR", dailyNum: 150, total: "5,475,000 PKR", netProfit: "Rs. 5,474,600", gradient: "from-blue-600 to-cyan-600", badge: "bg-blue-100 text-blue-700" },
  { id: "pkg-03", name: "Package 03", invest: "1,000 PKR", investNum: 1000, daily: "350 PKR", dailyNum: 350, total: "12,775,000 PKR", netProfit: "Rs. 12,774,000", gradient: "from-emerald-600 to-teal-600", badge: "bg-emerald-100 text-emerald-700" },
  { id: "pkg-04", name: "Package 04", invest: "2,500 PKR", investNum: 2500, daily: "900 PKR", dailyNum: 900, total: "32,850,000 PKR", netProfit: "Rs. 32,847,500", gradient: "from-amber-600 to-orange-600", badge: "bg-amber-100 text-amber-700" },
  { id: "pkg-05", name: "Package 05", invest: "5,000 PKR", investNum: 5000, daily: "2,000 PKR", dailyNum: 2000, total: "73,000,000 PKR", netProfit: "Rs. 72,995,000", gradient: "from-rose-600 to-pink-600", badge: "bg-rose-100 text-rose-700" },
  { id: "pkg-06", name: "Package 06", invest: "10,000 PKR", investNum: 10000, daily: "4,500 PKR", dailyNum: 4500, total: "164,250,000 PKR", netProfit: "Rs. 164,240,000", gradient: "from-violet-600 to-fuchsia-600", badge: "bg-violet-100 text-violet-700" },
  { id: "pkg-07", name: "Package 07", invest: "25,000 PKR", investNum: 25000, daily: "12,000 PKR", dailyNum: 12000, total: "438,000,000 PKR", netProfit: "Rs. 437,975,000", gradient: "from-teal-600 to-emerald-700", badge: "bg-teal-100 text-teal-700" },
  { id: "pkg-08", name: "Package 08", invest: "50,000 PKR", investNum: 50000, daily: "25,000 PKR", dailyNum: 25000, total: "912,500,000 PKR", netProfit: "Rs. 912,450,000", gradient: "from-orange-600 to-red-600", badge: "bg-orange-100 text-orange-700" },
  { id: "pkg-09", name: "Package 09", invest: "100,000 PKR", investNum: 100000, daily: "55,000 PKR", dailyNum: 55000, total: "2,007,500,000 PKR", netProfit: "Rs. 2,007,400,000", gradient: "from-purple-700 to-pink-700", badge: "bg-purple-100 text-purple-700" },
  { id: "pkg-10", name: "Package 10", invest: "150,000 PKR", investNum: 150000, daily: "85,000 PKR", dailyNum: 85000, total: "3,102,500,000 PKR", netProfit: "Rs. 3,102,350,000", gradient: "from-cyan-700 to-blue-800", badge: "bg-cyan-100 text-cyan-700" },
  { id: "pkg-11", name: "Package 11", invest: "200,000 PKR", investNum: 200000, daily: "120,000 PKR", dailyNum: 120000, total: "4,380,000,000 PKR", netProfit: "Rs. 4,379,800,000", gradient: "from-amber-700 to-yellow-600", badge: "bg-amber-100 text-amber-800" }
];

function isPackageActive(pkgName) {
  const now = getServerTime();
  return userInvestments.some(inv => 
    inv.packageName === pkgName && 
    inv.status === 'Approved' && 
    (now - (inv.createdAt || 0)) < PACKAGE_DURATION_MS
  );
}

function isPackageProcessing(pkgName) {
  return userInvestments.some(inv => 
    inv.packageName === pkgName && 
    inv.status === 'Pending'
  );
}

function renderPackages() {
  const container = document.getElementById('investment-packages-list');
  if (!container) return;

  container.innerHTML = investmentPackages.map((pkg) => {
    const active = isPackageActive(pkg.name);
    const processing = isPackageProcessing(pkg.name);

    let buttonHtml = '';
    if (active) {
      buttonHtml = `
        <button disabled class="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 opacity-95 cursor-not-allowed">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>Active</span>
        </button>
      `;
    } else if (processing) {
      buttonHtml = `
        <button disabled class="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 opacity-95 cursor-not-allowed">
          <i data-lucide="clock" class="w-4 h-4"></i>
          <span>Processing</span>
        </button>
      `;
    } else {
      buttonHtml = `
        <button onclick="openPaymentScreen('${pkg.id}')" class="w-full py-3.5 rounded-2xl bg-gradient-to-r ${pkg.gradient} text-white font-extrabold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>Invest Now</span>
        </button>
      `;
    }

    return `
      <div class="bg-white rounded-3xl border border-slate-100 shadow-md p-5 relative overflow-hidden transition hover:shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-extrabold ${pkg.badge}">${pkg.name}</span>
          <span class="text-[11px] font-bold text-slate-400">36,500 Days</span>
        </div>

        <div class="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl mb-3.5">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invest Amount</p>
            <h4 class="text-base font-extrabold text-slate-900">${pkg.invest}</h4>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Daily Return</p>
            <h4 class="text-base font-extrabold text-emerald-600">${pkg.daily}</h4>
          </div>
        </div>

        <div class="space-y-1.5 text-[11px] font-semibold text-slate-600 mb-4 px-1">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Total Return:</span>
            <span class="font-extrabold text-slate-800">${pkg.total}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Net Profit:</span>
            <span class="font-extrabold text-emerald-600">${pkg.netProfit}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <span class="text-emerald-500">✔</span> Daily Withdrawal &bull; No Referral Required
          </div>
        </div>

        ${buttonHtml}
      </div>
    `;
  }).join('');

  lucide.createIcons({ root: container });
}
renderPackages();

function openPaymentScreen(pkgId) {
  const pkg = investmentPackages.find(p => p.id === pkgId);
  if (!pkg) return;

  if (isPackageActive(pkg.name)) {
    showToast("Already Active", "This package is already active on your account!", "alert-circle", true);
    return;
  }
  if (isPackageProcessing(pkg.name)) {
    showToast("Approval Pending", "Your request for this package is currently in processing!", "clock", true);
    return;
  }

  selectedPackageForPayment = pkg;

  document.getElementById('pay-pkg-badge').innerText = pkg.name;
  document.getElementById('pay-pkg-price').innerText = pkg.invest;
  document.getElementById('pay-pkg-daily').innerText = pkg.daily;

  document.getElementById('pay-sender-acc').value = '';
  document.getElementById('pay-trx-id').value = '';

  selectPaymentGateway('JazzCash');
  goToScreen('screen-payment');
}

function selectPaymentGateway(gateway) {
  selectedPaymentGateway = gateway;
  const jazzCard = document.getElementById('gateway-card-jazzcash');
  const easyCard = document.getElementById('gateway-card-easypaisa');

  if (gateway === 'JazzCash') {
    jazzCard.className = "p-3 border-2 border-emerald-500 bg-emerald-50/50 rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition";
    easyCard.className = "p-3 border-2 border-slate-200 bg-white rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition";
  } else {
    easyCard.className = "p-3 border-2 border-emerald-500 bg-emerald-50/50 rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition";
    jazzCard.className = "p-3 border-2 border-slate-200 bg-white rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition";
  }
}

async function submitPaymentRequest() {
  if (!currentUser || !selectedPackageForPayment) return;

  const senderAcc = document.getElementById('pay-sender-acc').value.trim();
  const trxId = document.getElementById('pay-trx-id').value.trim();
  const btn = document.getElementById('pay-securely-btn');

  if (!senderAcc || !trxId) {
    showToast("Missing Information", "Please enter both sender account number and Transaction ID ( Trx ID ).", "alert-circle", true);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>Processing Request...</span>';

  try {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Node: /investments/{uid}/{invId}
    const newInvestmentRef = db.ref('investments/' + currentUser.uid).push();
    const invId = newInvestmentRef.key;

    const investmentData = {
      id: invId,
      type: 'deposit',
      userId: currentUser.uid,
      userName: document.getElementById('user-display-name').innerText || 'User',
      packageName: selectedPackageForPayment.name,
      packagePrice: selectedPackageForPayment.invest,
      packagePriceNum: selectedPackageForPayment.investNum,
      dailyReturn: selectedPackageForPayment.daily,
      dailyReturnNum: selectedPackageForPayment.dailyNum,
      senderAccount: senderAcc,
      transactionId: trxId,
      paymentMethod: selectedPaymentGateway,
      status: "Pending",
      date: dateStr,
      time: timeStr,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      lastClaimedTimestamp: 0
    };

    await newInvestmentRef.set(investmentData);
    await db.ref('investment_requests/' + invId).set(investmentData);

    showToast("Request Submitted!", `Your request for ${selectedPackageForPayment.name} has been placed!`, "check-check");
    goToScreen('screen-history');
  } catch (err) {
    showToast("Submission Error", err.message, "alert-circle", true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="shield-check" class="w-5 h-5"></i><span>Pay Securely</span>';
    lucide.createIcons({ root: btn });
  }
}

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    listenToUserData(user.uid);
    goToScreen('screen-dashboard');
  } else {
    cleanupListeners();
    currentUser = null;
    goToScreen('screen-signup');
  }
});

function cleanupListeners() {
  if (activeUserRef) { activeUserRef.off(); activeUserRef = null; }
  if (activeInvestmentsRef) { activeInvestmentsRef.off(); activeInvestmentsRef = null; }
  if (activeWithdrawalsRef) { activeWithdrawalsRef.off(); activeWithdrawalsRef = null; }
}

// 1. Flattened Profile Listener: /users/{uid}
function listenToUserData(uid) {
  cleanupListeners();

  activeUserRef = db.ref('users/' + uid);
  activeUserRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const fullName = data.fullName || 'User';
      currentBalance = parseFloat(data.balance || 0);
      currentUserGender = data.gender || 'Male';
      currentReferralCode = data.referralCode || generateRefCodeFromName(fullName);
      savedPaymentMethods = data.saved_payment_methods || {};

      currentWithdrawLimit = parseFloat(data.withdrawLimit || 0.00);

      const lastDailyClaim = data.lastDailyBonusClaim || 0;
      const oneDayMs = 24 * 60 * 60 * 1000;
      const bonusTag = document.getElementById('daily-bonus-status-tag');
      if (bonusTag) {
        if (getServerTime() - lastDailyClaim >= oneDayMs) {
          bonusTag.innerText = "Claim";
          bonusTag.className = "text-[9px] text-emerald-600 font-extrabold mt-0.5 bg-emerald-50 px-1.5 py-0.5 rounded";
        } else {
          bonusTag.innerText = "Claimed";
          bonusTag.className = "text-[9px] text-slate-400 font-extrabold mt-0.5";
        }
      }

      document.getElementById('user-display-name').innerText = fullName;
      document.getElementById('profile-full-name').innerText = fullName;
      document.getElementById('profile-email-address').innerText = data.email || (currentUser ? currentUser.email : '');
      document.getElementById('profile-gender-badge').innerText = currentUserGender;

      document.getElementById('view-profile-name').value = fullName;
      document.getElementById('view-profile-email').value = data.email || '';
      document.getElementById('view-profile-phone').value = data.phone || '';
      document.getElementById('view-profile-gender').value = currentUserGender;

      const avatarUrl = (currentUserGender.toLowerCase() === 'female') ? AVATAR_FEMALE : AVATAR_MALE;
      document.getElementById('profile-user-avatar').src = avatarUrl;
      document.getElementById('view-profile-avatar').src = avatarUrl;

      document.getElementById('refer-code-val').innerText = currentReferralCode;
      
      const currentOrigin = window.location.origin + window.location.pathname;
      const shareUrl = `${currentOrigin}?ref=${currentReferralCode}`;
      document.getElementById('refer-link-val').innerText = shareUrl;
      
      const homeRefDisplay = document.getElementById('home-refer-link-display');
      if (homeRefDisplay) homeRefDisplay.innerText = shareUrl;

      updateBalanceUI();
      renderSavedPaymentMethods();
      renderWithdrawPaymentOptions();
    }
  });

  // 2. Investments Listener: /investments/{uid}
  activeInvestmentsRef = db.ref('investments/' + uid);
  activeInvestmentsRef.on('value', (snap) => {
    const invData = snap.val();
    userInvestments = invData ? Object.values(invData).reverse() : [];
    
    // Check if any package approved to award 10% commission to referrer
    db.ref('users/' + uid).once('value').then(uSnap => {
      const uVal = uSnap.val();
      if (uVal && uVal.referredBy) {
        checkForReferralPackageCommission(userInvestments, uVal.referredBy);
      }
    });

    renderPackages();
    renderActiveTasks();
    updateBalanceUI();
  });

  // 3. Recent Withdrawals for Wallet Widget
  activeWithdrawalsRef = db.ref('withdrawals/' + uid).limitToLast(5);
  activeWithdrawalsRef.on('value', (snap) => {
    const wdData = snap.val();
    const list = wdData ? Object.values(wdData).reverse() : [];
    renderWalletWithdrawalsUI(list);
  });
}

// 10% Commission Award to User A when User B Package is Approved
async function checkForReferralPackageCommission(investments, referredByCode) {
  if (!referredByCode || !investments || !currentUser) return;

  for (const inv of investments) {
    if (inv.status === 'Approved' && !inv.commissionAwarded) {
      const refLookupSnap = await db.ref('referral_codes/' + referredByCode.toUpperCase()).once('value');
      const refObj = refLookupSnap.val();
      if (refObj && refObj.uid) {
        const referrerUid = refObj.uid;
        const referrerSnap = await db.ref('users/' + referrerUid).once('value');
        const referrerUser = referrerSnap.val();

        if (referrerUser) {
          // Exactly 10% Commission of package price
          const commission = (inv.packagePriceNum || 0) * 0.10;
          const newReferrerBal = (parseFloat(referrerUser.balance) || 0) + commission;
          const currentTotalComm = (parseFloat(referrerUser.totalReferralCommission) || 0) + commission;

          const d = new Date();
          const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

          await db.ref('transactions/' + referrerUid).push({
            type: 'reward',
            title: `10% Referral Commission (${inv.packageName})`,
            amountStr: `+Rs. ${commission.toFixed(2)}`,
            isPositive: true,
            date: dateStr,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });

          await db.ref('users/' + referrerUid).update({
            balance: newReferrerBal,
            totalReferralCommission: currentTotalComm
          });

          await db.ref('investments/' + currentUser.uid + '/' + inv.id).update({
            commissionAwarded: true
          });
        }
      }
    }
  }
}

function generateRefCodeFromName(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'USER';
  const rand = Math.floor(100 + Math.random() * 900);
  return clean + rand;
}

function updateBalanceUI() {
  const formattedBal = currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('balance-display').innerText = formattedBal;
  document.getElementById('my-wallet-balance').innerText = formattedBal;
  document.getElementById('profile-total-earnings').innerText = formattedBal;
  document.getElementById('withdraw-available-balance').innerText = formattedBal;
  document.getElementById('withdraw-available-limit').innerText = currentWithdrawLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hasActivePkg = userInvestments.some(inv => inv.status === 'Approved');
  const urduNoteBox = document.getElementById('withdraw-urdu-note-box');
  const urduNoteEl = document.getElementById('withdraw-urdu-note-text');
  const rangeEl = document.getElementById('withdraw-range-text');

  if (hasActivePkg) {
    if (urduNoteBox) urduNoteBox.classList.remove('hidden');
    if (urduNoteEl) {
      const uName = document.getElementById('profile-full-name').innerText || 'صارف';
      const formattedLim = currentWithdrawLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      urduNoteEl.innerHTML = `محترم صارف <b>${uName}</b>،<br>
      آپ کی واپسی کی حد <b>PKR ${formattedLim}</b> ہے۔<br>
      براہ کرم اپنے ریفرلز بڑھائیں تاکہ آپ کی واپسی کی حد بڑھ سکے۔ جب آپ کا ریفرل پیکیج خریدتا ہے تو آپ کو پیکیج کی قیمت کا 10% کمیشن ملتا ہے۔ اس کے بعد آپ رقم نکال سکیں گے۔<br>
      شکریہ۔`;
    }
    if (rangeEl) {
      rangeEl.innerText = `Withdrawable Range: Rs. 20.00 - Rs. ${currentWithdrawLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else {
    if (urduNoteBox) urduNoteBox.classList.add('hidden');
    if (rangeEl) {
      rangeEl.innerText = `Minimum withdraw amount Rs. 20`;
    }
  }
}

async function claimDailyBonusReward() {
  if (!currentUser) return;

  const now = getServerTime();
  const activePkgs = userInvestments.filter(inv => 
    inv.status === 'Approved' && 
    (now - (inv.createdAt || 0)) < PACKAGE_DURATION_MS
  );

  if (activePkgs.length === 0) {
    showToast("No Active Package", "You must have at least one active package to claim Daily Bonus.", "alert-circle", true);
    return;
  }

  const userSnap = await db.ref('users/' + currentUser.uid).once('value');
  const data = userSnap.val() || {};
  const lastClaim = data.lastDailyBonusClaim || 0;
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (now - lastClaim < oneDayMs) {
    const remMs = oneDayMs - (now - lastClaim);
    const remHours = Math.ceil(remMs / (1000 * 60 * 60));
    showToast("Bonus Locked", `Daily bonus already claimed. Next in ${remHours} hours.`, "clock", true);
    return;
  }

  const totalActiveInvest = activePkgs.reduce((sum, p) => sum + (p.packagePriceNum || 0), 0);
  const rewardAmount = totalActiveInvest * 0.04;
  const newBal = currentBalance + rewardAmount;
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Record Reward Transaction
  await db.ref('transactions/' + currentUser.uid).push({
    type: 'reward',
    title: 'Daily Bonus Reward',
    amountStr: `+Rs. ${rewardAmount.toFixed(2)}`,
    isPositive: true,
    date: dateStr,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  await db.ref('users/' + currentUser.uid).update({
    balance: newBal,
    lastDailyBonusClaim: firebase.database.ServerValue.TIMESTAMP
  });

  showToast("Daily Bonus Claimed! 🎉", `+Rs. ${rewardAmount.toFixed(2)} added to your balance!`, "calendar");
}

function shareInviteLinkNative() {
  const currentOrigin = window.location.origin + window.location.pathname;
  const link = `${currentOrigin}?ref=${currentReferralCode}`;
  const message = `🔥 Join the official Earn Money App & start making daily profits right now!\n👉 Use my Invitation Code & Get Rs.50: ${currentReferralCode}\n👇🔗 Link to join: ${link}`;

  if (navigator.share) {
    navigator.share({
      title: 'Nexus Earn Hub',
      text: message,
      url: link
    }).catch(() => {});
  } else {
    copyTextUniversal(message, "Copied", "Invite message and link copied!");
  }
}

function copyReferralCode() {
  const code = document.getElementById('refer-code-val').innerText;
  copyTextUniversal(code, "Code Copied", "Referral code copied!");
}

function copyReferralLink() {
  const currentOrigin = window.location.origin + window.location.pathname;
  const link = `${currentOrigin}?ref=${currentReferralCode}`;
  copyTextUniversal(link, "Link Copied", "Invite link copied!");
}

function renderActiveTasks() {
  const homeContainer = document.getElementById('home-tasks-container');
  const now = getServerTime();
  const approvedInvestments = userInvestments.filter(inv => 
    inv.status === 'Approved' && 
    (now - (inv.createdAt || 0)) < PACKAGE_DURATION_MS
  );

  if (approvedInvestments.length === 0) {
    homeContainer.innerHTML = `
      <div class="p-5 text-center bg-slate-50 border border-slate-100 rounded-3xl">
        <div class="w-11 h-11 rounded-2xl bg-purple-50 text-brand-purple flex items-center justify-center mx-auto mb-1.5 shadow-sm">
          <i data-lucide="sparkles" class="w-5 h-5"></i>
        </div>
        <h4 class="text-xs font-extrabold text-slate-800">No Active Tasks Yet</h4>
        <p class="text-[11px] text-slate-400 mt-0.5 max-w-[220px] mx-auto">Activate any investment package from Packages tab to start claiming daily returns.</p>
        <button onclick="goToScreen('screen-earn')" class="mt-2.5 px-4 py-1.5 rounded-xl bg-brand-purple text-white text-xs font-bold shadow-md shadow-purple-200">
          View Packages
        </button>
      </div>
    `;
    lucide.createIcons({ root: homeContainer });
    return;
  }

  homeContainer.innerHTML = approvedInvestments.map(inv => {
    const lastClaim = inv.lastClaimedTimestamp || 0;
    const timePassed = now - lastClaim;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const canClaim = timePassed >= oneDayMs;

    let hoursLeft = 0, minsLeft = 0;
    if (!canClaim) {
      const remainingMs = oneDayMs - timePassed;
      hoursLeft = Math.floor(remainingMs / (60 * 60 * 1000));
      minsLeft = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    }

    return `
      <div class="p-3.5 bg-gradient-to-br from-white via-purple-50/20 to-emerald-50/20 border border-purple-100 rounded-3xl shadow-sm hover:shadow-md transition">
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-200">
              ⚡
            </div>
            <div>
              <h4 class="text-xs font-extrabold text-slate-900">${inv.packageName}</h4>
              <p class="text-[10px] font-semibold text-slate-400">Invested: ${inv.packagePrice}</p>
            </div>
          </div>
          <span class="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+${inv.dailyReturn} / Day</span>
        </div>

        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-500">
            ${canClaim ? '🟢 Ready to claim reward!' : `⏳ Next in ${hoursLeft}h ${minsLeft}m`}
          </span>
          
          <button 
            onclick="claimPackageDailyReturn('${inv.id}')"
            ${canClaim ? '' : 'disabled'}
            class="px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 ${
              canClaim 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }">
            ${canClaim ? `Claim ${inv.dailyReturn}` : 'Claimed'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons({ root: homeContainer });
}

// When User B claims task -> User A (Referrer) withdraw limit increases by 8% of package price
async function claimPackageDailyReturn(invId) {
  if (!currentUser) return;
  const inv = userInvestments.find(i => i.id === invId);
  if (!inv || inv.status !== 'Approved') return;

  const now = getServerTime();
  const lastClaim = inv.lastClaimedTimestamp || 0;
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (now - lastClaim < oneDayMs) {
    showToast("Claim Locked", "You can claim daily return once every 24 hours.", "clock", true);
    return;
  }

  const returnAmount = parseFloat(inv.dailyReturnNum || 0);
  const newBal = currentBalance + returnAmount;

  await db.ref('investments/' + currentUser.uid + '/' + invId).update({
    lastClaimedTimestamp: firebase.database.ServerValue.TIMESTAMP
  });

  await db.ref('users/' + currentUser.uid).update({
    balance: newBal
  });

  // 8% Withdrawal Limit Increase for Referrer (Without mentioning 8% on UI)
  const userSnap = await db.ref('users/' + currentUser.uid).once('value');
  const userData = userSnap.val();
  if (userData && userData.referredBy) {
    const refCodeSnap = await db.ref('referral_codes/' + userData.referredBy.toUpperCase()).once('value');
    const refObj = refCodeSnap.val();
    if (refObj && refObj.uid) {
      const referrerUid = refObj.uid;
      const referrerUserSnap = await db.ref('users/' + referrerUid).once('value');
      const referrerUser = referrerUserSnap.val();

      if (referrerUser) {
        const limitIncrease = (inv.packagePriceNum || 0) * 0.08;
        const currentRefLimit = parseFloat(referrerUser.withdrawLimit || 0.00) + limitIncrease;

        await db.ref('users/' + referrerUid).update({
          withdrawLimit: currentRefLimit
        });
      }
    }
  }

  showToast("Daily Return Claimed!", `🎉 +Rs. ${returnAmount.toFixed(2)} added from ${inv.packageName}!`, "badge-percent");
}

function switchHistoryTab(tab) {
  historyTab = tab;
  historyLimit = 8;

  ['all', 'deposit', 'withdraw', 'reward'].forEach(t => {
    const btn = document.getElementById('tab-btn-' + t);
    if (t === tab) {
      btn.className = "py-2 rounded-xl text-xs font-extrabold transition bg-white text-brand-purple shadow-sm";
    } else {
      btn.className = "py-2 rounded-xl text-xs font-extrabold transition text-slate-500 hover:text-slate-900";
    }
  });

  renderHistoryScreen();
}

// Optimized Query on flattened nodes (Package Return history excluded as requested)
async function renderHistoryScreen() {
  if (!currentUser) return;
  const container = document.getElementById('history-items-container');
  const loadMoreBox = document.getElementById('history-load-more-box');
  if (!container) return;

  container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Loading history...</p>';

  let combined = [];

  try {
    if (historyTab === 'all' || historyTab === 'deposit') {
      const invSnap = await db.ref('investments/' + currentUser.uid).limitToLast(historyLimit).once('value');
      const invData = invSnap.val() || {};
      Object.values(invData).forEach(inv => {
        combined.push({
          type: 'deposit',
          title: `Deposit: ${inv.packageName}`,
          amountStr: inv.packagePrice,
          status: inv.status === 'Approved' ? 'Approved' : (inv.status === 'Rejected' ? 'Rejected' : 'Pending'),
          date: inv.date,
          time: inv.time || '',
          trx: inv.transactionId || 'N/A',
          timestamp: inv.createdAt || 0
        });
      });
    }

    if (historyTab === 'all' || historyTab === 'withdraw') {
      const wdSnap = await db.ref('withdrawals/' + currentUser.uid).limitToLast(historyLimit).once('value');
      const wdData = wdSnap.val() || {};
      Object.values(wdData).forEach(w => {
        const rawNum = (w.accountNumber || '').replace(/[()]/g, '');
        const cleanNum = maskAccountNumber(rawNum);
        combined.push({
          type: 'withdraw',
          title: `Withdraw to ${w.method} - ${cleanNum}`,
          amountStr: `- Rs. ${parseFloat(w.amount).toFixed(2)}`,
          status: w.status || 'Pending',
          date: w.date || 'Today',
          time: w.time || '',
          trx: `Title: ${w.accountTitle || 'N/A'}`,
          timestamp: w.timestamp || 0
        });
      });
    }

    if (historyTab === 'all' || historyTab === 'reward') {
      const txSnap = await db.ref('transactions/' + currentUser.uid).limitToLast(historyLimit).once('value');
      const txData = txSnap.val() || {};
      Object.values(txData).forEach(tx => {
        if (tx.type === 'reward') {
          combined.push({
            type: 'reward',
            title: tx.title,
            amountStr: tx.amountStr,
            status: 'Approved',
            date: tx.date,
            time: '',
            trx: 'Bonus Reward',
            timestamp: tx.timestamp || 0
          });
        }
      });
    }

    combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (combined.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-50 border border-slate-100 rounded-3xl">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
          <h4 class="text-xs font-extrabold text-slate-800">No History Records</h4>
          <p class="text-[11px] text-slate-400 mt-1">No activities found in this section.</p>
        </div>
      `;
      if (loadMoreBox) loadMoreBox.classList.add('hidden');
      lucide.createIcons({ root: container });
      return;
    }

    const visible = combined.slice(0, historyLimit);

    container.innerHTML = visible.map(inv => {
      let statusBadge = '<span class="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 font-extrabold text-[10px]">🟢 Approved</span>';
      if (inv.status === 'Pending') {
        statusBadge = '<span class="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-extrabold text-[10px]">🟡 Pending</span>';
      } else if (inv.status === 'Rejected') {
        statusBadge = '<span class="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-500 font-extrabold text-[10px]">🔴 Rejected</span>';
      }

      return `
        <div class="p-3.5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-brand-purple"></span>
              <h4 class="text-xs font-black text-slate-900">${inv.title}</h4>
            </div>
            ${statusBadge}
          </div>

          <div class="flex justify-between items-center bg-slate-50 p-2 rounded-2xl mb-2">
            <span class="text-[11px] font-semibold text-slate-400">Amount:</span>
            <span class="text-xs font-black text-brand-purple">${inv.amountStr}</span>
          </div>

          <div class="space-y-1 text-[10px] font-medium text-slate-400">
            <div class="flex justify-between">
              <span>Date:</span>
              <span class="font-bold text-slate-700">${inv.date} ${inv.time || ''}</span>
            </div>
            <div class="flex justify-between">
              <span>Details:</span>
              <span class="font-bold text-slate-700">${inv.trx}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (combined.length >= historyLimit) {
      loadMoreBox.classList.remove('hidden');
    } else {
      loadMoreBox.classList.add('hidden');
    }

    lucide.createIcons({ root: container });
  } catch (e) {
    container.innerHTML = '<p class="text-xs text-red-500 text-center py-4">Error loading history.</p>';
  }
}

function loadMoreHistory() {
  historyLimit += 8;
  renderHistoryScreen();
}

function maskAccountNumber(num) {
  if (!num) return '';
  const clean = num.replace(/[^0-9a-zA-Z]/g, '');
  if (clean.length <= 4) return clean;
  return clean.slice(0, 4) + '****' + clean.slice(-3);
}

function renderWalletWithdrawalsUI(withdrawalsList) {
  const list = document.getElementById('wallet-withdraw-history-list');
  if (!list) return;

  if (!withdrawalsList || withdrawalsList.length === 0) {
    list.innerHTML = `
      <div class="p-5 text-center bg-slate-50 rounded-2xl border border-slate-100">
        <i data-lucide="receipt" class="w-7 h-7 mx-auto text-slate-300 mb-1"></i>
        <p class="text-xs font-semibold text-slate-400">No withdrawal records yet.</p>
      </div>
    `;
    lucide.createIcons({ root: list });
    return;
  }

  const visible = withdrawalsList.slice(0, 3);

  list.innerHTML = visible.map(item => {
    const rawNum = (item.accountNumber || '').replace(/[()]/g, '');
    const cleanNum = maskAccountNumber(rawNum);
    let badgeColor = 'text-amber-500 bg-amber-50';
    if (item.status === 'Approved') badgeColor = 'text-emerald-600 bg-emerald-50';
    if (item.status === 'Rejected') badgeColor = 'text-red-500 bg-red-50';

    return `
      <div class="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <i data-lucide="upload" class="w-4 h-4"></i>
          </div>
          <div>
            <h5 class="text-xs font-extrabold text-slate-800">${item.method} - ${cleanNum}</h5>
            <p class="text-[10px] font-medium text-slate-400 mt-0.5">${item.date || 'Today'} &bull; <span class="px-1.5 py-0.5 rounded font-bold ${badgeColor}">${item.status || 'Pending'}</span></p>
          </div>
        </div>
        <span class="text-xs font-extrabold text-red-500">- Rs. ${parseFloat(item.amount).toFixed(2)}</span>
      </div>
    `;
  }).join('');

  lucide.createIcons({ root: list });
}

function goToWithdrawHistoryTab() {
  goToScreen('screen-history');
  switchHistoryTab('withdraw');
}

async function handleSaveWithdrawAccount(e) {
  e.preventDefault();
  if (!currentUser) return;

  const gateway = document.getElementById('save-method-type').value;
  const titleInput = document.getElementById('save-account-title');
  const numInput = document.getElementById('save-account-number');
  const btn = document.getElementById('save-method-submit-btn');

  const title = titleInput.value.trim();
  const number = numInput.value.trim();

  if (!title || !number) return;

  btn.disabled = true;
  btn.innerText = "Checking Account...";

  try {
    const cleanNumber = number.replace(/[^0-9a-zA-Z]/g, '');
    const globalCheckSnap = await db.ref('global_registered_accounts/' + cleanNumber).once('value');
    const existingData = globalCheckSnap.val();

    if (existingData && existingData.userId !== currentUser.uid) {
      showToast("Account In Use", "This account number is already registered by another user.", "alert-triangle", true);
      btn.disabled = false;
      btn.innerText = "Save Payment Method";
      return;
    }

    await db.ref('users/' + currentUser.uid + '/saved_payment_methods/' + gateway).set({
      gateway: gateway,
      title: title,
      number: number,
      iconUrl: GATEWAY_ICONS[gateway] || '',
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });

    await db.ref('global_registered_accounts/' + cleanNumber).set({
      userId: currentUser.uid,
      accountNumber: number,
      accountTitle: title,
      gateway: gateway,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    titleInput.value = '';
    numInput.value = '';

    showToast("Account Saved", `${gateway} account (${number}) saved successfully!`, "credit-card");
  } catch (err) {
    showToast("Error", err.message, "alert-circle", true);
  } finally {
    btn.disabled = false;
    btn.innerText = "Save Payment Method";
  }
}

async function deletePaymentMethod(gateway) {
  if (!currentUser) return;
  const methodObj = savedPaymentMethods[gateway];
  if (!methodObj) return;

  if (confirm(`Are you sure you want to delete your saved ${gateway} account?`)) {
    const cleanNumber = methodObj.number.replace(/[^0-9a-zA-Z]/g, '');
    await db.ref('users/' + currentUser.uid + '/saved_payment_methods/' + gateway).remove();
    await db.ref('global_registered_accounts/' + cleanNumber).remove();
    showToast("Account Deleted", `${gateway} account removed successfully!`, "trash-2");
  }
}

function renderSavedPaymentMethods() {
  const container = document.getElementById('saved-methods-container');
  if (!container) return;

  const methods = Object.values(savedPaymentMethods);
  if (methods.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl">No payment accounts saved yet.</p>';
    return;
  }

  container.innerHTML = methods.map(m => {
    const iconSrc = GATEWAY_ICONS[m.gateway] || 'https://i.ibb.co/4nVJdkQG/Screenshot-20260816-075035-1.jpg';
    return `
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="${iconSrc}" class="w-9 h-9 rounded-xl object-cover shadow-sm" alt="${m.gateway}">
          <div>
            <span class="text-xs font-black text-brand-purple">${m.gateway}</span>
            <h5 class="text-xs font-bold text-slate-800 mt-0.5">${m.number}</h5>
            <p class="text-[10px] text-slate-400 font-semibold">${m.title}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Saved</span>
          <button onclick="deletePaymentMethod('${m.gateway}')" title="Delete Method" class="p-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons({ root: container });
}

function renderWithdrawPaymentOptions() {
  const container = document.getElementById('dynamic-withdraw-methods');
  if (!container) return;

  const methods = Object.values(savedPaymentMethods);

  if (methods.length === 0) {
    container.innerHTML = `
      <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
        <p class="text-xs font-bold text-amber-800">No Payment Methods Added</p>
        <p class="text-[10px] text-amber-700 mt-1">Please add your JazzCash, Easypaisa, or Bank Account from Profile &gt; Payment Methods first.</p>
        <button onclick="goToScreen('screen-payment-methods')" class="mt-2.5 px-4 py-1.5 bg-brand-purple text-white rounded-xl text-xs font-extrabold shadow">
          Add Payment Method
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = methods.map((m, idx) => {
    const iconSrc = GATEWAY_ICONS[m.gateway] || 'https://i.ibb.co/4nVJdkQG/Screenshot-20260816-075035-1.jpg';
    return `
      <label class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-brand-purple transition">
        <div class="flex items-center gap-2.5">
          <img src="${iconSrc}" class="w-8 h-8 rounded-xl object-cover shadow-sm" alt="${m.gateway}">
          <div>
            <span class="text-xs font-bold text-slate-800 block">${m.gateway} - ${m.number}</span>
            <span class="text-[10px] text-slate-400 font-semibold">Title: ${m.title}</span>
          </div>
        </div>
        <input type="radio" name="withdraw-method" value="${m.gateway}" data-num="${m.number}" data-title="${m.title}" ${idx === 0 ? 'checked' : ''} class="w-4 h-4 text-brand-purple accent-brand-purple">
      </label>
    `;
  }).join('');
}

// User Withdraws & Limit is Deducted
async function handleProcessWithdrawal() {
  if (!currentUser) return;
  const methods = Object.values(savedPaymentMethods);
  if (methods.length === 0) {
    showToast("No Method", "Please add a payment method from Profile first.", "alert-circle", true);
    goToScreen('screen-payment-methods');
    return;
  }

  const amountInput = parseFloat(document.getElementById('withdraw-amount-input').value || 0);
  const selectedRadio = document.querySelector('input[name="withdraw-method"]:checked');
  
  if (!selectedRadio) {
    showToast("Select Method", "Please choose a withdrawal account.", "alert-circle", true);
    return;
  }

  const methodGateway = selectedRadio.value;
  const accNumber = selectedRadio.getAttribute('data-num') || '';
  const accTitle = selectedRadio.getAttribute('data-title') || '';
  const userFullName = document.getElementById('profile-full-name').innerText || 'User';

  if (isNaN(amountInput) || amountInput < 20) {
    showToast("Invalid Amount", "Minimum withdrawal amount is Rs. 20.", "alert-circle", true);
    return;
  }

  if (currentBalance < amountInput) {
    showToast("Insufficient Balance", "You don't have enough balance to withdraw this amount.", "alert-triangle", true);
    return;
  }

  if (amountInput > currentWithdrawLimit) {
    showToast("Limit Exceeded", `Withdrawal limit exceeded! Your current withdrawal limit is Rs. ${currentWithdrawLimit.toFixed(2)}.`, "alert-circle", true);
    return;
  }

  const newBal = currentBalance - amountInput;
  const newLimit = Math.max(0, currentWithdrawLimit - amountInput);
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const withdrawData = {
    userId: currentUser.uid,
    fullName: userFullName,
    method: methodGateway,
    accountNumber: accNumber,
    accountTitle: accTitle,
    amount: amountInput,
    status: "Pending",
    date: dateStr,
    time: timeStr,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  // Node: /withdrawals/{uid}
  const newWdRef = db.ref('withdrawals/' + currentUser.uid).push();
  await newWdRef.set({ id: newWdRef.key, ...withdrawData });
  await db.ref('withdraw_requests/' + newWdRef.key).set({ id: newWdRef.key, ...withdrawData });

  await db.ref('users/' + currentUser.uid).update({
    balance: newBal,
    withdrawLimit: newLimit
  });

  document.getElementById('withdraw-amount-input').value = '';
  showToast("Withdrawal Requested", `Your request of Rs. ${amountInput} via ${methodGateway} has been submitted!`, "check-check");
  goToScreen('screen-wallet');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'user****@email.com';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return name[0] + '****@' + domain;
  }
  return name.slice(0, 2) + '****' + name.slice(-1) + '@' + domain;
}

// 3. Referral Team Query: /referrals/{uid}
async function loadReferralsList() {
  if (!currentUser) return;
  const listEl = document.getElementById('referrals-team-list');
  const countEl = document.getElementById('ref-team-count-full');
  const commEl = document.getElementById('ref-earned-commission-total');
  if (!listEl) return;

  listEl.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Loading team...</p>';

  const uSnap = await db.ref('users/' + currentUser.uid).once('value');
  const u = uSnap.val() || {};
  const totalComm = parseFloat(u.totalReferralCommission || 0);
  if (commEl) commEl.innerText = totalComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const teamSnap = await db.ref('referrals/' + currentUser.uid).limitToLast(50).once('value');
  const team = teamSnap.val();

  if (!team) {
    countEl.innerText = '0';
    listEl.innerHTML = `
      <div class="text-center py-6">
        <i data-lucide="users" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
        <p class="text-xs font-semibold text-slate-400">No members joined with your code yet.</p>
      </div>
    `;
    lucide.createIcons({ root: listEl });
    return;
  }

  const members = Object.values(team);
  countEl.innerText = members.length.toString();

  listEl.innerHTML = members.map((m, idx) => `
    <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-full bg-purple-100 text-brand-purple font-extrabold text-xs flex items-center justify-center">
          ${idx + 1}
        </div>
        <div>
          <h5 class="text-xs font-extrabold text-slate-800">${m.fullName || 'Member'}</h5>
          <p class="text-[10px] text-slate-400 font-semibold">${maskEmail(m.email)}</p>
        </div>
      </div>
      <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Active</span>
    </div>
  `).join('');

  lucide.createIcons({ root: listEl });
}

// Single-Tab Highlight on Footer
function updateFooterActiveHighlight(screenId) {
  const tabMap = {
    'screen-dashboard': 'dashboard',
    'screen-history': 'history',
    'screen-earn': 'earn',
    'screen-wallet': 'wallet',
    'screen-profile': 'profile'
  };
  const activeTabName = tabMap[screenId] || '';

  document.querySelectorAll('.footer-tab').forEach(tab => {
    const tabType = tab.getAttribute('data-tab');
    if (tabType === activeTabName) {
      tab.classList.remove('text-slate-400');
      tab.classList.add('text-brand-purple');
    } else {
      tab.classList.remove('text-brand-purple');
      tab.classList.add('text-slate-400');
    }
  });
}

function goToScreen(screenId) {
  if (['screen-terms', 'screen-privacy', 'screen-help', 'screen-about'].includes(screenId)) {
    const active = document.querySelector('.app-screen.active');
    if (active && active.id !== screenId) policyReturnScreen = active.id;
  }

  document.querySelectorAll('.app-screen').forEach(el => {
    el.classList.remove('active');
    el.scrollTop = 0;
    const scrollableInner = el.querySelector('.overflow-y-auto');
    if (scrollableInner) scrollableInner.scrollTop = 0;
  });

  const paySender = document.getElementById('pay-sender-acc');
  const payTrx = document.getElementById('pay-trx-id');
  const withdrawAmt = document.getElementById('withdraw-amount-input');
  const saveTitle = document.getElementById('save-account-title');
  const saveNum = document.getElementById('save-account-number');

  if (screenId !== 'screen-payment' && paySender && payTrx) {
    paySender.value = '';
    payTrx.value = '';
  }
  if (screenId !== 'screen-withdraw' && withdrawAmt) {
    withdrawAmt.value = '';
  }
  if (screenId !== 'screen-payment-methods' && saveTitle && saveNum) {
    saveTitle.value = '';
    saveNum.value = '';
  }

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
    window.scrollTo(0, 0);
    updateFooterActiveHighlight(screenId);

    if (screenId === 'screen-history') {
      renderHistoryScreen();
    } else if (screenId === 'screen-referrals') {
      loadReferralsList();
    }
  }
}

function goBackFromPolicy() {
  goToScreen(policyReturnScreen || 'screen-signup');
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? '<i data-lucide="eye" class="w-4 h-4"></i>' : '<i data-lucide="eye-off" class="w-4 h-4"></i>';
  lucide.createIcons({ root: btn });
}

// Sign Up Handler: Stores Profile, Referral Lookup, and Direct Tree
async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const gender = document.getElementById('reg-gender').value;
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;
  const errorEl = document.getElementById('signup-error');
  const signupBtn = document.getElementById('signup-btn');

  errorEl.classList.add('hidden');

  if (!gender) {
    errorEl.innerText = "Please select your gender!";
    errorEl.classList.remove('hidden');
    return;
  }

  if (password !== confirmPassword) {
    errorEl.innerText = "Passwords do not match!";
    errorEl.classList.remove('hidden');
    return;
  }

  signupBtn.disabled = true;
  signupBtn.innerHTML = '<span>Creating Account...</span>';

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const newRefCode = generateRefCodeFromName(name);

    const initialBalance = incomingRef ? 50.00 : 0.00;

    // 1. Basic Profile (/users/{uid})
    await db.ref('users/' + user.uid).set({
      fullName: name,
      email: email,
      phone: phone,
      gender: gender,
      balance: initialBalance,
      withdrawLimit: 0.00,
      totalReferralCommission: 0.00,
      referralCode: newRefCode,
      referredBy: incomingRef || null,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });

    // 2. Referral Code Lookup Index (/referral_codes/{code})
    await db.ref('referral_codes/' + newRefCode).set({
      uid: user.uid,
      fullName: name,
      code: newRefCode
    });

    // 3. Tree Write to Referrer Node (/referrals/{referrerUid}/{newUserUid})
    if (incomingRef) {
      const refLookupSnap = await db.ref('referral_codes/' + incomingRef.toUpperCase()).once('value');
      const refObj = refLookupSnap.val();
      if (refObj && refObj.uid) {
        await db.ref('referrals/' + refObj.uid + '/' + user.uid).set({
          uid: user.uid,
          fullName: name,
          email: email,
          joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
      }

      // Welcome Bonus Transaction
      const d = new Date();
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      await db.ref('transactions/' + user.uid).push({
        type: 'reward',
        title: 'Referral Welcome Bonus',
        amountStr: '+Rs. 50.00',
        isPositive: true,
        date: dateStr,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    }

    document.getElementById('signup-form').reset();
    showToast("Account Created", incomingRef ? "Welcome to Nexus Earn Hub! Rs. 50 Bonus Added." : "Welcome to Nexus Earn Hub!", "user-check");
  } catch (err) {
    errorEl.innerText = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    signupBtn.disabled = false;
    signupBtn.innerHTML = '<span>Sign Up</span>';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');

  errorEl.classList.add('hidden');
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span>Logging in...</span>';

  try {
    await auth.signInWithEmailAndPassword(email, password);
    document.getElementById('login-form').reset();
    showToast("Welcome Back", "You have successfully logged in.", "log-in");
  } catch (err) {
    errorEl.innerText = "Invalid email or password. Please check your credentials and try again.";
    errorEl.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Login</span>';
  }
}

function handleForgotPassword() {
  const email = prompt("Enter your registered email address:");
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => showToast("Password Reset", "Reset instructions have been sent to your email.", "mail"))
      .catch(() => alert("Could not send reset email. Please ensure the email address is correct."));
  }
}

function handleLogout() {
  cleanupListeners();
  auth.signOut().then(() => {
    showToast("Logged Out", "You have been safely logged out.", "log-out");
    goToScreen('screen-signup');
  });
}

function copyTextUniversal(text, title, message) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(title, message, "copy");
    }).catch(() => {
      execCopyFallback(text, title, message);
    });
  } else {
    execCopyFallback(text, title, message);
  }
}

function execCopyFallback(text, title, message) {
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.style.position = "fixed";
  temp.style.left = "-9999px";
  document.body.appendChild(temp);
  temp.focus();
  temp.select();
  try {
    document.execCommand('copy');
    showToast(title, message, "copy");
  } catch (e) {}
  document.body.removeChild(temp);
}