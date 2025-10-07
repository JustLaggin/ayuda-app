import { auth, db } from './firebase-config.js';
import { 
  updatePassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Elements
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const updateForm = document.getElementById('updateForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const newPasswordInput = document.getElementById('newPassword');

// --- Load current user info ---
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = 'index.html';
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    firstNameInput.value = data.firstName || '';
    lastNameInput.value = data.lastName || '';
  }
});

// --- Save Changes ---
updateForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  try {
    const newFirstName = firstNameInput.value.trim();
    const newLastName = lastNameInput.value.trim();

    await updateDoc(doc(db, "users", user.uid), {
      firstName: newFirstName,
      lastName: newLastName
    });

    if (newPasswordInput.value) {
      await updatePassword(user, newPasswordInput.value);
      alert("Password updated successfully!");
    }

    alert("✅ Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("⚠️ Failed to update profile. Check console for details.");
  }
});

// --- Logout ---
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location = 'index.html';
  } catch (error) {
    console.error("Logout failed:", error);
  }
});

// --- Back Button ---
backBtn.addEventListener('click', () => {
  window.location = 'user-dashboard.html';
});
