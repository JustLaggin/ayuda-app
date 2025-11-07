import { auth, db } from '../firebase-config.js';
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
const requirementsList = document.getElementById('requirementsList');
const confirmApplyBtn = document.getElementById('confirmApplyBtn');
const fileUpload = document.getElementById('fileUpload');
const uploadedFilesPreview = document.getElementById('uploadedFilesPreview');
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
      userNameEl.textContent = `Welcome, ${data.fullName}`;

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
async function loadAyudas() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const ayudasSnap = await getDocs(collection(db, "ayudas"));
    ayudasList.innerHTML = "";

    if (ayudasSnap.empty) {
      ayudasList.innerHTML = "<p>No ayudas available yet.</p>";
      return;
    }

    ayudasSnap.forEach((docSnap) => {
      const ayuda = docSnap.data();

      // ✅ Check if user already applied
      const hasApplied = Array.isArray(ayuda.applicants)
        ? ayuda.applicants.includes(user.uid)
        : false;

      // ✅ Determine button state
      let buttonHTML = "";
      if (!ayuda.status) {
        // Ayuda closed
        buttonHTML = `<button disabled>Closed 🚫</button>`;
      } else if (hasApplied) {
        // User already applied
        buttonHTML = `<button disabled>Applied ✅</button>`;
      } else {
        // Available and user hasn’t applied
        buttonHTML = `<button onclick="applyAyuda('${docSnap.id}')">Apply</button>`;
      }

      // ✅ Build card
      ayudasList.innerHTML += `
        <div class="ayuda">
          <h3>${ayuda.title}</h3>
          <p>${ayuda.description || "No description available."}</p>
          <p><strong>Amount:</strong> ₱${ayuda.amount || 0}</p>
          <p><strong>Status:</strong> ${ayuda.status ? "Available ✅" : "Closed 🚫"}</p>
          <p><strong>Location:</strong> ${ayuda.city}, ${ayuda.barangay}</p>
          <p><strong>Distribution:</strong> ${formatDateOrTBA(ayuda.Distribution_date)}, ${ayuda.claiming_area } </p>
          ${buttonHTML}
        </div>
      `;
    });
  } catch (error) {
    console.error("🔥 Error loading ayudas:", error);
    ayudasList.innerHTML = "<p>⚠️ Unable to load ayudas.</p>";
  }
}


function formatDateOrTBA(dateValue) {
  // If the field is null, undefined, empty, or not valid
  if (!dateValue) return "TBA";

  // Firestore Timestamp → JS Date
  if (dateValue.seconds) {
    const date = new Date(dateValue.seconds * 1000);
    return date.toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  // If it’s already a date string
  const date = new Date(dateValue);
  return isNaN(date) ? "TBA" : date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// --- APPLY FUNCTION ---
window.applyAyuda = async (aid) => {
  const user = auth.currentUser;

  try {
    const userRef = doc(db, "users", user.uid);
    const ayudaRef = doc(db, "ayudas", aid);
    const ayudaSnap = await getDoc(ayudaRef);
    const ayuda = ayudaSnap.data();
    if(!ayuda.requirements == ''){
    // 🟢 Show the modal
    requirementsModal.style.display = 'flex';
    requirementsList.innerHTML = '<p>Loading requirements...</p>';

    // 🟢 Display ayuda requirements
    const reqs = Array.isArray(ayuda.requirements)
      ? ayuda.requirements
      : ayuda.requirements.split(',').map(r => r.trim());

    requirementsList.innerHTML = reqs
      .map((r, i) => `<p><strong>${i + 1}.</strong> ${r}</p>`)
      .join('');

    // 🟢 When user confirms application
    confirmApplyBtn.onclick = async () => {
      if (!uploadedFilesPreview.innerHTML == ''){

      await updateDoc(ayudaRef, {
        applicants: arrayUnion(user.uid)
      });

      await updateDoc(userRef, {
        Current_Ayudas: arrayUnion(aid)
      });

      alert("✅ Application submitted!");
      requirementsModal.style.display = 'none';
      loadAyudas(user.uid);} else alert('No Files Uploaded')
    };}else {
      await updateDoc(ayudaRef, {
        applicants: arrayUnion(user.uid)
      });

      await updateDoc(userRef, {
        Current_Ayudas: arrayUnion(aid)
      });

      alert("✅ Application submitted!");
      requirementsModal.style.display = 'none';
      loadAyudas(user.uid);
    }
  } catch (error) {
    console.error("🔥 Error applying for ayuda:", error);
    alert("⚠️ Failed to apply. Check console for details.");
  }
};


// --- SETTINGS BUTTON FUNCTION ---
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    window.location.href = '../../update-profile.html';
  });
}

closeRequirements.addEventListener('click', () => {
  requirementsModal.style.display = 'none';
});

fileUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  uploadedFilesPreview.innerHTML = '';

  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.classList.add('uploaded-file');
    fileItem.innerHTML = `
      <span>${file.name}</span>
      <button onclick="removeFile(${index})">&times;</button>
    `;
    uploadedFilesPreview.appendChild(fileItem);
  });

  // Store files temporarily in global for easy access during confirm
  window.selectedFiles = files;
});

// Remove a file from preview
window.removeFile = (index) => {
  window.selectedFiles.splice(index, 1);
  const dataTransfer = new DataTransfer();
  window.selectedFiles.forEach(file => dataTransfer.items.add(file));
  fileUpload.files = dataTransfer.files;
  fileUpload.dispatchEvent(new Event('change'));
};
