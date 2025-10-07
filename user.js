import { auth, db } from './firebase-config.js';
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc, 
  arrayUnion 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// --- HTML References ---
const userNameEl = document.getElementById('userName');
const ayudasList = document.getElementById('ayudasList');
const settingsBtn = document.getElementById('settingsBtn');

// --- AUTH STATE ---
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = 'index.html';
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // ✅ Format: Firstname Lastname
      const formattedName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      userNameEl.textContent = `Welcome, ${formattedName}`;

      await loadAyudas(user.uid);
    } else {
      userNameEl.textContent = "Welcome, User";
      await loadAyudas(user.uid);
    }
  } catch (error) {
    console.error("🔥 Error fetching user data:", error);
    userNameEl.textContent = "Welcome, User";
    await loadAyudas(user.uid);
  }
});

// --- LOAD AYUDAS ---
async function loadAyudas(userId) {
  ayudasList.innerHTML = "<p>Loading ayudas...</p>";

  try {
    const ayudasSnap = await getDocs(collection(db, "ayudas"));
    ayudasList.innerHTML = "";

    if (ayudasSnap.empty) {
      ayudasList.innerHTML = "<p>No ayudas available yet.</p>";
      return;
    }

    ayudasSnap.forEach((docSnap) => {
      const ayuda = docSnap.data();
      const applied = ayuda.applicants && ayuda.applicants.includes(userId);

      ayudasList.innerHTML += `
        <div class="ayuda">
          <h3>${ayuda.title}</h3>
          <p>${ayuda.description}</p>
          <p><strong>Amount:</strong> ₱${ayuda.amount}</p>
          <p><strong>Status:</strong> ${ayuda.status}</p>
          ${
            ayuda.status === 'available'
              ? applied
                ? `<button disabled>Applied ✅</button>`
                : `<button onclick="applyAyuda('${docSnap.id}')">Apply</button>`
              : `<button disabled>Closed 🚫</button>`
          }
        </div>
      `;
    });
  } catch (error) {
    console.error("🔥 Error loading ayudas:", error);
    ayudasList.innerHTML = "<p>⚠️ Unable to load ayudas.</p>";
  }
}

// --- APPLY FUNCTION ---
window.applyAyuda = async (aid) => {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in.");

  try {
    const ayudaRef = doc(db, "ayudas", aid);
    await updateDoc(ayudaRef, {
      applicants: arrayUnion(user.uid)
    });

    alert("✅ Application submitted!");
    loadAyudas(user.uid);
  } catch (error) {
    console.error("🔥 Error applying for ayuda:", error);
    alert("⚠️ Failed to apply. Check console for details.");
  }
};

// --- SETTINGS BUTTON FUNCTION ---
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    window.location = 'update-profile.html';
  });
}
