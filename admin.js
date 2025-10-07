import { auth, db } from './firebase-config.js';
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const adminName = document.getElementById('adminName');
const logoutBtn = document.getElementById('logoutBtn');
const createBtn = document.getElementById('createBtn');
const ayudasList = document.getElementById('ayudasList');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = 'index.html';
    return;
  }

  // Check if user is admin
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'admin') {
    alert("Access denied. Admins only.");
    window.location = 'user-dashboard.html';
    return;
  }

  adminName.textContent = `Admin: ${user.email}`;
  loadAyudas();
});

// CREATE NEW AYUDA
createBtn.addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!title || !description || isNaN(amount)) {
    return alert('Please fill in all fields correctly.');
  }

  await addDoc(collection(db, 'ayudas'), {
    title,
    description,
    amount,
    status: 'available',
    applicants: [],
    approved: []
  });

  alert('✅ Ayuda created!');
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('amount').value = '';
  loadAyudas();
});

// LOAD ALL AYUDAS
async function loadAyudas() {
  ayudasList.innerHTML = '<p>Loading ayudas...</p>';
  const snapshot = await getDocs(collection(db, 'ayudas'));
  ayudasList.innerHTML = '';

  if (snapshot.empty) {
    ayudasList.innerHTML = '<p>No ayudas created yet.</p>';
    return;
  }

  snapshot.forEach(docSnap => {
    const ayuda = docSnap.data();

    ayudasList.innerHTML += `
      <div class="ayuda">
        <h3>${ayuda.title}</h3>
        <p>${ayuda.description}</p>
        <p><strong>Amount:</strong> ₱${ayuda.amount}</p>
        <p><strong>Status:</strong> ${ayuda.status}</p>

        <div class="admin-controls">
          <button class="view" onclick="viewApplicants('${docSnap.id}')">View Applicants</button>
          ${
            ayuda.status === 'available'
              ? `<button class="close" onclick="closeAyuda('${docSnap.id}')">Close Ayuda</button>`
              : `<button class="close" disabled>Closed</button>`
          }
        </div>
      </div>
    `;
  });
}

// CLOSE AYUDA
window.closeAyuda = async (id) => {
  await updateDoc(doc(db, 'ayudas', id), { status: 'closed' });
  alert('🚫 Ayuda closed!');
  loadAyudas();
};

// VIEW APPLICANTS
window.viewApplicants = async (id) => {
  const ayudaDoc = await getDoc(doc(db, 'ayudas', id));
  const ayuda = ayudaDoc.data();

  if (!ayuda.applicants || ayuda.applicants.length === 0) {
    alert('No applicants yet.');
    return;
  }

  let message = '📋 Applicants:\n';
  for (const uid of ayuda.applicants) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const user = userDoc.data();
      message += `• ${user.name} (${user.email})\n`;
    }
  }

  alert(message);
};

// LOGOUT
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location = 'index.html';
});
