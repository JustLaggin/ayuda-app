// updateprofile.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const updateForm = document.getElementById('updateForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const newPasswordInput = document.getElementById('newPassword');

let currentUserDoc = null;
backBtn.disabled = true;  
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    currentUserDoc = userSnap.data();

    firstNameInput.value = currentUserDoc.firstName ?? '';
    lastNameInput.value = currentUserDoc.lastName ?? '';

    backBtn.disabled = false;
  } catch (err) {
    console.error('Error loading user doc:', err);
    alert('Failed to load profile. Check console for details.');
  }
});
updateForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert('Not authenticated.');
    return;
  }

  try {
    const newFirstName = (firstNameInput.value || '').trim();
    const newLastName = (lastNameInput.value || '').trim();

    await updateDoc(doc(db, 'users', user.uid), {
      firstName: newFirstName,
      lastName: newLastName
    });

    if (newPasswordInput.value) {
      await updatePassword(user, newPasswordInput.value);
      alert('Password updated successfully!');
    }

    alert('Profile updated successfully!');
  } catch (err) {
    console.error('Error updating profile:', err);
    alert('Failed to update profile. Check console for details.');
  }
});
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'index.html?login=true';
  } catch (err) {
    console.error('Logout failed:', err);
    alert('Logout failed. Check console.');
  }
});

backBtn.addEventListener('click', () => {
  // Safety: ensure we have loaded the Firestore doc first
  if (!currentUserDoc || !currentUserDoc.role) {
    // Role unknown — either disabled button or show helpful message
    alert('User role not available yet. Please wait a moment and try again.');
    return;
  }

  const role = currentUserDoc.role;

  // Normalize role value (in case of uppercase or whitespace)
  const normalized = String(role).trim().toLowerCase();

  if (normalized === 'admin') {
    window.location.href = 'admin/admin-dashboard.html';
  } else if (normalized === 'user' || normalized === 'beneficiary' || normalized === 'resident') {
    // accept common synonyms you might use
    window.location.href = 'user/user-dashboard.html';
  } else {
    // Fallback: go to a safe landing page
    console.warn('Unrecognized role:', role);
    window.location.href = 'index.html';
  }
});
